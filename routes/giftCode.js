const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const GiftCode = require('../models/GiftCode');
const Transaction = require('../models/Transaction');
const { v4: uuidv4 } = require('uuid');

// Redeem gift code
router.post('/redeem', auth, async (req, res) => {
  try {
    const { code } = req.body;
    const gift = await GiftCode.findOne({ code });
    if (!gift) return res.status(404).json({ error: 'Invalid gift code' });
    if (gift.expired) return res.status(400).json({ error: 'Code expired' });
    if (gift.usedBy.includes(req.user.id))
      return res.status(400).json({ error: 'Already redeemed' });
    if (gift.usedBy.length >= gift.maxUses) {
      gift.expired = true; await gift.save();
      return res.status(400).json({ error: 'Code fully used' });
    }

    gift.usedBy.push(req.user.id);
    if (gift.usedBy.length >= gift.maxUses) gift.expired = true;
    await gift.save();

    const user = await User.findById(req.user.id);
    user.balance += gift.amount;
    await user.save();

    await Transaction.create({
      receiver: user._id,
      amount: gift.amount,
      type: 'gift',
      status: 'success',
      txnId: uuidv4().replace(/-/g,'').slice(0,12).toUpperCase(),
      note: `Gift code redeemed: ${code}`
    });

    res.json({ success: true, amount: gift.amount, message: `₹${gift.amount} added to wallet!` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
