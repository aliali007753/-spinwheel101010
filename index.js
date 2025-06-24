require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

const BLOCK_TIME = 6 * 60 * 60 * 1000; // 6 ساعات
const MAX_TRIES = 2;

let db, ipAttempts, codesCollection;

const client = new MongoClient(MONGO_URI, {
  serverApi: ServerApiVersion.v1
});

async function generateCodes() {
  const count = await codesCollection.countDocuments();
  if (count >= 40) return;

  const codes = [];
  for (let i = 0; i < 40; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push({ code, used: false, ip: null });
  }

  await codesCollection.insertMany(codes);
  console.log('✅ تم توليد 40 كود عشوائي.');
}

app.post('/spin', async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const record = await ipAttempts.findOne({ ip });

  if (record?.blockExpires && Date.now() < record.blockExpires) {
    return res.status(429).json({
      success: false,
      blocked: true,
      message: '🚫 تم حظرك مؤقتًا بعد محاولتين. للتواصل معنا لاستلام كود خاص، اضغط الزر أدناه.'
    });
  }

  const tries = record?.tries || 0;

  if (tries >= MAX_TRIES) {
    await ipAttempts.updateOne(
      { ip },
      {
        $set: { blockExpires: Date.now() + BLOCK_TIME },
        $unset: { tries: "" }
      },
      { upsert: true }
    );
    return res.status(429).json({
      success: false,
      blocked: true,
      message: '🚫 تجاوزت عدد المحاولات. تم حظرك 6 ساعات.'
    });
  }

  await ipAttempts.updateOne(
    { ip },
    { $inc: { tries: 1 } },
    { upsert: true }
  );

  res.json({
    success: true,
    message: '🎉 تم تدوير العجلة بنجاح.'
  });
});

app.post('/use-code', async (req, res) => {
  const { code } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  const found = await codesCollection.findOne({ code, used: false });
  if (!found) {
    return res.status(400).json({
      success: false,
      message: '❌ الكود غير صالح أو مستخدم.'
    });
  }

  await codesCollection.updateOne({ code }, { $set: { used: true, ip } });
  await ipAttempts.deleteOne({ ip });

  res.json({
    success: true,
    message: '✅ تم تفعيل الكود، بإمكانك استخدام العجلة الآن.'
  });
});

async function start() {
  try {
    await client.connect();
    db = client.db('luckwheel');
    ipAttempts = db.collection('ip_attempts');
    codesCollection = db.collection('user_codes');

    await generateCodes();

    app.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ MongoDB Connection Failed:', err);
    process.exit(1);
  }
}

start();
