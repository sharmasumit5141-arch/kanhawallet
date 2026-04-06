const mongoose = require('mongoose');

const txnSchema = new mongoose.Schema({
  sender:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receiver:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount:    { type: Number, required: true },
  type:      { type: String, enum: ['transfer','deposit','withdraw','lifafa','gift','payment'], required: true },
  status:    { type: String, enum: ['pending','success','failed'], default: 'success' },
  note:      String,
  txnId:     { type: String, unique: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', txnSchema);
