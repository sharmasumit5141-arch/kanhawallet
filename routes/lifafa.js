const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Lifafa = require('../models/Lifafa');
const Transaction = require('../models/Transaction');
const { v4: uuidv4 } = require('uuid');

// Create lifafa
router.post('/create', auth, async (req, res) => {
  try {
    const { totalAmount, maxClaims, note } = req.body;
    const perAmount = Math.floor(totalAmount / maxClaims);
    const user = await User.findById(req.user.id);
    if (user.balance < totalAmount) return res.status(400).json({ error: 'Insufficient balance' });
    user.balance -= totalAmount;
    await user.save();
    const lifafa = await Lifafa.create({
      createdBy: user._id,
      totalAmount, perAmount, maxClaims,
      code: uuidv4().replace(/-/g,'').slice(0,8).toUpperCase()
    });
    res.json({ success: true, code: lifafa.code, perAmount, message: `Lifafa created! Each person gets ₹${perAmount}` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Claim lifafa
router.post('/claim', auth, async (req, res) => {
  try {
    const { code } = req.body;
    const lifafa = await Lifafa.findOne({ code });
    if (!lifafa) return res.status(404).json({ error: 'Lifafa not found' });
    if (lifafa.expired) return res.status(400).json({ error: 'Lifafa expired' });
    if (lifafa.claimed.find(c => c.user.toString() === req.user.id))
      return res.status(400).json({ error: 'Already claimed' });
    if (lifafa.claimed.length >= lifafa.maxClaims)
      return res.status(400).json({ error: 'Lifafa fully claimed' });

    lifafa.claimed.push({ user: req.user.id, at: new Date() });
    if (lifafa.claimed.length >= lifafa.maxClaims) lifafa.expired = true;
    await lifafa.save();

    const user = await User.findById(req.user.id);
    user.balance += lifafa.perAmount;
    await user.save();

    await Transaction.create({
      receiver: user._id,
      amount: lifafa.perAmount,
      type: 'lifafa',
      status: 'success',
      txnId: uuidv4().replace(/-/g,'').slice(0,12).toUpperCase(),
      note: `Lifafa claimed: ${code}`
    });

    res.json({ success: true, amount: lifafa.perAmount, message: `You got ₹${lifafa.perAmount} from lifafa!` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
