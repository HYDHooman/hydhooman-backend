const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fingerprint: String,
  ip: String,
  reports: { type: Number, default: 0 },
  banned: { type: Boolean, default: false }
});

module.exports = mongoose.model('User', userSchema);
