// PUBLIC TRANSPORT SETUPS...
function gateCurrentDate() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(currentDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    return formattedDate;
}

// MODULE SPECIFIC STUFF...
// 1. express...
const express = require('express');
// 2. session...
const session = require('express-session');
// 3. mongoose...
const mongoose = require('mongoose');
// 4. bodyParser...
const bodyParser = require('body-parser');
// 5. Corrected import
const { ObjectId } = require('mongoose');
const { Console } = require('console');

// GET APP FROM EXPRESS...
const app = express(); // use express...

// CONNECTION SPECIFIC STUFF...
async function connection() {
    await mongoose.connect('mongodb://127.0.0.1:27017/PTSs1');
    console.log("We are Connected");
}
connection();

// Set Default folder 
app.use('/css', express.static('css'));
app.use('/fonts', express.static('fonts'));
app.use('/images', express.static('images'));
app.use('/js', express.static('js'));
app.use('/media', express.static('media'));
app.use('/vendor', express.static('vendor'));

// SESSION SPECIFIC STUFF...
app.use(session({
    secret: 'userData', // a secret key to sign the session ID cookie
    resave: false,
    saveUninitialized: true
}));
// BODY PARSER SPECIFIC STUFF...
app.use(express.urlencoded());
// // EJS setup
app.set('view engine', 'ejs');




// Model specific Stuff.
const admin = mongoose.model('Admin', {
    UserName : String,
    Email : String,
    Password : String,
    Mobile : String,
    Image : String
}, 'Admin');
const user = mongoose.model('usermasters', {
    Name : String,
    City : String,
    Gender : String,
    DOB : String,
    Mobile : String,
    Email : String,
    Password : String,
    ProfileImage : String
}, 'usermasters');
const conductor = mongoose.model('Conductor', {
    FirstName : String,
    LastName : String,
    Phone : String,
    Username : String,
    Email : String,
    Password : String
}, 'Conductor');
const Buses = mongoose.model('Buses', {
    BusName: String,
    BusNumber: String,
    BusType: String,
    Image: String,
    Ratting: Number,
    Capacity: Number,
    Conductor: String
}, 'Buses');
const Booking = mongoose.model('Bookings', {
    userId: String,
    busId: String,
    timeId: String,
    seatNo: [Number]
}, 'Bookings');
const Timetable = mongoose.model('timetables', {
        from: String,
        to: String,
        on: Date,
        pickup: String,
        drop: String,
        Price: Number,
        Bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Buses' }
}, 'timetables');
const ConductorBooking = mongoose.model('conductorBookings', {
    Name : String,
    conductorId : String,
    busId : String,
    timeId : String,
    seetno : [Number],
    price : Number,
    totalseet : Number
}, 'conductorBookings');

// Pages
app.get('/', (req, res) => {
    res.render('login');
});



//Login page...
app.post('/adminlogin', async (req, res) => {
    const { email, pass } = req.body;
    try {
        const admindata = await admin.findOne({ Email: email });
        if (admindata.Email == email && admindata.Password == pass) {
            req.session.userName = email.split('@')[0];
            req.session.Email = email;
            req.session.userId = admindata._id;
            res.redirect('index');
        } else {
            res.render('loginError');
        }
    } catch (error) {
        console.log(error);
        res.send("Somthing Was Wants Wrong!.");
    }
});
app.get('/logout', (req, res) => {
    // Destroy the session to log out the user
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
        } else {
            // Redirect the user to the login page after logout
            res.redirect('/');
        }
    });
});

app.get('/index', async (req, res) => {
    try {
        if(req.session.userName != undefined) {
            const User = await user.countDocuments();
            const Conductor = await conductor.countDocuments();
            const Bus = await Buses.countDocuments();
            const Book = await Booking.find();
            let BookCount = 0;
            Book.forEach(id => {
                id.seatNo.forEach(no => {
                    BookCount++;
                })
            });
            
            // get This Week Info
            let totalOfThisWeek = 0;
            let totalEarn = 0;
            let money = 0;
                const today = new Date();
                const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay()); 
                const endOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 6);
                
                // Count Total Booking of this week 
                const timedata1 = await Timetable.find({
                on: {
                    $gte: startOfWeek,
                    $lt: endOfWeek
                }
                }).populate('Bus');
                for (const timetable of timedata1) {
                    const bookings = await Booking.find({ timeId: timetable._id.toString() });
                    bookings.forEach(bookingData => {
                        bookingData.seatNo.forEach(no => {
                            totalOfThisWeek++;
                        });
                    });
                }

                // Count total earn
                const timedata2 = await Timetable.find({}).populate('Bus');
                for (const timetable of timedata2) {
                    const bookings = await Booking.find({ timeId: timetable._id.toString() });
                    bookings.forEach(bookingData => {
                        let ticket1 = 0;
                        bookingData.seatNo.forEach(no => {
                            ticket1++;
                        });
                        totalEarn += ticket1 * timetable.Price;
                    });
                }

                // Booking Detail With all table.
                const bookingdata = await Booking.find({}).populate({
                                                                path: 'userId',
                                                                model: 'usermasters'
                                                            }).populate({
                                                                    path: 'busId',
                                                                    model: 'Buses'
                                                                }).populate({
                                                                        path: 'timeId',
                                                                        model: 'timetables'
                                                                    }).sort({ 'on': 'desc' }).exec();
                const Email = req.session.Email;
                const admindata = await admin.findOne({ Email: Email });
                const userData = await user.find();
                const conductorData = await conductor.find();
                const con_booking = await ConductorBooking.find();

                const timeData = await Timetable.find({}).populate('Bus').sort({ on: 'desc' }).exec();
                
                const data = {admin : admindata, book: bookingdata, user: userData, conductor: conductorData, time: timeData, con_book: con_booking};
                
                const Total = {User: User, Conductor: Conductor, Bus: Bus, Booking: BookCount, bookofThisWeek: totalOfThisWeek, totalEarn: totalEarn};
                
            res.render('index', {userName : req.session.userName, data : data, Total: Total});
        }
        else {
            res.redirect('/');
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Something went wrong.");
    }
    
});

app.post('/filter', async (req, res) => {
    console.log(req.body);
    const {time} = req.body;
    console.log(time);
    try {
        if(req.session.userName != undefined) {
            const User = await user.countDocuments();
            const Conductor = await conductor.countDocuments();
            const Bus = await Buses.countDocuments();
            const Book = await Booking.find();
            let BookCount = 0;
            Book.forEach(id => {
                id.seatNo.forEach(no => {
                    BookCount++;
                })
            });
            
            // get This Week Info
            let totalOfThisWeek = 0;
            let totalEarn = 0;
            let money = 0;
                const today = new Date();
                const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay()); 
                const endOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 6);
                
                // Count Total Booking of this week 
                const timedata1 = await Timetable.find({
                on: {
                    $gte: startOfWeek,
                    $lt: endOfWeek
                }
                }).populate('Bus');
                for (const timetable of timedata1) {
                    const bookings = await Booking.find({ timeId: timetable._id.toString() });
                    bookings.forEach(bookingData => {
                        bookingData.seatNo.forEach(no => {
                            totalOfThisWeek++;
                        });
                    });
                }

                // Count total earn
                const timedata2 = await Timetable.find({}).populate('Bus');
                for (const timetable of timedata2) {
                    const bookings = await Booking.find({ timeId: timetable._id.toString() });
                    bookings.forEach(bookingData => {
                        let ticket1 = 0;
                        bookingData.seatNo.forEach(no => {
                            ticket1++;
                        });
                        totalEarn += ticket1 * timetable.Price;
                    });
                }

                // Booking Detail With all table.
                const bookingdata = await Booking.find({}).populate({
                                                                path: 'userId',
                                                                model: 'usermasters'
                                                            }).populate({
                                                                    path: 'busId',
                                                                    model: 'Buses'
                                                                }).populate({
                                                                        path: 'timeId',
                                                                        model: 'timetables'
                                                                    }).sort({ 'on': 'desc' }).exec();
                const Email = req.session.Email;
                const admindata = await admin.findOne({ Email: Email });
                const userData = await user.find();
                const conductorData = await conductor.find();
                let timeData;
                if(time == 'today') {
                    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 0, 0, 0, -1);
                    timeData = await Timetable
                    .find({
                        on: { $gte: startOfDay, $lt: endOfDay }
                    })
                    .populate('Bus')
                    .sort({ on: 'desc' })
                    .exec();
                }
                else if(time == 'week') {
                    timeData = await Timetable
                    .find({
                        on: { $gte: startOfWeek, $lt: endOfWeek }
                    })
                    .populate('Bus')
                    .sort({ on: 'desc' })
                    .exec();
                }
                else if(time == 'month') {
                    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
                    timeData = await Timetable
                    .find({
                        on: { $gte: startOfMonth, $lt: endOfMonth }
                    })
                    .populate('Bus')
                    .sort({ on: 'desc' })
                    .exec();
                }
                else if(time == 'year') {
                    const startOfYear = new Date(today.getFullYear(), 0, 1);
                    const endOfYear = new Date(today.getFullYear() + 1, 0, 0, 23, 59, 59, 999);
                    timeData = await Timetable
                    .find({
                        on: { $gte: startOfYear, $lt: endOfYear }
                    })
                    .populate('Bus')
                    .sort({ on: 'desc' })
                    .exec();
                }
                else {
                    timeData = await Timetable.find({}).populate('Bus').sort({ on: 'desc' }).exec();
                }
                
                const data = {admin : admindata, book: bookingdata, user: userData, conductor: conductorData, time: timeData};
                const Total = {User: User, Conductor: Conductor, Bus: Bus, Booking: BookCount, bookofThisWeek: totalOfThisWeek, totalEarn: totalEarn};
                
            res.render('index', {userName : req.session.userName, data : data, Total: Total});
        }
        else {
            res.redirect('/');
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Something went wrong.");
    }
});

app.get('/deleteBooking', async (req, res) => {
    const {id} = req.query;
    try {
        const result = await Timetable.deleteOne({ _id: id});
        res.redirect('/index');
    } catch (error) {
        console.error(error);
    }
});

app.get('/addNewTime', async (req, res) => {
    try {
        if(req.session.userName != undefined) {
            const User = await user.countDocuments();
            const Conductor = await conductor.countDocuments();
            const Bus = await Buses.countDocuments();
            const Book = await Booking.find();
            let BookCount = 0;
            Book.forEach(id => {
                id.seatNo.forEach(no => {
                    BookCount++;
                })
            });
            
            // get This Week Info
            let totalOfThisWeek = 0;
            let totalEarn = 0;
            let money = 0;
                const today = new Date();
                const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay()); 
                const endOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 6);
                
                // Count Total Booking of this week 
                const timedata1 = await Timetable.find({
                on: {
                    $gte: startOfWeek,
                    $lt: endOfWeek
                }
                }).populate('Bus');

                for (const timetable of timedata1) {
                    const bookings = await Booking.find({ timeId: timetable._id.toString() });
                    bookings.forEach(bookingData => {
                        bookingData.seatNo.forEach(no => {
                            totalOfThisWeek++;
                        });
                    });
                }
                // Count total earn
                const timedata2 = await Timetable.find({}).populate('Bus');
                for (const timetable of timedata2) {
                    const bookings = await Booking.find({ timeId: timetable._id.toString() });
                    bookings.forEach(bookingData => {
                        let ticket1 = 0;
                        bookingData.seatNo.forEach(no => {
                            ticket1++;
                        });
                        totalEarn += ticket1 * timetable.Price;
                    });
                }
                // Booking Detail With all table.
                const bookingdata = await Booking.find({}).populate({
                                                                path: 'userId',
                                                                model: 'usermasters'
                                                            }).populate({
                                                                    path: 'busId',
                                                                    model: 'Buses'
                                                                }).populate({
                                                                        path: 'timeId',
                                                                        model: 'timetables'
                                                                    }).sort({ 'timeId.on': 'desc' }).exec();
                // console.log("user Detail =", bookingdata[0].userId.City);

                const Email = req.session.Email;
                const admindata = await admin.findOne({ Email: Email });
                const userData = await user.find();
                const conductorData = await conductor.find();
                const busData = await Buses.find();

                const data = {admin : admindata, user: userData, conductor: conductorData, bus: busData, book: bookingdata};
                const Total = {User: User, Conductor: Conductor, Bus: Bus, Booking: BookCount, bookofThisWeek: totalOfThisWeek, totalEarn: totalEarn};
            res.render('addNewTime', {userName : req.session.userName, data : data, Total: Total});
        }
        else {
            res.redirect('/');
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Something went wrong.");
    }
});
app.post('/addTime', async (req, res) => {
    console.log(req.body);
    const {from, to, on, pickup, drop, price, bus } = req.body;

    const savedTimetable = await Timetable.create({
        from,
        to,
        on: new Date(on),
        pickup,
        drop,
        Price: price,
        Bus: bus 
    });
    if(savedTimetable) {
        res.redirect('/index');
    }
})

app.get('/addBuses', async (req, res) => {
    try {
        if(req.session.userName != undefined) {
            const User = await user.countDocuments();
            const Conductor = await conductor.countDocuments();
            const Bus = await Buses.countDocuments();
            const Book = await Booking.find();
            let BookCount = 0;
            Book.forEach(id => {
                id.seatNo.forEach(no => {
                    BookCount++;
                })
            });
            
            // get This Week Info
            let totalOfThisWeek = 0;
            let totalEarn = 0;
            let money = 0;
                const today = new Date();
                const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay()); 
                const endOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 6);
                
                // Count Total Booking of this week 
                const timedata1 = await Timetable.find({
                on: {
                    $gte: startOfWeek,
                    $lt: endOfWeek
                }
                }).populate('Bus');

                for (const timetable of timedata1) {
                    const bookings = await Booking.find({ timeId: timetable._id.toString() });
                    bookings.forEach(bookingData => {
                        bookingData.seatNo.forEach(no => {
                            totalOfThisWeek++;
                        });
                    });
                }
                // Count total earn
                const timedata2 = await Timetable.find({}).populate('Bus');
                for (const timetable of timedata2) {
                    const bookings = await Booking.find({ timeId: timetable._id.toString() });
                    bookings.forEach(bookingData => {
                        let ticket1 = 0;
                        bookingData.seatNo.forEach(no => {
                            ticket1++;
                        });
                        totalEarn += ticket1 * timetable.Price;
                    });
                }
                // Booking Detail With all table.
                const bookingdata = await Booking.find({}).populate({
                                                                path: 'userId',
                                                                model: 'usermasters'
                                                            }).populate({
                                                                    path: 'busId',
                                                                    model: 'Buses'
                                                                }).populate({
                                                                        path: 'timeId',
                                                                        model: 'timetables'
                                                                    }).sort({ 'timeId.on': 'desc' }).exec();
                // console.log("user Detail =", bookingdata[0].userId.City);

                const Email = req.session.Email;
                const admindata = await admin.findOne({ Email: Email });
                const userData = await user.find();
                const conductorData = await conductor.find();
                const busData = await Buses.find();

                const data = {admin : admindata, user: userData, conductor: conductorData, bus: busData, book: bookingdata};
                const Total = {User: User, Conductor: Conductor, Bus: Bus, Booking: BookCount, bookofThisWeek: totalOfThisWeek, totalEarn: totalEarn};
            res.render('addBuses', {userName : req.session.userName, data : data, Total: Total});
        }
        else {
            res.redirect('/');
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Something went wrong.");
    }
});
app.post('/addBus', async (req, res) => {
    const {BusName, BusNumber, BusType, Capacity, Conductor } = req.body;
    const savedBus = await Buses.create({
        BusName,
        BusNumber,
        BusType,
        Image: BusName+'.jpg',
        Capacity,
        Conductor: Conductor
    });

    if(savedBus) {
        res.redirect('/index')
    }
});
app.get('/addNewConductor', async (req, res) => {
    try {
        if(req.session.userName != undefined) {
            const User = await user.countDocuments();
            const Conductor = await conductor.countDocuments();
            const Bus = await Buses.countDocuments();
            const Book = await Booking.find();
            let BookCount = 0;
            Book.forEach(id => {
                id.seatNo.forEach(no => {
                    BookCount++;
                })
            });
            
            // get This Week Info
            let totalOfThisWeek = 0;
            let totalEarn = 0;
            let money = 0;
                const today = new Date();
                const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay()); 
                const endOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 6);
                
                // Count Total Booking of this week 
                const timedata1 = await Timetable.find({
                on: {
                    $gte: startOfWeek,
                    $lt: endOfWeek
                }
                }).populate('Bus');

                for (const timetable of timedata1) {
                    const bookings = await Booking.find({ timeId: timetable._id.toString() });
                    bookings.forEach(bookingData => {
                        bookingData.seatNo.forEach(no => {
                            totalOfThisWeek++;
                        });
                    });
                }
                // Count total earn
                const timedata2 = await Timetable.find({}).populate('Bus');
                for (const timetable of timedata2) {
                    const bookings = await Booking.find({ timeId: timetable._id.toString() });
                    bookings.forEach(bookingData => {
                        let ticket1 = 0;
                        bookingData.seatNo.forEach(no => {
                            ticket1++;
                        });
                        totalEarn += ticket1 * timetable.Price;
                    });
                }
                // Booking Detail With all table.
                const bookingdata = await Booking.find({}).populate({
                                                                path: 'userId',
                                                                model: 'usermasters'
                                                            }).populate({
                                                                    path: 'busId',
                                                                    model: 'Buses'
                                                                }).populate({
                                                                        path: 'timeId',
                                                                        model: 'timetables'
                                                                    }).sort({ 'timeId.on': 'desc' }).exec();
                // console.log("user Detail =", bookingdata[0].userId.City);

                const Email = req.session.Email;
                const admindata = await admin.findOne({ Email: Email });
                const userData = await user.find();
                const conductorData = await conductor.find();
                const busData = await Buses.find();

                const data = {admin : admindata, user: userData, conductor: conductorData, bus: busData, book: bookingdata};
                const Total = {User: User, Conductor: Conductor, Bus: Bus, Booking: BookCount, bookofThisWeek: totalOfThisWeek, totalEarn: totalEarn};
            res.render('addNewConductor', {userName : req.session.userName, data : data, Total: Total});
        }
        else {
            res.redirect('/');
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Something went wrong.");
    }
});
app.post('/addConductor', async (req, res) => {
    const {FirstName, LastName, Phone, Username, Email, Password} = req.body;
    const savedConductor = await conductor.create({
        FirstName, 
        LastName, 
        Phone, 
        Username, 
        Email, 
        Password
    });

    if(savedConductor) {
        res.redirect('/index')
    }
});

app.get('/table', async (req, res) => {
    try {
        if(req.session.userName != undefined) {
            const User = await user.countDocuments();
            const Conductor = await conductor.countDocuments();
            const Bus = await Buses.countDocuments();
            const Book = await Booking.find();
            let BookCount = 0;
            Book.forEach(id => {
                id.seatNo.forEach(no => {
                    BookCount++;
                })
            });
            
            // get This Week Info
            let totalOfThisWeek = 0;
            let totalEarn = 0;
            let money = 0;
                const today = new Date();
                const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay()); 
                const endOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 6);
                
                // Count Total Booking of this week 
                const timedata1 = await Timetable.find({
                on: {
                    $gte: startOfWeek,
                    $lt: endOfWeek
                }
                }).populate('Bus');

                for (const timetable of timedata1) {
                    const bookings = await Booking.find({ timeId: timetable._id.toString() });
                    bookings.forEach(bookingData => {
                        bookingData.seatNo.forEach(no => {
                            totalOfThisWeek++;
                        });
                    });
                }
                // Count total earn
                const timedata2 = await Timetable.find({}).populate('Bus');
                for (const timetable of timedata2) {
                    const bookings = await Booking.find({ timeId: timetable._id.toString() });
                    bookings.forEach(bookingData => {
                        let ticket1 = 0;
                        bookingData.seatNo.forEach(no => {
                            ticket1++;
                        });
                        totalEarn += ticket1 * timetable.Price;
                    });
                }
                // Booking Detail With all table.
                const bookingdata = await Booking.find({}).populate({
                                                                path: 'userId',
                                                                model: 'usermasters'
                                                            }).populate({
                                                                    path: 'busId',
                                                                    model: 'Buses'
                                                                }).populate({
                                                                        path: 'timeId',
                                                                        model: 'timetables'
                                                                    }).sort({ 'timeId.on': 'desc' }).exec();
                // console.log("user Detail =", bookingdata[0].userId.City);

                const Email = req.session.Email;
                const admindata = await admin.findOne({ Email: Email });
                const userData = await user.find();
                const conductorData = await conductor.find();
                const busData = await Buses.find();

                const data = {admin : admindata, user: userData, conductor: conductorData, bus: busData, book: bookingdata};
                const Total = {User: User, Conductor: Conductor, Bus: Bus, Booking: BookCount, bookofThisWeek: totalOfThisWeek, totalEarn: totalEarn};
            res.render('table', {userName : req.session.userName, data : data, Total: Total});
        }
        else {
            res.redirect('/');
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Something went wrong.");
    }
    
});

// SERVER SPECIFIC STUFF...
    const server = app.listen(process.env.PORT || 80, () => {
        console.log(`Hacker news server started on port: ${server.address().port} http://localhost:80`);
    });