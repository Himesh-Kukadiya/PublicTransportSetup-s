// PUBLIC TRANSPORT SETUPS...
function gateCurrentDate() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(currentDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    return formattedDate;
}
function sendMail(subject,msg,email) {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: 'publictransportsetup@gmail.com',
            pass: 'jbbjqsrplkcgniyz',
        },
        tls: {
            rejectUnauthorized: false,
            }
        });
                    
        //Setup email data
        const mailOptions = {
        from: 'publictransportsetup@gmail.com',
        to: email,
        subject: subject,
        text: msg,
        html: '',
        };
                    // Send email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log('Error:', error);
            }
        console.log('Message sent:', info.messageId);
    });
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

// GET APP FROM EXPRESS...
const app = express(); // use express...

// CONNECTION SPECIFIC STUFF...
async function connection() {
    await mongoose.connect('mongodb://127.0.0.1:27017/PTSs1');
    console.log("We are Connected");
}
connection();

app.use(session({
    secret: 'username',
    resave: true,
    saveUninitialized: true
}));

// MODAL SPECIFIC STUFF...
const user = mongoose.model('usermasters', {
    "Name" : String,
    "City" : String,
    "Gender" : String,
    "DOB" : String,
    "Mobile" : String,
    "Email" : String,
    "Password" : String,
    "ProfileImage" : String
}, 'usermasters');
const conductor = mongoose.model('Conductor', {
    Email: String,
    Password: String
}, 'Conductor');
const busModal = mongoose.model('Buses', {
    BusName: String,
    BusNumber: String,
    BusType: String,
    Image: String,
    Rating: Number,
    Capacity: Number,
    ConductorId: String,
}, 'Buses');
const timetable = mongoose.model('timetables', {
    from: String,
    to: String,
    on: Date,
    pickup: String,
    drop: String,
    Price: Number,
    Bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Buses' }
}, 'timetables');
const Booking = mongoose.model('Bookings', {
    _id: mongoose.Schema.Types.ObjectId,  // Let Mongoose generate the ObjectId
    userId: String,
    busId: String,
    timeId: String,
    seatNo: [Number]
}, 'Bookings');
const conductorbooking = mongoose.model('conductorBookings', {
    "Name" : String,
    "conductorId" : String,
    "busId" : String,
    "timeId" : String,
    "seetno" : [Number],
    "price" : Number,
    "totalseet" : Number
}, 'conductorBookings');
const conductorConfirmation = mongoose.model('conductorConfirmation', {
    conductorId : String,
    userId : String, 
    timeId : String,
    bookingId : String, 
    Name : String, 
    Email : String, 
    seat : [Number]
}, 'conductorConfirmation');
// BODY PARSER SPECIFIC STUFF...
app.use(express.urlencoded());

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));

// SET DEFAULT FOLDERS...
app.use('/fonts', express.static('fonts'));
app.use('/images', express.static('images'));
app.use('/js', express.static('js'));
app.use('/plugins', express.static('plugins'));
app.use('/styles', express.static('styles'));
app.use('/admin', express.static('admin'));

// // EJS setup
app.set('view engine', 'ejs'); // set view directory as ejs...

// EXPRESS END-POINTS...
//  I. Get Requests.
// 1. index.
    app.get('/', (req, res) => {
        if(req.session.username == undefined) {
            res.render('index', { username: ""})
        }
        else {
            res.render('index', { username: req.session.username})
        }
    });

// Conductor specific stuff.

// 1 Login...
    app.post('/conductorlogin', async (req, res) => {
        const { email, pass } = req.body;
        try {
            const data = await conductor.findOne({ Email: email});
            if (data.Email == email && data.Password == pass) {
                req.session.username = email.split('@')[0];
                req.session.userid = data._id;
                res.render('dashboard', { username: email.split('@')[0] });
            } else {
                res.render('loginError');
            }
        } catch (error) {
            console.log(error);
            res.send("Somthing Was Wants Wrong!.");
        }
    })
// 2 Logout...
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
// 3 Dashboard
    app.get('/dashboard', (req, res)=> {
        if(req.session.username == undefined) {
            res.render('dashboard', { username: ""})
        }
        else {
            res.render('dashboard', { username: req.session.username})
        }
    });
// 4 my Bus...
    app.get('/mybus', async (req, res)=> {
        if(req.session.userid != undefined) {
            const id = req.session.userid;
            try {
                const buses = await busModal.findOne({ConductorId : id});
                // console.log("bus id : " + busId);
                const date = gateCurrentDate();
                console.log(date);
                // const date = "2023-12-03";
                const busId = buses._id;
                let price = 0;
                const time = await timetable.findOne({ Bus: busId, on: new Date(date) }).exec();
                // console.log(time);
                // res.render('mybus', {seetinfo: time});
                // res.json(time);
                if(time != undefined) {
                    const timeId = time._id;
                    // console.log("time id : " + timeId);
                    const seats = await Booking.find({busId: busId, timeId: timeId}); 
                    const allSeatNumbers = [];
                        seats.forEach(seetno => {
                            seetno.seatNo.forEach(seetbooked => {
                            allSeatNumbers.push(seetbooked);
                        });
                    });
                    const confirmseets = await conductorbooking.find({busId: busId, timeId: timeId});
                    const newSeats = [];
                    confirmseets.forEach(seetno => {
                        seetno.seetno.forEach(seetconfirm => {
                            newSeats.push(seetconfirm);
                        });
                    });

                    const confirmseet = [];
                    const conductorConfirm = await conductorConfirmation.find({timeId: timeId});
                    console.log('conductor seats : ' + conductorConfirm);
                    conductorConfirm.forEach(no => {
                        no.seat.forEach(seetno => {
                            confirmseet.push(seetno);
                        })
                    });

                    console.log("time id : " + timeId);
                    if(req.session.username == undefined) {
                        res.render('mybus', { allSeatNumbers: allSeatNumbers, confirmseet : confirmseet, newSeats : newSeats, busId: busId, timeId: timeId, username: ""});
                    }
                    else {
                        res.render('mybus', { allSeatNumbers: allSeatNumbers, confirmseet : confirmseet, newSeats : newSeats, busId: busId, timeId: timeId, username: req.session.username});
                    }
                } else {
                    res.send("your Bus not Find");
                }
            } catch (err) {
                console.error(err);
                res.send(err);
            }
        }
        else {
            res.send("Login First");
        }
    });
    app.get('/userDetail', async (req, res)=> {
        console.log(req.session.userid);
        const {seetno, busId, timeId} = req.query;
        try {
            let userId = "";
            let bookingId = "";
            const time = await timetable.findById(timeId).exec();
            const price = time.Price;
            const seats = await Booking.find({busId: busId, timeId: timeId});
            // console.log(seats)
            seats.forEach((seat) => {
                seat.seatNo.forEach((bookedseet) => {
                    if(bookedseet == seetno) {
                        userId = seat.userId;
                        bookingId = seat._id.toString();
                    }
                });
            });
            const usersBookedSeet = await Booking.find({busId: busId, timeId: timeId, userId : userId});
            let allSeetno = [];
            let totalseet = 0;
            usersBookedSeet.forEach((seat) => {
                seat.seatNo.forEach((bookedseet) => {
                    allSeetno.push(bookedseet);
                    totalseet++;
                });
            });
            
            let username = "";
            const userdetaill = await user.findById(userId).exec();
            // console.log("Email : " );
            res.render('userDetail', { username: req.session.username, userdata : userdetaill, seetno : allSeetno, totalseet: totalseet, price : price, busId : busId, timeId: timeId, bookingId : bookingId});
            

        } catch (error) {
            console.error('Error fetching seats:', error);
            res.status(500).send('Internal Server Error');
        }
        // console.log(seetno + "    " + busid + "   " + timeid);
        
    });
    app.get('/conductorSeet', async (req, res)=> {
        console.log(req.session.userid);
        if(req.session.userid != undefined)
        {
            const conductorId = req.session.userid;
            const {seetno, busId, timeId} = req.query;
            try {
                const seetDetail = await conductorbooking.find( {conductorId: conductorId, busId : busId, timeId: timeId});
                
            } catch (error) {
                console.error('Error fetching seats:', error);
                res.status(500).send('Internal Server Error');
            }
        }
    });

// Post Requests
    app.post('/seetConfirm', async (req, res) => {
        const {userId, bookingId, Name, Email, seat} = req.body;
        const seatNumbers = seat.map(Number);
        console.log(seatNumbers);
        if(req.session.userid == undefined) {
            res.send("login Frist");
        }
        else {

            const booking = await Booking.findById(bookingId);
            // console.log(booking.timeId);

            const conductorId = req.session.userid;
            const newConfirmation = await conductorConfirmation.create({
                conductorId,
                userId,
                timeId : booking.timeId,
                bookingId,
                Name,
                Email,
                seat: seatNumbers
            });
        }
        
        const subject = 'PTSs Travalling Confirmation';
        const msg = 'hello . You have a travaling at ' + gateCurrentDate() + ' with seetno ' + req.body.seat;
        sendMail(subject,msg,Email);
        res.redirect('/mybus');
    });
    app.post('/newTicket', async (req, res)=> {
        try {
            const time = await timetable.findById(req.body.timeId).exec();
            if(time != undefined) {
                let totalseet = 0;
                req.body.seatNo.forEach((no) => {
                    totalseet++;
                })
                if( req.session.username != undefined)
                    res.render('newTicket', {data : req.body, username: req.session.username, price : time.Price, totalseet : totalseet});
                else 
                    res.send('login First');
            }
            else {
                res.send("Bus Not Find");
            }
        }
        catch(err) {
            console.error(err);
            res.send(err);
        }
    });
    app.post('/newTicketConfirm', async (req, res)=> {
        try {
            console.log(req.body)
            try {
                if(req.session.userid != undefined) {
                    const newBooking = {
                        "Name" : req.body.name,
                        "conductorId" : req.session.userid,
                        "busId" : req.body.busId,
                        "timeId" : req.body.timeId,
                        "seetno" : req.body.seetno,
                        "price" : req.body.price,
                        "totalseet" : req.body.totalseet
                    }

                    conductorbooking.create(newBooking)
                    .then(createdDocument => {
                        res.redirect('/dashboard')
                    })
                    .catch(error => {
                        console.error('Error creating document:', error);
                    });
                }
                else {
                    res.send("Login First")
                }
            }
            catch(err) {
                console.error(err);
                res.send(err);
            }
        } catch (error) {
            console.error('Error fetching seats:', error);
            res.status(500).send('Internal Server Error');
        }
    });


// SERVER SPECIFIC STUFF...
    const server = app.listen(process.env.PORT || 81, () => {
        console.log(`Hacker news server started on port: ${server.address().port} http://localhost:81`);
    });








