const mongoose = require('mongoose');

const register = mongoose.model('usermasters', {
    Name : String,
    City : String,
    Gender : String,
    DOB : String,
    Mobile : String,
    Email : String,
    Password : String,
    ProfileImage : String
}, 'usermasters');

module.exports = register;