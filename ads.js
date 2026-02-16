// ============================================
// AD REWARD ROUTES
// /api/ads/*
// ============================================
const express = require('express');
const router = express.Router();
const { getDb } = require('../db/connection');

const MAX_ADS_PER_DAY = 10; // Prevent abuse
const MAX_ENERGY = parseInt(process.env.MAX_ENERGY) || 5;

// ── POST /api/ads/reward ──
// Called after user watches a rewarded ad
// In production: verify with ad network callback (AdsGram/AppLixir/PropellerAds)
router.post('/reward', (req, res) => {
  const uid = req.telegramUser.id;
  const db = getDb();
  const { rewardType = 'energy', adToken } = req.body;

  // Rate limit: max ads per day per user
  const adsToday = db.prepare(`
    SELECT COUNT(*) as cnt FROM ad_rewards 
    WHERE telegram_id = ? AND created_at >= datetime('now', '-1 day')
  `).get(uid);

  if (adsToday.cnt >= MAX_ADS_PER_DAY) {
    return res.status(429).json({ error: 'Daily ad reward limit reached', maxPerDay: MAX_ADS_PER_DAY });
  }

  // TODO: In production, validate adToken with your ad network's server-to-server callback
  // Example for AdsGram: verify the reward callback signature
  // Example for AppLixir: verify the completion token
  // For now, we trust the client but log everything for audit

  // Log the ad reward
  db.prepare(`
    INSERT INTO ad_rewards (telegram_id, reward_type, reward_token) VALUES (?, ?, ?)
  `).run(uid, rewardType, adToken || null);

  // Grant reward
  switch (rewardType) {
    case 'energy':
      db.prepare('UPDATE users SET energy = MIN(energy + 1, ?) WHERE telegram_id = ?')
        .run(MAX_ENERGY + 5, uid); // Allow stacking slightly above max
      break;

    case 'continue':
      // Continue is free after ad - session validation handled in /api/game/continue
      break;

    case 'doubleCoins':
      // Temporary double coins for next run
      db.prepare(`
        INSERT INTO powerups (telegram_id, type, quantity) VALUES (?, 'doubleCoins', 1)
        ON CONFLICT(telegram_id, type) DO UPDATE SET quantity = quantity + 1
      `).run(uid);
      break;

    default:
      return res.status(400).json({ error: 'Unknown reward type' });
  }

  const user = db.prepare('SELECT energy, coins FROM users WHERE telegram_id = ?').get(uid);

  res.json({
    success: true,
    rewardType,
    energy: user.energy,
    adsRemainingToday: MAX_ADS_PER_DAY - adsToday.cnt - 1,
  });
});

// ── GET /api/ads/status ──
// Check how many ad rewards the user has left today
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

// ── POST /api/ads/server-callback ──
// Server-to-server callback from ad networks (AdsGram, PropellerAds, AppLixir)
// This endpoint should be whitelisted by IP in production
router.post('/server-callback', (req, res) => {
  // Each ad network has different callback formats.
  // Example structure:
  // {
  //   userId: '123456',
  //   rewardType: 'energy',
  //   transactionId: 'abc123',
  //   signature: 'hmac_signature',
  //   network: 'adsgram'
  // }

  const { userId, rewardType, transactionId, signature, network } = req.body;

  // TODO: Validate signature based on ad network
  // For AdsGram: HMAC-SHA256 validation
  // For AppLixir: Token verification
  // For PropellerAds: IP whitelist + token

  console.log(`📺 Ad callback from ${network}: user=${userId}, reward=${rewardType}, tx=${transactionId}`);

  // In production, you would:
  // 1. Verify the callback signature
  // 2. Check transactionId isn't already processed (prevent replays)
  // 3. Grant the reward server-side
  // 4. Return 200 OK to the ad network

  res.json({ ok: true });
});

module.exports = router;
