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
const validCodes = [
  "CODEA7RBG2Q", "CODE4KZMVL2", "CODE19GMEY3", "CODE8C7V0RF", "CODE5NJKXW1",
  "CODEUS4ZYTQ", "CODEL2W0AVR", "CODEF3T97QU", "CODEBZJPM1X", "CODEH1WCNSY",
  "CODE3UAZE5K", "CODEDYXKWRV", "CODEA8SHWM4", "CODEMJXWYZE", "CODE6C1ZJ3T",
  "CODEPQGTU52", "CODEKTXEOVB", "CODE49VJYFD", "CODENSWZ1CH", "CODEM23YHTE",
  "CODE7RC5MXV", "CODEXEAFYBQ", "CODELT3R7WU", "CODEZMF84YP", "CODEDUKQ59V",
  "CODEVB6PMA1", "CODEFATWUZC", "CODE7LYDKOX", "CODEH39UX2B", "CODE0WNSVZ6",
  "CODECJKGMEF", "CODE9TQAY82", "CODE8M4YVHP", "CODE5DR3MZQ", "CODE2NG9CJU",
  "CODEALZ37YQ", "CODEX97DTFV", "CODEWRCH50U", "CODEGY8XFZ1", "CODEMBEQ4NW",
  "CODEP7HAGTX", "CODEZXY6Q3D", "CODEKBA9MOC", "CODEE17ULQZ", "CODETJWXM95",
  "CODE4H8A0RY", "CODEVQ3ZC6W", "CODERD2FYXU", "CODE1OZ5TVM", "CODEU6BNLJF"
];


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
