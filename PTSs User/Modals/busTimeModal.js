const mongoose = require('mongoose');

// const busTimeSchema = mongoose.Schema({
//     from: String,
//     to: String,
//     on: Date,
//     pickup: String,
//     drop: String
// });

const busTimeSchema = mongoose.Schema({
    from: String,
    to: String,
    on: Date,
    pickup: String,
    drop: String,
    Price: Number,
    Bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Buses' }  // Corrected reference
});

const Timetable = mongoose.model('Timetable', busTimeSchema);

module.exports = Timetable;