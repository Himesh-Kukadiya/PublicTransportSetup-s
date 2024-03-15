const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  
});
  
  // Create the model
const BusModal = mongoose.model('Buses', busSchema);

module.exports = BusModal;
