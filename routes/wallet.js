const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { v4: uuidv4 } = require('uuid');

// Balance
router.get('/balance', auth, async (req, res) => {
  const user = await User.findById(req.user.id).select('balance name mobile');
  res.json(user);
});

// Transaction history
router.get('/transactions', auth, async (req, res) => {
  const txns = await Transaction.find({
    $or: [{ sender: req.user.id }, { receiver: req.user.id }]
  }).sort({ createdAt: -1 }).limit(50).populate('sender receiver', 'name mobile');
  res.json(txns);
});

// Deposit (Admin only adds, user requests)
router.post('/deposit', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    // In real system, integrate payment gateway here
    // For now, create pending request
    const txn = await Transaction.create({
      receiver: req.user.id,
      amount,
      type: 'deposit',
      status: 'pending',
      txnId: uuidv4().replace(/-/g,'').slice(0,12).toUpperCase(),
      note: 'Deposit Request'
    });
    res.json({ success: true, message: 'Deposit request submitted', txnId: txn.txnId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Withdraw request
router.post('/withdraw', auth, async (req, res) => {
  try {
    const { amount, upiId } = req.body;
    const user = await User.findById(req.user.id);
    if (user.balance < amount) return res.status(400).json({ error: 'Insufficient balance' });
    user.balance -= amount;
    await user.save();
    const txn = await Transaction.create({
      sender: req.user.id,
      amount,
      type: 'withdraw',
      status: 'pending',
      txnId: uuidv4().replace(/-/g,'').slice(0,12).toUpperCase(),
      note: `Withdraw to UPI: ${upiId}`
    });
    res.json({ success: true, message: 'Withdraw request submitted', txnId: txn.txnId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
