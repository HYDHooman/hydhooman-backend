const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
  type: String,
  script: String,
  imageUrl: String,
  active: { type: Boolean, default: false }
});

module.exports = mongoose.model('Ad', adSchema);
