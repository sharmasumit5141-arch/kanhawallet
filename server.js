require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/wallet',   require('./routes/wallet'));
app.use('/api/transfer', require('./routes/transfer'));
app.use('/api/payment',  require('./routes/payment'));
app.use('/api/admin',    require('./routes/admin'));
app.use('/api/lifafa',   require('./routes/lifafa'));
app.use('/api/giftcode', require('./routes/giftCode'));

// Frontend fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected');
    app.listen(process.env.PORT || 3000, () =>
      console.log('Kanha Wallet running on port', process.env.PORT || 3000)
    );
  })
  .catch(err => console.error(err));
