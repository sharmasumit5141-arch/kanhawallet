const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, mobile, pin } = req.body;
    if (!name || !mobile || !pin)
      return res.status(400).json({ error: 'All fields required' });
    if (await User.findOne({ mobile }))
      return res.status(400).json({ error: 'Mobile already registered' });

    const hashed = await bcrypt.hash(pin, 10);
    const apiKey = uuidv4().replace(/-/g, '');
    const user = await User.create({ name, mobile, pin: hashed, apiKey });
    const token = jwt.sign({ id: user._id, mobile: user.mobile }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ success: true, token, user: { name: user.name, mobile: user.mobile, apiKey: user.apiKey, balance: user.balance } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { mobile, pin } = req.body;
    const user = await User.findOne({ mobile });
    if (!user) return res.status(400).json({ error: 'User not found' });
    if (user.isBlocked) return res.status(403).json({ error: 'Account blocked' });
    const match = await bcrypt.compare(pin, user.pin);
    if (!match) return res.status(400).json({ error: 'Wrong PIN' });
    const token = jwt.sign({ id: user._id, mobile: user.mobile }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ success: true, token, user: { name: user.name, mobile: user.mobile, apiKey: user.apiKey, balance: user.balance, isAdmin: user.isAdmin } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Me
router.get('/me', require('../middleware/auth'), async (req, res) => {
  const user = await User.findById(req.user.id).select('-pin');
  res.json(user);
});

module.exports = router;
