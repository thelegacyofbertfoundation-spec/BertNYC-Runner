// ============================================
// AD REWARD ROUTES - /api/ads/*
// ============================================
const express = require('express');
const router = express.Router();
const { getDb } = require('./connection');

const MAX_ADS_PER_DAY = 10;
const MAX_ENERGY = parseInt(process.env.MAX_ENERGY) || 5;

router.post('/reward', (req, res) => {
  const uid = req.telegramUser.id;
  const db = getDb();
  const { rewardType = 'energy', adToken } = req.body;

  const adsToday = db.prepare(`
    SELECT COUNT(*) as cnt FROM ad_rewards 
    WHERE telegram_id = ? AND created_at >= datetime('now', '-1 day')
  `).get(uid);

  if (adsToday.cnt >= MAX_ADS_PER_DAY) {
    return res.status(429).json({ error: 'Daily ad reward limit reached', maxPerDay: MAX_ADS_PER_DAY });
  }

  db.prepare(`INSERT INTO ad_rewards (telegram_id, reward_type, reward_token) VALUES (?, ?, ?)`)
    .run(uid, rewardType, adToken || null);

  switch (rewardType) {
    case 'energy':
      db.prepare('UPDATE users SET energy = MIN(energy + 1, ?) WHERE telegram_id = ?')
        .run(MAX_ENERGY + 5, uid);
      break;
    case 'continue':
      break;
    case 'doubleCoins':
      db.prepare(`
        INSERT INTO powerups (telegram_id, type, quantity) VALUES (?, 'doubleCoins', 1)
        ON CONFLICT(telegram_id, type) DO UPDATE SET quantity = quantity + 1
      `).run(uid);
      break;
    default:
      return res.status(400).json({ error: 'Unknown reward type' });
  }

  const user = db.prepare('SELECT energy, coins FROM users WHERE telegram_id = ?').get(uid);
  res.json({ success: true, rewardType, energy: user.energy, adsRemainingToday: MAX_ADS_PER_DAY - adsToday.cnt - 1 });
});

router.get('/status', (req, res) => {
  const uid = req.telegramUser.id;
  const db = getDb();
  const adsToday = db.prepare(`
    SELECT COUNT(*) as cnt FROM ad_rewards 
    WHERE telegram_id = ? AND created_at >= datetime('now', '-1 day')
  `).get(uid);

  res.json({
    adsWatchedToday: adsToday.cnt,
    adsRemainingToday: Math.max(0, MAX_ADS_PER_DAY - adsToday.cnt),
    maxPerDay: MAX_ADS_PER_DAY,
  });
});

router.post('/server-callback', (req, res) => {
  const { userId, rewardType, transactionId, signature, network } = req.body;
  console.log(`📺 Ad callback from ${network}: user=${userId}, reward=${rewardType}, tx=${transactionId}`);
  res.json({ ok: true });
});

module.exports = router;
