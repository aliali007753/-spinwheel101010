const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// الدومينات المسموح لها بالوصول للسيرفر (ضيف دومين الواجهة الأمامية هنا)
const allowedOrigins = [
  'https://685aef832ad9f9ade02b7b70--fluffy-genie-0c2826.netlify.app',
  // إذا عندك دومينات أخرى، أضفها هنا
];

// إعدادات CORS مع السماح للكوكيز والطلبات من الدومينات المسموح بها فقط
const corsOptions = {
  origin: function (origin, callback) {
    // السماح للطلبات بدون origin مثل Postman أو بعض المتصفحات
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

// متغيرات حالة المستخدم (مثال مؤقت - في الاستخدام الحقيقي لازم قاعدة بيانات)
let attempts = 2;
let isBlocked = false;
let blockStartTime = null;
const blockDurationHours = 6;

// راجع طلب عدد المحاولات وحالة الحظر
app.get('/api/attempts', (req, res) => {
  if (isBlocked) {
    const now = Date.now();
    const blockTime = blockDurationHours * 3600 * 1000;
    const elapsed = now - blockStartTime;
    if (elapsed >= blockTime) {
      // انتهى الحظر
      isBlocked = false;
      attempts = 2;
      blockStartTime = null;
      res.json({ attempts, isBlocked });
    } else {
      res.json({ attempts: 0, isBlocked, remainingMs: blockTime - elapsed });
    }
  } else {
    res.json({ attempts, isBlocked });
  }
});

// تسجيل محاولة دوران
app.post('/api/spin', (req, res) => {
  if (isBlocked) {
    return res.status(403).json({ message: 'تم الحظر، لا يمكن الدوران الآن.' });
  }
  if (attempts <= 0) {
    isBlocked = true;
    blockStartTime = Date.now();
    return res.status(403).json({ message: 'نفذت المحاولات، تم الحظر.' });
  }
  attempts--;
  if (attempts <= 0) {
    isBlocked = true;
    blockStartTime = Date.now();
  }
  res.json({ attempts, isBlocked });
});

// تفعيل كود المحاولات
const validCodes = new Set([
  'CODE1', 'CODE2', 'CODE3', 'CODE4', 'CODE5',
  // أضف أكواد أخرى حسب الحاجة
]);

let usedCodes = new Set();

app.post('/api/code', (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ message: 'يرجى إرسال الكود.' });
  }
  if (usedCodes.has(code)) {
    return res.status(400).json({ message: 'الكود مستخدم مسبقاً.' });
  }
  if (!validCodes.has(code)) {
    return res.status(400).json({ message: 'كود غير صالح.' });
  }
  // كود صالح ويضاف 3 محاولات
  attempts += 3;
  isBlocked = false;
  blockStartTime = null;
  usedCodes.add(code);
  validCodes.delete(code);
  res.json({ message: 'تمت إضافة 3 محاولات', attempts, isBlocked });
});

// بدء السيرفر
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
