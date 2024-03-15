// PUBLIC TRANSPORT SETUPS...
const express = require('express');
const app = express(); // use express.


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const mongoose = require('mongoose'); // mongoose for crud.

const session = require('express-session'); // session

const loginModal = require('./Modals/loginmodal');

// starting connection.
async function connection() {
    await mongoose.connect('mongodb://127.0.0.1:27017/PTSs1');
    console.log("We are Connected");
}
connection();


// Configure session middleware
app.use(session({
    secret: 'PTSs',
    resave: false,
    saveUninitialized: true
}));

// EXPRESS SPECIFIC STUFF.
app.use('/fonts', express.static('fonts'));
app.use('/images', express.static('images'));
app.use('/js', express.static('js'));
app.use('/plugins', express.static('plugins'));
app.use('/styles', express.static('styles'));
app.use(express.urlencoded());

// EJS SPECIFIC STUFF
app.set('view engine', 'ejs'); // set the view directory.

// END POINTS GET REQUESTS
app.get('/', (req, res) => {
    res.status(200).render('index.ejs', { username: "" });
});

//registraion.
app.post('/register', async (req, res) => {
    const registrationModal = require('./Modals/register.modal');
    const { fname, lname, city, gender, number, email, pass, conpass, dob } = req.body;
    console.log(fname + " " + " " + lname + " " + city + " " + gender + " " + number + " " + email + " " + pass + " " + conpass + " " + dob);
    console.log(req.body);
    if (pass == conpass) {
        const newUser = new registrationModal({
            FirstName: fname,
            LastName: lname,
            City: city,
            Gender: gender,
            Mobile: number,
            Email: email,
            Passowrd: pass,
            dob: dob,
            ProfileImage: "default.jpg"
        });
        try {
            // Asynchronous operation that returns a promise
            const savedItem = await newUser.save();
            console.log("user saved successfully:", savedItem);
            req.session.username = fname;
            res.render('index', {
                username: req.session.username
            }); // Redirect to the homepage or any other page after saving
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    }
    else {
        res.send("Registraion Error")
        //res.status(200).render('index', {Error: 'Password And Confirm Password Must Be Same !'})
    }
});

app.post('/userlogin', async (req, res) => {
    const { email, pass } = req.body;
    console.log(email + "  " + pass);

    try {
        const customer = await loginModal.findOne({email, pass});
        console.log(customer)
        if (customer) {
            //console.log()
            // Authentication successful
            res.send('Login successful');
        } else {
            // Authentication failed
            res.send('Invalid email or password');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});


// logout code.
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

app.get('/about', (req, res) => {
    res.status(200).render('about.ejs');
});

app.get('/blog', (req, res) => {
    res.status(200).render('blog.ejs');
});

app.get('/contact', (req, res) => {
    res.status(200).render('contact.ejs');
});

app.get('/elements', (req, res) => {
    res.status(200).render('elements.ejs');
});


app.get('/offers', (req, res) => {
    res.status(200).render('offers.ejs');
});

app.get('/single_listing', (req, res) => {
    res.status(200).render('single_listing.ejs');
});
// END POINTS POST REQUESTS
// .....

app.get('/session', (req, res) => {
    res.status(200).render('session.ejs');
})


// START THE SERVER.
const server = app.listen(process.env.PORT || 80, () => {
    console.log(`Hacker news server started on port: ${server.address().port} http://localhost:80`);
});



// try {
//     const userSchema = mongoose.Schema({
//         Email: String,
//         Password: String
//     })
//     console.log(email + "   " + pass);
//     const userModal = new mongoose.model('usermaster', userSchema);

//     const data = await userModal.findOne({Email: email});
//     console.log(data.Email + "    " + data.Password);
    
//     if (data.Email == email && data.Password == pass) {
//         req.session.username = email.split('@')[0];
//         res.render('index',{username: req.session.username});
//     } else {
//         res.render('loginError');
//     }
// } catch (error) {
//     console.log(error);
//     res.send("Somthing Was Wants Wrong!.");
// }
// });