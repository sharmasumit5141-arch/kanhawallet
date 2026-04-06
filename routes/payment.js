const router = require('express').Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { v4: uuidv4 } = require('uuid');

// URL: /api/payment?apikey=KEY&paytm=NUMBER&amount=AMOUNT
router.get('/', async (req, res) => {
  try {
    const { apikey, paytm, amount } = req.query;
    if (!apikey || !paytm || !amount)
      return res.status(400).json({ error: 'apikey, paytm and amount required' });

    const amt = Number(amount);
    if (isNaN(amt) || amt < 1)
      return res.status(400).json({ error: 'Invalid amount' });

    const sender = await User.findOne({ apiKey: apikey });
    if (!sender) return res.status(401).json({ error: 'Invalid API Key' });
    if (sender.isBlocked) return res.status(403).json({ error: 'Account blocked' });

    const receiver = await User.findOne({ mobile: paytm });
    if (!receiver) return res.status(404).json({ error: 'Receiver not found' });

    if (sender.balance < amt)
      return res.status(400).json({ error: 'Insufficient balance' });

    sender.balance -= amt;
    receiver.balance += amt;
    await sender.save();
    await receiver.save();

    const txn = await Transaction.create({
      sender: sender._id,
      receiver: receiver._id,
      amount: amt,
      type: 'payment',
      status: 'success',
      txnId: uuidv4().replace(/-/g,'').slice(0,12).toUpperCase(),
      note: 'API Payment'
    });

    res.json({
      success: true,
      message: `₹${amt} transferred successfully`,
      txnId: txn.txnId,
      sender: sender.name,
      receiver: receiver.name,
      newBalance: sender.balance
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST version
router.post('/', async (req, res) => {
  req.query = req.body;
  // reuse GET logic
  const { apikey, paytm, amount } = req.body;
  try {
    if (!apikey || !paytm || !amount)
      return res.status(400).json({ error: 'apikey, paytm and amount required' });
    const amt = Number(amount);
    const sender = await User.findOne({ apiKey: apikey });
    if (!sender) return res.status(401).json({ error: 'Invalid API Key' });
    const receiver = await User.findOne({ mobile: paytm });
    if (!receiver) return res.status(404).json({ error: 'Receiver not found' });
    if (sender.balance < amt) return res.status(400).json({ error: 'Insufficient balance' });
    sender.balance -= amt; receiver.balance += amt;
    await sender.save(); await receiver.save();
    const txn = await Transaction.create({
      sender: sender._id, receiver: receiver._id,
      amount: amt, type: 'payment', status: 'success',
      txnId: uuidv4().replace(/-/g,'').slice(0,12).toUpperCase(),
      note: 'API Payment'
    });
    res.json({ success: true, txnId: txn.txnId, newBalance: sender.balance });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
