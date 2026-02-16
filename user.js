// ============================================
// USER ROUTES
// /api/user/*
// ============================================
const express = require('express');
const router = express.Router();
const { getDb } = require('../db/connection');

const MAX_ENERGY = parseInt(process.env.MAX_ENERGY) || 5;
const ENERGY_REGEN_MS = (parseInt(process.env.ENERGY_REGEN_MINUTES) || 20) * 60 * 1000;

// ── Helper: regenerate energy based on elapsed time ──
function regenEnergy(user) {
  const now = Date.now();
  if (user.energy >= MAX_ENERGY) {
    return { energy: user.energy, lastEnergyAt: now };
  }
  const elapsed = now - user.last_energy_at;
  const gained = Math.floor(elapsed / ENERGY_REGEN_MS);
  if (gained > 0) {
    const newEnergy = Math.min(MAX_ENERGY, user.energy + gained);
    const newTime = user.last_energy_at + (gained * ENERGY_REGEN_MS);
    return { energy: newEnergy, lastEnergyAt: newTime };
  }
  return { energy: user.energy, lastEnergyAt: user.last_energy_at };
}

// ── Helper: check unlimited status ──
function isUnlimited(user) {
  const now = Date.now();
  return now < user.vip_expiry || now < user.unlimited_expiry;
}

// ── POST /api/user/auth ──
// Login / register user, return full profile
router.post('/auth', (req, res) => {
  const tgUser = req.telegramUser;
  const db = getDb();

  // Upsert user
  let user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(tgUser.id);

  if (!user) {
    // New user registration
    db.prepare(`
      INSERT INTO users (telegram_id, username, first_name, last_name, photo_url, is_premium)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      tgUser.id,
      tgUser.username || null,
      tgUser.first_name || null,
      tgUser.last_name || null,
      tgUser.photo_url || null,
      tgUser.is_premium ? 1 : 0
    );

    // Give default skin
    db.prepare(`
      INSERT OR IGNORE INTO owned_skins (telegram_id, skin_id) VALUES (?, 'default')
    `).run(tgUser.id);

    // Initialize power-ups
    const types = ['magnet', 'shield', 'doubleCoins', 'scoreBoost'];
    const insertPU = db.prepare('INSERT OR IGNORE INTO powerups (telegram_id, type, quantity) VALUES (?, ?, 0)');
    for (const t of types) insertPU.run(tgUser.id, t);

    user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(tgUser.id);
  } else {
    // Update user info on each login
    db.prepare(`
      UPDATE users SET username = ?, first_name = ?, last_name = ?, 
      photo_url = ?, is_premium = ?, updated_at = datetime('now')
      WHERE telegram_id = ?
    `).run(
      tgUser.username || user.username,
      tgUser.first_name || user.first_name,
      tgUser.last_name || user.last_name,
      tgUser.photo_url || user.photo_url,
      tgUser.is_premium ? 1 : 0,
      tgUser.id
    );
  }

  // Regenerate energy
  const regen = regenEnergy(user);
  if (regen.energy !== user.energy) {
    db.prepare('UPDATE users SET energy = ?, last_energy_at = ? WHERE telegram_id = ?')
      .run(regen.energy, regen.lastEnergyAt, tgUser.id);
    user.energy = regen.energy;
    user.last_energy_at = regen.lastEnergyAt;
  }

  // Fetch owned skins
  const ownedSkins = db.prepare('SELECT skin_id FROM owned_skins WHERE telegram_id = ?')
    .all(tgUser.id).map(r => r.skin_id);

  // Fetch power-ups
  const powerUps = {};
  const puRows = db.prepare('SELECT type, quantity FROM powerups WHERE telegram_id = ?').all(tgUser.id);
  for (const r of puRows) powerUps[r.type] = r.quantity;

  res.json({
    user: {
      telegramId: user.telegram_id,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      photoUrl: user.photo_url,
      isPremium: !!user.is_premium,
      energy: user.energy,
      maxEnergy: MAX_ENERGY,
      lastEnergyAt: user.last_energy_at,
      energyRegenMs: ENERGY_REGEN_MS,
      coins: user.coins,
      bestScore: user.best_score,
      totalGames: user.total_games,
      equippedSkin: user.equipped_skin,
      vipExpiry: user.vip_expiry,
      unlimitedExpiry: user.unlimited_expiry,
      ownedSkins,
      powerUps,
      isUnlimited: isUnlimited(user),
    }
  });
});

// ── GET /api/user/profile ──
router.get('/profile', (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(req.telegramUser.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const regen = regenEnergy(user);
  if (regen.energy !== user.energy) {
    db.prepare('UPDATE users SET energy = ?, last_energy_at = ? WHERE telegram_id = ?')
      .run(regen.energy, regen.lastEnergyAt, user.telegram_id);
  }

  const ownedSkins = db.prepare('SELECT skin_id FROM owned_skins WHERE telegram_id = ?')
    .all(user.telegram_id).map(r => r.skin_id);
  const powerUps = {};
  const puRows = db.prepare('SELECT type, quantity FROM powerups WHERE telegram_id = ?').all(user.telegram_id);
  for (const r of puRows) powerUps[r.type] = r.quantity;

  res.json({
    energy: regen.energy,
    maxEnergy: MAX_ENERGY,
    lastEnergyAt: regen.lastEnergyAt,
    coins: user.coins,
    bestScore: user.best_score,
    totalGames: user.total_games,
    equippedSkin: user.equipped_skin,
    vipExpiry: user.vip_expiry,
    unlimitedExpiry: user.unlimited_expiry,
    ownedSkins,
    powerUps,
    isUnlimited: isUnlimited(user),
  });
});

// ── POST /api/user/equip-skin ──
router.post('/equip-skin', (req, res) => {
  const { skinId } = req.body;
  if (!skinId) return res.status(400).json({ error: 'skinId required' });

  const db = getDb();
  const uid = req.telegramUser.id;

  const owns = db.prepare('SELECT 1 FROM owned_skins WHERE telegram_id = ? AND skin_id = ?').get(uid, skinId);
  if (!owns) return res.status(403).json({ error: 'Skin not owned' });

  db.prepare('UPDATE users SET equipped_skin = ?, updated_at = datetime(\'now\') WHERE telegram_id = ?').run(skinId, uid);
  res.json({ equipped: skinId });
});

module.exports = router;
