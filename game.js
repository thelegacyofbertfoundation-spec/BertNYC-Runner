// ============================================
// GAME ROUTES - /api/game/*
// ============================================
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { getDb } = require('./connection');

const MAX_ENERGY = parseInt(process.env.MAX_ENERGY) || 5;
const ENERGY_REGEN_MS = (parseInt(process.env.ENERGY_REGEN_MINUTES) || 20) * 60 * 1000;
const MAX_SCORE_PER_SECOND = parseFloat(process.env.MAX_SCORE_PER_SECOND) || 5;

const activeSessions = new Map();

setInterval(() => {
  const cutoff = Date.now() - 30 * 60 * 1000;
  for (const [token, session] of activeSessions) {
    if (session.startedAt < cutoff) activeSessions.delete(token);
  }
}, 5 * 60 * 1000);

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
  return Date.now() < user.vip_expiry || Date.now() < user.unlimited_expiry;
}

router.post('/start', (req, res) => {
  const db = getDb();
  const uid = req.telegramUser.id;
  const user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(uid);
  if (!user) return res.status(404).json({ error: 'User not found. Call /api/user/auth first.' });

  const regen = regenEnergy(user);
  let energy = regen.energy;
  let lastEnergyAt = regen.lastEnergyAt;

  if (energy <= 0 && !isUnlimited(user)) {
    return res.status(403).json({ error: 'No energy remaining', energy: 0 });
  }

  if (!isUnlimited(user)) energy -= 1;

  db.prepare('UPDATE users SET energy = ?, last_energy_at = ? WHERE telegram_id = ?')
    .run(energy, lastEnergyAt, uid);

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

  const sessionToken = crypto.randomBytes(24).toString('hex');
  activeSessions.set(sessionToken, {
    telegramId: uid, startedAt: Date.now(), powerUps: activePowerUps, submitted: false,
  });

  res.json({ sessionToken, energy, activePowerUps });
});

router.post('/submit', (req, res) => {
  const db = getDb();
  const uid = req.telegramUser.id;
  const { sessionToken, score, coinsEarned, continuesUsed = 0, skinUsed = 'default' } = req.body;

  if (!sessionToken || !activeSessions.has(sessionToken)) {
    return res.status(400).json({ error: 'Invalid or expired session token' });
  }

  const session = activeSessions.get(sessionToken);
  if (session.submitted) return res.status(400).json({ error: 'Score already submitted for this session' });
  if (session.telegramId !== uid) return res.status(403).json({ error: 'Session does not belong to this user' });

  const durationSecs = (Date.now() - session.startedAt) / 1000;
  const maxPlausibleScore = durationSecs * MAX_SCORE_PER_SECOND * (session.powerUps.scoreBoost ? 2 : 1);

  let finalScore = Math.max(0, Math.floor(score));
  let flagged = false;

  if (finalScore > maxPlausibleScore) {
    finalScore = Math.floor(maxPlausibleScore);
    flagged = true;
    console.warn(`⚠️ Anti-cheat: User ${uid} submitted ${score}, capped to ${finalScore} (${durationSecs.toFixed(1)}s)`);
  }

  const finalCoins = Math.max(0, Math.min(Math.floor(coinsEarned), Math.floor(durationSecs * 2)));
  session.submitted = true;

  db.prepare(`
    INSERT INTO scores (telegram_id, score, coins_earned, duration_secs, 
      had_shield, had_score_boost, had_coin_boost, had_magnet, continues_used, skin_used)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(uid, finalScore, finalCoins, durationSecs,
    session.powerUps.shield ? 1 : 0, session.powerUps.scoreBoost ? 1 : 0,
    session.powerUps.doubleCoins ? 1 : 0, session.powerUps.magnet ? 1 : 0,
    continuesUsed, skinUsed);

  const user = db.prepare('SELECT best_score, coins, total_games FROM users WHERE telegram_id = ?').get(uid);
  const newBest = finalScore > user.best_score;

  db.prepare(`
    UPDATE users SET coins = coins + ?, best_score = MAX(best_score, ?),
    total_games = total_games + 1, updated_at = datetime('now') WHERE telegram_id = ?
  `).run(finalCoins, finalScore, uid);

  activeSessions.delete(sessionToken);

  res.json({
    score: finalScore, coinsEarned: finalCoins, newBest,
    bestScore: newBest ? finalScore : user.best_score,
    totalCoins: user.coins + finalCoins, flagged,
  });
});

router.post('/continue', (req, res) => {
  const db = getDb();
  const uid = req.telegramUser.id;
  const { sessionToken, method } = req.body;

  if (!sessionToken || !activeSessions.has(sessionToken)) {
    return res.status(400).json({ error: 'Invalid session' });
  }
  const session = activeSessions.get(sessionToken);
  if (session.telegramId !== uid) return res.status(403).json({ error: 'Not your session' });

  if (method === 'stars') {
    const user = db.prepare('SELECT coins FROM users WHERE telegram_id = ?').get(uid);
    if (user.coins < 10) return res.status(403).json({ error: 'Not enough stars', needInvoice: true });
    db.prepare('UPDATE users SET coins = coins - 10 WHERE telegram_id = ?').run(uid);
  }

  res.json({ continued: true });
});

module.exports = router;
