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
function GetOtp() {
    return Math.floor(100000 + Math.random() * 900000);
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
// 6. Payment gateway
const Razorpay = require('razorpay');
// GET APP FROM EXPRESS...
const app = express(); // use express...

// CONNECTION SPECIFIC STUFF...
async function connection() {
    await mongoose.connect('mongodb://127.0.0.1:27017/PTSs1');
    console.log("We are Connected");
}
connection();

// MODAL SPECIFIC STUFF...
// const user = mongoose.model('usermasters', {
//     Email: String,
//     Password: String
// }, 'usermasters');

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
    Email: String,
    Password: String
}, 'Conductor');
const Timetable = require('./Modals/busTimeModal');
const Buses = mongoose.model('Buses', {
    BusName: String,
    BusNumber: String,
    BusType: String,
    Image: String,
    Ratting: Number,
    Capacity: Number
}, 'Buses');

const Booking = require('./Modals/BookingModal');

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
// SET DEFAULT FOLDERS...
app.use('/fonts', express.static('fonts'));
app.use('/images', express.static('images'));
app.use('/js', express.static('js'));
app.use('/plugins', express.static('plugins'));
app.use('/styles', express.static('styles'));
app.use('/admin', express.static('admin'));
// SESSION SPECIFIC STUFF...
app.use(session({
    secret: 'userData', // a secret key to sign the session ID cookie
    resave: false,
    saveUninitialized: true
}));

const razorpay = new Razorpay({
    key_id: 'rzp_test_cX0VB9927mioP6',
    key_secret: '7Oh9gRs0E4NyRPptXpFE7g03',
});

// BODY PARSER SPECIFIC STUFF...
app.use(express.urlencoded());

// // EJS setup
app.set('view engine', 'ejs'); // set view directory as ejs...

// EXPRESS END-POINTS...
//  I. Login and Logout
// a. user     
    app.post('/userlogin', async (req, res) => {
        const { email, pass } = req.body;
        try {
            console.log(email + "   " + pass);
            const data = await user.findOne({ Email: email, Password : pass });
            console.log(data.Email + "    " + data.Password);
            if (data.Email == email && data.Password == pass) {
                req.session.username = email.split('@')[0];
                req.session.userid = data._id;
                res.render('index', { username: email.split('@')[0] });
            } else {
                res.render('loginError');
            }
        } catch (error) {
            console.log(error);
            res.send("Somthing Was Wants Wrong!.");
        }
    });
// b. conductor 
    app.post('/conductorlogin', async (req, res) => {
        const { email, pass } = req.body;
        try {
            console.log(email + "   " + pass);
            const data = await conductor.findOne({ Email: email, Password : pass });
            console.log(data.Email + "    " + data.Password);
            if (data.Email == email && data.Password == pass) {
                req.session.username = email.split('@')[0];
                req.session.userid = data._id;
                res.render('./conductor/index', { username: email.split('@')[0] });
            } else {
                res.render('loginError');
            }
        } catch (error) {
            console.log(error);
            res.send("Somthing Was Wants Wrong!.");
        }
    })
// c. admin 
    app.post('/adminlogin', async (req, res) => {
        const { email, pass } = req.body;
        try {
            console.log(email + "   " + pass);
            const admindata = await admin.findOne({ Email: email });
            console.log(admindata.Email);
            if (admindata.Email == email && admindata.Password == pass) {
                req.session.username = email.split('@')[0];
                res.render('exp/index', { username: req.session.username });
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

// Registration
    app.post('/register', (req, res) => {
        const { userName, city, gender, dob, number, email, pass, conpass } = req.body;

        // Check if passwords match
        if (pass !== conpass) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }

        // Create a new user using the existing registrationModal model
        const newUser = new user({
            Name: userName,
            City : city,
            Gender : gender,
            DOB : dob,
            Mobile : number,
            Email : email,
            Password : pass,
            ProfileImage : "../Image/userProfile/default.png"
        });

        // Save the user to the database
        newUser.save().then(savedUser => {
            // Handle success, e.g., send a response back to the client
            req.session.username = email.split('@')[0];
            res.render('index', { username: email.split('@')[0] });
        })
        .catch(error => {
            // Handle error, e.g., send an error response to the client
            res.status(500).json({ error: 'Internal Server Error', details: error.message });
        });
    });

// forget Password
    app.post('/forgerPass', async (req, res) => {
        const {email} = req.body;
        const data = await user.findOne({ Email: email});
        let otp = GetOtp();
        if(data != null) {
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
                    to: data.Email,
                    subject: 'PTSs Forget Password',
                    text: 'Hello ' + data.Name + ' your Code is ' + otp + '. your password will be forgeted using this code.',
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
        
        if(req.session.username == undefined) {
            res.render('forgetpass', { username: "", systemotp : otp, email: email})
        }
        else {
            res.render('forgetpass', { username: req.session.username, systemotp : otp, email: email})
        }
    });
    app.post('/varifyotp', async (req, res) => {
        console.log(req.body);
        const {systemotp, email, userotp} = req.body;
        if(systemotp == userotp) {
            res.render('forgetpasspass', { username: "", email: email})
        }
        else {
            res.render('invalidcode', {systemotp : systemotp, email: email})
        }
    });
    app.get('/invalidcode', async (req, res) => {
        console.log(req.query);
        const {systemotp, email} = req.query;
        if(req.session.username == undefined) {
            res.render('forgetpass', { username: "", systemotp : systemotp, email: email})
        }
        else {
            res.render('forgetpass', { username: req.session.username, systemotp : systemotp, email: email})
        }
    });
    app.post('/forgetPassword', async (req, res) => { 
        console.log(req.body);
        const {email, pass, conpass} = req.body;

        if(pass == conpass) {
            const data = await user.findOne({ Email: email});
            if(data != null) {
                user.updateOne({ _id: data._id }, { $set: { Password: pass } }).exec();
                req.session.username = email.split('@')[0];
                req.session.userid = data._id;
                res.render('index', { username: email.split('@')[0] });
            }
        }
        else {
            res.send("password not mathed");
        }
    });

// 1. Pages.
    app.get('/', (req, res) => {
        console.log(req.session.username);
        if(req.session.username == undefined) {
            res.render('index', { username: ""})
        }
        else {
            res.render('index', { username: req.session.username})
        }
    });
    app.get('/about', (req, res) => {
        if(req.session.username == undefined) {
            res.status(200).render('about.ejs', {username: ""});
        }
        else {
            res.status(200).render('about.ejs', {username: req.session.username});
        }
    });
    app.get('/blog', (req, res) => {
        if(req.session.username == undefined) {
            res.status(200).render('blog.ejs', {username: ""});
        }
        else {
            res.status(200).render('blog.ejs', {username: req.session.username});
        }
    });
    app.get('/contact', (req, res) => {
        if(req.session.username == undefined) {
            res.status(200).render('contact.ejs', {username: ""});
        }
        else {
            res.status(200).render('contact.ejs', {username: req.session.username});
        }
    });
    app.get('/elements', (req, res) => {
        if(req.session.username == undefined) {
            res.status(200).render('elements.ejs', {username: ""});
        }
        else {
            res.status(200).render('elements.ejs', {username: req.session.username});
        }
    });
    app.get('/offers', (req, res) => {
        if(req.session.username == undefined) {
            res.status(200).render('offers.ejs', {username: ""});
        }
        else {
            res.status(200).render('offers.ejs', {username: req.session.username});
        }
    });
    app.get('/single_listing', (req, res) => {
        if(req.session.username == undefined) {
            res.status(200).render('blog.ejs', {username: ""});
        }
        else {
            res.status(200).render('single_listing.ejs', {username: req.session.username});
        }
    });

// bus Details
    //1. find bus
    app.post('/findbus', async (req, res) => {
        const { from, to, date } = req.body;
        try {
            const busesAndTimetables = await Timetable.aggregate([
                {
                    $match: {
                        from: from,
                        to: to,
                        on: new Date(date)
                    }
                },
                {
                    $lookup: {
                        from: "Buses",
                        localField: "Bus",
                        foreignField: "_id",
                        as: "busDetails"
                    }
                },
                {
                    $unwind: "$busDetails"
                },
                {
                    $project: {
                        _id: 1,
                        from: 1,
                        to: 1,
                        on: 1,
                        pickup: 1,
                        drop: 1,
                        Price: 1,
                        Bus: "$busDetails" 
                    }
                }
            ]).exec();
            console.log('busesAndTimetables:', busesAndTimetables);
            if(req.session.username == undefined) {
                res.render('buslist', { bus: busesAndTimetables, username: ""});
            }
            else {
                res.render('buslist', { bus: busesAndTimetables, username: req.session.username});
            }

            
        }
        catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    });
    // Seat List.
    app.get('/seetlist', async (req, res) => {
        const { busId, timeId } = req.query;
        console.log("Bus id = " + busId + " Timetable Id = " + timeId);
        try {
            console.log('Attempting to fetch seats...');
            const seats = await Booking.find({busId: busId, timeId: timeId}); // Use find() instead of findOne()
            // console.log('All seats:', seats);
            const allSeatNumbers = [];
            
            seats.forEach(seetno => {
                seetno.seatNo.forEach(seetbooked => {
                    allSeatNumbers.push(seetbooked);
                });
            });
            const userId = req.session.userid;
            const usersSeat = [];
            if(userId != undefined) {
                const userbookedseat = await Booking.find({busId: busId, timeId: timeId, userId: userId});
                console.log(userbookedseat);
                userbookedseat.forEach(youseatno => {
                    
                    youseatno.seatNo.forEach(yourseat => {
                        usersSeat.push(yourseat);
                    });
                });
                console.log(allSeatNumbers);
                console.log(usersSeat);
            }
            const time = await Timetable.findById(timeId).exec();
            console.log(time);
            if(req.session.username == undefined) {
                res.render('seetlist', { allSeatNumbers: allSeatNumbers, yourseat: usersSeat, busId: busId, timeId: timeId, time: time, username: ""});
            }
            else {
                res.render('seetlist', { allSeatNumbers: allSeatNumbers, yourseat: usersSeat, busId: busId, timeId: timeId, time: time, username: req.session.username});
            }
            //  Pass the array to the template
        } catch (error) {
            console.error('Error fetching seats:', error);
            res.status(500).send('Internal Server Error');
        }
    });

// booking specific stuff..
app.post('/booknow', async (req, res) => {
    if (req.session.username == undefined) {
        res.render('loginfirstMessage');
    } else {
        const { busId, timeId, seatNo, amount } = req.body;
        console.log(req.body);

        const seatNumbers = Array.isArray(seatNo) ? seatNo.map(Number) : [seatNo];
        const userId = req.session.userid;
        let newSeatNumbers = [];

        try {
            const options = {
                amount: amount * 100,
                currency: 'INR',
                receipt: 'order_receipt_' + Math.floor(Date.now() / 1000),
            };
            const order = await razorpay.orders.create(options);

            // Check if Booking document exists for the specified criteria
            let seats = await Booking.findOne({ busId: busId, timeId: timeId, userId: userId });

            if (seats) {
                newSeatNumbers = seats.seatNo.concat(seatNumbers);
                console.log(newSeatNumbers);
            } else {
                newSeatNumbers = seatNumbers;
            }

            res.render('payment', { order, busId, timeId, newSeatNumbers });

        } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    }
});

    app.get('/success', async(req, res) => {
        if(req.session.username == undefined) {
            res.render('loginfirstMessage')
        }
        else {
            const {busId, timeId, seet} = req.query;
            const seatArray = seet.split(',');
            const seatNumbers = seatArray.map(Number);
            console.log(seatNumbers);
            const userId = req.session.userid;
            try {
                const seats = await Booking.findOne({busId: busId, timeId: timeId, userId: userId});
                if(seats != null) {
                    Booking.updateOne({ _id: seats._id }, { $set: { seatNo: seatNumbers } }).exec();
                }
                else {
                    const newBooking = await Booking.create({
                        userId,
                        busId,
                        timeId,
                        seatNo : seatNumbers
                    });
                }
                const data = await user.findById(userId).exec();
                const time = await Timetable.findById(timeId).exec();
                const bus = await Buses.findById(busId).exec();
                msg = 'hello '+ data.Name +'. You Booked seat on ' + gateCurrentDate() + ' from '+ time.from +' to ' + time.to +'. your pickup time is '+ time.pickup +'. your seat no is ' + seatNumbers  +' per '+ time.Price +'your bus name is ' + bus.BusName + ' and number is ' + bus.BusNumber + '.';
                email = data.Email;
                sendMail("PTSs Seat Booking", msg, email);

                res.redirect('/seetlist?busId='+busId+'&timeId='+timeId);
            } catch (error) {
                console.error(error);
                res.status(500).send('Internal Server Error');
            }
        }
    });
    app.get('/cancel', async (req, res) => { 
        const { busId, timeId } = req.query;
        if(req.session.username == undefined) {
            res.render('loginfirstMessage');
        }
        else {
            userId = req.session.userid;
            const seats = await Booking.find({busId: busId, timeId: timeId, userId: userId});
            console.log(seats);
            const usersSeat = [];

            seats.forEach(youseatno => {
                youseatno.seatNo.forEach(yourseat => {
                    usersSeat.push(yourseat);
                });
            });
            
            res.render('cancel', { username: req.session.username,busId: busId, timeId : timeId, usersSeat : usersSeat });
        }
    });
    app.post('/seatCancel', async (req, res) => {
        const { busId, timeId, seat } = req.body;
        if(req.session.username == undefined) {
            res.render('loginfirstMessage')
        } else {
            const userId = req.session.userid;
            const seats = await Booking.findOne({busId: busId, timeId: timeId, userId: userId});
            let oldseats = seats.seatNo;
            let cancelseat = seat.map(Number);
            let newseats =  seats.seatNo.filter(item => !cancelseat.includes(item));

            const data = await user.findById(userId).exec();
                const time = await Timetable.findById(timeId).exec();
                const bus = await Buses.findById(busId).exec();
                console.log(busId)
                console.log(bus);
                let message = "";
                if(newseats.length == 0) {
                    message = 'hello '+ data.Name +'. You canceled your all seat '+ cancelseat +' on ' + gateCurrentDate() + ' from '+ time.from +' to ' + time.to +'. your pickup time is '+ time.pickup +'. your bus name is ' + bus.BusName + ' and number is ' + bus.BusNumber + '.';
                }
                else {
                    message = 'hello '+ data.Name +'. You canceled your seat '+ cancelseat +' on ' + gateCurrentDate() + ' from '+ time.from +' to ' + time.to +'. your pickup time is '+ time.pickup +'. now your seat no : ' + newseats +'. your bus name is ' + bus.BusName + ' and number is ' + bus.BusNumber + '.';
                }
                sendMail("PTSs Seat Cancel", message, data.Email)
            Booking.updateOne({ _id: seats._id }, { $set: { seatNo: newseats } }).exec();
            res.redirect('/seetlist?busId='+busId+'&timeId='+timeId);
        }
    });

// 4. Find Train.
    app.post('/findtrain', async (req, res) => {
        const { from, to, date } = req.body;
        console.log(req.body);
        res.send("We are find best Train from " + from + " to " + to + " on " + date + " for  you in few time. Currently Development is in Progress.!!!");
    });
// 5. Find Hotel.
    app.post('/findhotel', async (req, res) => {
        const { city, location, indate, outdate } = req.body;
        console.log(req.body);
        res.send("We are find best Hotel in " + location + ", " + city + " on " + indate + " to " + outdate + " for  you in few time. Currently Development is in Progress.!!!");
    });
// 6. Find Flight.
    app.post('/findflight', async (req, res) => {
        const { from, to, date } = req.body;
        console.log(req.body);
        res.send("We are find best flight from " + from + " to " + to + " on " + date + " for  you in few time. Currently Development is in Progress.!!!");
    });

// SERVER SPECIFIC STUFF...
    const server = app.listen(process.env.PORT || 88, () => {
        console.log(`Hacker news server started on port: ${server.address().port} http://localhost:80`);
    });