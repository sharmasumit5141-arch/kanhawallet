const mongoose = require('mongoose');

const lifafaSchema = new mongoose.Schema({
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  totalAmount: { type: Number, required: true },
  perAmount:   { type: Number, required: true },
  maxClaims:   { type: Number, required: true },
  claimed:     [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, at: Date }],
  code:        { type: String, unique: true },
  expired:     { type: Boolean, default: false },
  createdAt:   { type: Date, default: Date.now }
});

module.exports = mongoose.model('Lifafa', lifafaSchema);
