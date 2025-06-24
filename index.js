const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// إعداد السماح بالنطاق الخاص بمشروعك على نتفلاي
const allowedOrigins = ['https://spinwheelshora.netlify.app'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true
}));

app.use(express.json());

// بيانات المستخدمين المخزنة مؤقتًا
let userData = {};

function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress;
}

// إرجاع المحاولات الحالية
app.get('/api/attempts', (req, res) => {
  const ip = getClientIP(req);
  if (!userData[ip]) {
    userData[ip] = {
      attempts: 2,
      lastSpin: 0,
      usedCodes: []
    };
  }

  const user = userData[ip];
  const now = Date.now();
  const blockTime = 7 * 60 * 60 * 1000;

  const isBlocked = now - user.lastSpin < blockTime && user.attempts === 0;
  res.json({
    attempts: user.attempts,
    isBlocked,
    remaining: isBlocked ? Math.ceil((blockTime - (now - user.lastSpin)) / 1000) : 0
  });
});

// تسجيل دوران
app.post('/api/spin', (req, res) => {
  const ip = getClientIP(req);
  if (!userData[ip]) {
    userData[ip] = {
      attempts: 2,
      lastSpin: 0,
      usedCodes: []
    };
  }

  const user = userData[ip];
  if (user.attempts > 0) {
    user.attempts--;
    if (user.attempts === 0) user.lastSpin = Date.now();
    return res.json({ success: true, attempts: user.attempts });
  }

  return res.status(403).json({ error: 'No attempts left' });
});

// تفعيل كود
const validCodes = ['CODE1', 'CODE2', 'CODE3', 'CODE4', 'CODE5'];

app.post('/api/code', (req, res) => {
  const { code } = req.body;
  const ip = getClientIP(req);
  if (!code) return res.status(400).json({ error: 'No code provided' });

  if (!userData[ip]) {
    userData[ip] = {
      attempts: 2,
      lastSpin: 0,
      usedCodes: []
    };
  }

  const user = userData[ip];

  if (user.usedCodes.includes(code)) {
    return res.status(400).json({ error: 'Used code' });
  }

  if (!validCodes.includes(code)) {
    return res.status(400).json({ error: 'Invalid code' });
  }

  user.attempts = 3;
  user.lastSpin = 0;
  user.usedCodes.push(code);
  return res.json({ success: true, attempts: user.attempts });
});

// عرض المستخدمين
app.get('/api/users', (req, res) => {
  const password = req.query.password;
  if (password !== 'ali.khlaf00774411') return res.status(401).json({ error: 'Unauthorized' });

  res.json(userData);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
