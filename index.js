// index.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

const User = require('./models/User');
const Ad = require('./models/Ad');
const filterBadWords = require('./controllers/profanityFilter');

app.post('/report', async (req, res) => {
  const { fingerprint, ip } = req.body;
  let user = await User.findOne({ fingerprint });
  if (!user) user = await User.create({ fingerprint, ip, reports: 1 });
  else {
    user.reports++;
    if (user.reports >= 30) user.banned = true;
    await user.save();
  }
  res.json({ success: true, banned: user.banned });
});

app.post('/check-ban', async (req, res) => {
  const { fingerprint } = req.body;
  const user = await User.findOne({ fingerprint });
  res.json({ banned: user?.banned || false });
});

app.post('/message', async (req, res) => {
  const { message } = req.body;
  if (filterBadWords(message)) return res.status(400).json({ error: 'Blocked message content' });
  res.json({ success: true });
});

app.get('/ads', async (req, res) => {
  const ad = await Ad.findOne({ active: true });
  res.json(ad || {});
});

app.post('/admin/ad', async (req, res) => {
  const { type, script, imageUrl } = req.body;
  await Ad.updateMany({}, { active: false });
  await Ad.create({ type, script, imageUrl, active: true });
  res.json({ success: true });
});

app.get('/admin/stream', (req, res) => {
  res.json({ youtubeEmbedLink: "https://www.youtube.com/embed/live_stream?channel=YOUR_CHANNEL_ID" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
