const mongoose = require('mongoose');

const giftSchema = new mongoose.Schema({
  code:      { type: String, unique: true, required: true },
  amount:    { type: Number, required: true },
  maxUses:   { type: Number, default: 1 },
  usedBy:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  expired:   { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GiftCode', giftSchema);
