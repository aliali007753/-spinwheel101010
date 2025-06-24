const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

// إعداد CORS للسماح بـ Netlify
app.use(cors({
  origin: 'https://spinwheelshora.netlify.app',
  credentials: true
}));

// قاعدة بيانات بسيطة في الذاكرة (ينصح لاحقًا باستخدام MongoDB)
const users = {};

app.use((req, res, next) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
  req.userIP = ip;
  if (!users[ip]) {
    users[ip] = {
      attempts: 2,
      lastSpin: null,
      usedCodes: []
    };
  }
  req.userData = users[ip];
  next();
});

app.use('/api', apiRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
