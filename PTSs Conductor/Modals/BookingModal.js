// models/Booking.js
const mongoose = require('mongoose');

// const bookingSchema = new mongoose.Schema({
//     userId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'usermasters', // Assuming you have a User model
//         required: true
//     },
//     busId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Buses', // Assuming you have a Bus model
//         required: true
//     },
//     timetableId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'timetables', // Assuming you have a Timetable model
//         required: true
//     },
//     seatNo: [Number]
// });


// const Booking = mongoose.model('Booking', bookingSchema);

// const Booking = mongoose.model('Booking', {
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
//     timetableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Timetable', required: true },
//     seatNo: [Number]
// });

const Booking = mongoose.model('Bookings', {  // Let Mongoose generate the ObjectId
    userId: String,
    busId: String,
    timeId: String,
    seatNo: [Number]
}, 'Bookings');


module.exports = Booking;
