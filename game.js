// ============================================
// GAME ROUTES
// /api/game/*
// ============================================
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { getDb } = require('../db/connection');

const MAX_ENERGY = parseInt(process.env.MAX_ENERGY) || 5;
const ENERGY_REGEN_MS = (parseInt(process.env.ENERGY_REGEN_MINUTES) || 20) * 60 * 1000;
const MAX_SCORE_PER_SECOND = parseFloat(process.env.MAX_SCORE_PER_SECOND) || 5;

// In-memory session store for active games (prevents replay attacks)
const activeSessions = new Map();

// Cleanup old sessions every 5 minutes
setInterval(() => {
  const cutoff = Date.now() - 30 * 60 * 1000; // 30 min
  for (const [token, session] of activeSessions) {
    if (session.startedAt < cutoff) activeSessions.delete(token);
  }
}, 5 * 60 * 1000);

// ── Helper: regenerate energy ──
function regenEnergy(user) {
  const now = Date.now();
  if (user.energy >= MAX_ENERGY) return { energy: user.energy, lastEnergyAt: now };
  const elapsed = now - user.last_energy_at;
  const gained = Math.floor(elapsed / ENERGY_REGEN_MS);
  if (gained > 0) {
    return {
      energy: Math.min(MAX_ENERGY, user.energy + gained),
      lastEnergyAt: user.last_energy_at + (gained * ENERGY_REGEN_MS),
    };
  }
  return { energy: user.energy, lastEnergyAt: user.last_energy_at };
}

function isUnlimited(user) {
  const now = Date.now();
  return now < user.vip_expiry || now < user.unlimited_expiry;
}

// ── POST /api/game/start ──
// Deducts energy, returns a session token
router.post('/start', (req, res) => {
  const db = getDb();
  const uid = req.telegramUser.id;
  const user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(uid);
  if (!user) return res.status(404).json({ error: 'User not found. Call /api/user/auth first.' });

  // Regenerate energy
  const regen = regenEnergy(user);
  let energy = regen.energy;
  let lastEnergyAt = regen.lastEnergyAt;

  // Check energy
  if (energy <= 0 && !isUnlimited(user)) {
    return res.status(403).json({ error: 'No energy remaining', energy: 0 });
  }

  // Deduct energy (unless unlimited)
  if (!isUnlimited(user)) {
    energy -= 1;
  }

  db.prepare('UPDATE users SET energy = ?, last_energy_at = ? WHERE telegram_id = ?')
    .run(energy, lastEnergyAt, uid);

  // Consume power-ups the player wants to use
  const { usePowerUps = [] } = req.body;
  const activePowerUps = {};
  const validTypes = ['magnet', 'shield', 'doubleCoins', 'scoreBoost'];

  for (const puType of usePowerUps) {
    if (!validTypes.includes(puType)) continue;
    const pu = db.prepare('SELECT quantity FROM powerups WHERE telegram_id = ? AND type = ?').get(uid, puType);
    if (pu && pu.quantity > 0) {
      db.prepare('UPDATE powerups SET quantity = quantity - 1 WHERE telegram_id = ? AND type = ?').run(uid, puType);
      activePowerUps[puType] = true;
    }
  }

  // Generate session token
  const sessionToken = crypto.randomBytes(24).toString('hex');
  activeSessions.set(sessionToken, {
    telegramId: uid,
    startedAt: Date.now(),
    powerUps: activePowerUps,
    submitted: false,
  });

  res.json({
    sessionToken,
    energy,
    activePowerUps,
  });
});

// ── POST /api/game/submit ──
// Submit score with anti-cheat validation
router.post('/submit', (req, res) => {
  const db = getDb();
  const uid = req.telegramUser.id;
  const { sessionToken, score, coinsEarned, continuesUsed = 0, skinUsed = 'default' } = req.body;

  // Validate session
  if (!sessionToken || !activeSessions.has(sessionToken)) {
    return res.status(400).json({ error: 'Invalid or expired session token' });
  }

  const session = activeSessions.get(sessionToken);

  // Prevent replay
  if (session.submitted) {
    return res.status(400).json({ error: 'Score already submitted for this session' });
  }

  // Verify ownership
  if (session.telegramId !== uid) {
    return res.status(403).json({ error: 'Session does not belong to this user' });
  }

  // Anti-cheat: check score plausibility
  const durationSecs = (Date.now() - session.startedAt) / 1000;
  const maxPlausibleScore = durationSecs * MAX_SCORE_PER_SECOND * (session.powerUps.scoreBoost ? 2 : 1);

  let finalScore = Math.max(0, Math.floor(score));
  let flagged = false;

  if (finalScore > maxPlausibleScore) {
    // Flag but don't reject - cap the score
    finalScore = Math.floor(maxPlausibleScore);
    flagged = true;
    console.warn(`⚠️ Anti-cheat: User ${uid} submitted ${score}, capped to ${finalScore} (${durationSecs.toFixed(1)}s)`);
  }

  const finalCoins = Math.max(0, Math.min(Math.floor(coinsEarned), Math.floor(durationSecs * 2)));

  // Mark session as submitted
  session.submitted = true;

  // Insert score record
  db.prepare(`
    INSERT INTO scores (telegram_id, score, coins_earned, duration_secs, 
      had_shield, had_score_boost, had_coin_boost, had_magnet, continues_used, skin_used)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uid, finalScore, finalCoins, durationSecs,
    session.powerUps.shield ? 1 : 0,
    session.powerUps.scoreBoost ? 1 : 0,
    session.powerUps.doubleCoins ? 1 : 0,
    session.powerUps.magnet ? 1 : 0,
    continuesUsed,
    skinUsed
  );

  // Update user stats
  const user = db.prepare('SELECT best_score, coins, total_games FROM users WHERE telegram_id = ?').get(uid);
  const newBest = finalScore > user.best_score;

  db.prepare(`
    UPDATE users SET 
      coins = coins + ?,
      best_score = MAX(best_score, ?),
      total_games = total_games + 1,
      updated_at = datetime('now')
    WHERE telegram_id = ?
  `).run(finalCoins, finalScore, uid);

  // Clean up session
  activeSessions.delete(sessionToken);

  res.json({
    score: finalScore,
    coinsEarned: finalCoins,
    newBest,
    bestScore: newBest ? finalScore : user.best_score,
    totalCoins: user.coins + finalCoins,
    flagged,
  });
});

// ── POST /api/game/continue ──
// Buy a continue mid-run (10 Stars)
router.post('/continue', (req, res) => {
  const db = getDb();
  const uid = req.telegramUser.id;
  const { sessionToken, method } = req.body; // method: 'stars' | 'ad'

  if (!sessionToken || !activeSessions.has(sessionToken)) {
    return res.status(400).json({ error: 'Invalid session' });
  }

  const session = activeSessions.get(sessionToken);
  if (session.telegramId !== uid) {
    return res.status(403).json({ error: 'Not your session' });
  }

  if (method === 'stars') {
    const user = db.prepare('SELECT coins FROM users WHERE telegram_id = ?').get(uid);
    if (user.coins < 10) {
      return res.status(403).json({ error: 'Not enough stars', needInvoice: true });
    }
    db.prepare('UPDATE users SET coins = coins - 10 WHERE telegram_id = ?').run(uid);
  }

  // method === 'ad' is validated separately via /api/ads/reward

  res.json({ continued: true });
});

module.exports = router;
