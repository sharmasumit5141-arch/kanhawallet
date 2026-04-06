const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const GiftCode = require('../models/GiftCode');
const { v4: uuidv4 } = require('uuid');

const isAdmin = (req, res, next) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin only' });
  next();
};

// All users
router.get('/users', auth, isAdmin, async (req, res) => {
  const users = await User.find().select('-pin').sort({ createdAt: -1 });
  res.json(users);
});

// Add balance
router.post('/add-balance', auth, isAdmin, async (req, res) => {
  try {
    const { mobile, amount } = req.body;
    const user = await User.findOne({ mobile });
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.balance += Number(amount);
    await user.save();
    await Transaction.create({
      receiver: user._id, amount: Number(amount),
      type: 'deposit', status: 'success',
      txnId: uuidv4().replace(/-/g,'').slice(0,12).toUpperCase(),
      note: 'Admin deposit'
    });
    res.json({ success: true, newBalance: user.balance });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Block/Unblock user
router.post('/block', auth, isAdmin, async (req, res) => {
  const { mobile, block } = req.body;
  const user = await User.findOne({ mobile });
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.isBlocked = block;
  await user.save();
  res.json({ success: true, message: `User ${block ? 'blocked' : 'unblocked'}` });
});

// Create gift code
router.post('/gift-code', auth, isAdmin, async (req, res) => {
  try {
    const { amount, maxUses } = req.body;
    const code = uuidv4().replace(/-/g,'').slice(0,10).toUpperCase();
    const gift = await GiftCode.create({ code, amount, maxUses: maxUses || 1, createdBy: req.user.id });
    res.json({ success: true, code: gift.code, amount, maxUses: gift.maxUses });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// All transactions
router.get('/transactions', auth, isAdmin, async (req, res) => {
  const txns = await Transaction.find().sort({ createdAt: -1 }).limit(100)
    .populate('sender receiver', 'name mobile');
  res.json(txns);
});

// Stats
router.get('/stats', auth, isAdmin, async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalTxns = await Transaction.countDocuments();
  const users = await User.find();
  const totalBalance = users.reduce((a, u) => a + u.balance, 0);
  res.json({ totalUsers, totalTxns, totalBalance });
});

module.exports = router;
