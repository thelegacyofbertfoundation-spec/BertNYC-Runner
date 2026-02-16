// ============================================
// LEADERBOARD ROUTES - /api/leaderboard/*
// ============================================
const express = require('express');
const router = express.Router();
const { getDb } = require('./connection');

router.get('/:period', (req, res) => {
  const { period } = req.params;
  const uid = req.telegramUser.id;
  const db = getDb();

  let dateFilter = '';
  switch (period) {
    case 'weekly': dateFilter = `AND s.created_at >= datetime('now', '-7 days')`; break;
    case 'monthly': dateFilter = `AND s.created_at >= datetime('now', '-30 days')`; break;
    default: dateFilter = ''; break;
  }

  const leaderboard = db.prepare(`
    SELECT u.telegram_id, u.username, u.first_name, u.last_name, u.photo_url, u.is_premium,
      MAX(s.score) as best_score, COUNT(s.id) as games_played
    FROM scores s JOIN users u ON s.telegram_id = u.telegram_id
    WHERE 1=1 ${dateFilter}
    GROUP BY s.telegram_id ORDER BY best_score DESC LIMIT 50
  `).all();

  const userBest = db.prepare(`
    SELECT MAX(score) as best_score FROM scores WHERE telegram_id = ? ${dateFilter}
  `).get(uid);

  let userRank = null;
  if (userBest?.best_score) {
    const rankResult = db.prepare(`
      SELECT COUNT(DISTINCT telegram_id) + 1 as rank
      FROM (SELECT telegram_id, MAX(score) as ms FROM scores WHERE 1=1 ${dateFilter} GROUP BY telegram_id HAVING ms > ?)
    `).get(userBest.best_score);
    userRank = rankResult?.rank || null;
  }

  const entries = leaderboard.map((row, index) => ({
    rank: index + 1, telegramId: row.telegram_id, username: row.username,
    firstName: row.first_name, lastName: row.last_name, photoUrl: row.photo_url,
    isPremium: !!row.is_premium, score: row.best_score, gamesPlayed: row.games_played,
    isYou: row.telegram_id === uid,
  }));

  res.json({
    period, top3: entries.slice(0, 3), entries: entries.slice(3),
    yourRank: userRank, yourBest: userBest?.best_score || 0,
    totalPlayers: db.prepare(`SELECT COUNT(DISTINCT telegram_id) as cnt FROM scores WHERE 1=1 ${dateFilter}`).get()?.cnt || 0,
  });
});

router.get('/around-me/:period', (req, res) => {
  const { period } = req.params;
  const uid = req.telegramUser.id;
  const db = getDb();

  let dateFilter = '';
  switch (period) {
    case 'weekly': dateFilter = `AND s.created_at >= datetime('now', '-7 days')`; break;
    case 'monthly': dateFilter = `AND s.created_at >= datetime('now', '-30 days')`; break;
    default: dateFilter = ''; break;
  }

  const allRanked = db.prepare(`
    SELECT u.telegram_id, u.username, u.first_name, MAX(s.score) as best_score
    FROM scores s JOIN users u ON s.telegram_id = u.telegram_id
    WHERE 1=1 ${dateFilter} GROUP BY s.telegram_id ORDER BY best_score DESC
  `).all();

  const userIndex = allRanked.findIndex(r => r.telegram_id === uid);
  if (userIndex === -1) return res.json({ entries: [], yourRank: null });

  const start = Math.max(0, userIndex - 3);
  const end = Math.min(allRanked.length, userIndex + 4);

  res.json({
    entries: allRanked.slice(start, end).map((r, i) => ({
      rank: start + i + 1, telegramId: r.telegram_id, username: r.username,
      firstName: r.first_name, score: r.best_score, isYou: r.telegram_id === uid,
    })),
    yourRank: userIndex + 1,
  });
});

module.exports = router;
