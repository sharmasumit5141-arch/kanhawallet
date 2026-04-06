const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { v4: uuidv4 } = require('uuid');

// Transfer by mobile
router.post('/', auth, async (req, res) => {
  try {
    const { mobile, amount, note } = req.body;
    if (!mobile || !amount) return res.status(400).json({ error: 'Mobile and amount required' });
    if (amount < 1) return res.status(400).json({ error: 'Minimum transfer ₹1' });

    const sender = await User.findById(req.user.id);
    const receiver = await User.findOne({ mobile });

    if (!receiver) return res.status(404).json({ error: 'Receiver not found' });
    if (sender.mobile === mobile) return res.status(400).json({ error: 'Cannot transfer to yourself' });
    if (sender.balance < amount) return res.status(400).json({ error: 'Insufficient balance' });

    sender.balance -= amount;
    receiver.balance += amount;
    await sender.save();
    await receiver.save();

    const txn = await Transaction.create({
      sender: sender._id,
      receiver: receiver._id,
      amount,
      type: 'transfer',
      status: 'success',
      txnId: uuidv4().replace(/-/g,'').slice(0,12).toUpperCase(),
      note: note || 'Transfer'
    });

    res.json({ success: true, message: `₹${amount} sent to ${receiver.name}`, txnId: txn.txnId, newBalance: sender.balance });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
