const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  mobile:   { type: String, required: true, unique: true },
  pin:      { type: String, required: true },
  apiKey:   { type: String, unique: true },
  balance:  { type: Number, default: 0 },
  isAdmin:  { type: Boolean, default: false },
  isBlocked:{ type: Boolean, default: false },
  createdAt:{ type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
