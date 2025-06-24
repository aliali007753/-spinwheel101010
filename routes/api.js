const express = require('express');
const router = express.Router();

// زمن الحظر 6 ساعات
const BLOCK_DURATION = 6 * 60 * 60 * 1000;

// GET /api/attempts
router.get('/attempts', (req, res) => {
  const { attempts, lastSpin } = req.userData;
  const now = Date.now();

  const isBlocked = attempts <= 0 && lastSpin && (now - lastSpin) < BLOCK_DURATION;
  const remainingTime = isBlocked ? Math.ceil((BLOCK_DURATION - (now - lastSpin)) / 1000) : 0;

  res.json({ attempts, isBlocked, remainingTime });
});

// POST /api/spin
router.post('/spin', (req, res) => {
  const user = req.userData;

  if (user.attempts > 0) {
    user.attempts--;
    if (user.attempts === 0) {
      user.lastSpin = Date.now();
    }
    return res.json({ success: true });
  } else {
    return res.status(403).json({ message: 'No attempts left' });
  }
});

// POST /api/code
const validCodes = ['CODE1', 'CODE2', 'CODE3', 'CODE4', 'CODE5'];

router.post('/code', (req, res) => {
  const code = req.body.code;
  const user = req.userData;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ message: 'Invalid code' });
  }

  if (user.usedCodes.includes(code)) {
    return res.status(400).json({ message: 'الكود مستخدم سابقًا' });
  }

  if (!validCodes.includes(code)) {
    return res.status(400).json({ message: 'كود غير صالح' });
  }

  user.attempts = 3;
  user.lastSpin = null;
  user.usedCodes.push(code);

  return res.json({ success: true });
});

module.exports = router;
