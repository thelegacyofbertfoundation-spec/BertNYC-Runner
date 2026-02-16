// ============================================
// DATABASE SCHEMA & INITIALIZATION
// ============================================
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data/bert-runner.db');

function initDatabase() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      telegram_id    INTEGER PRIMARY KEY,
      username       TEXT,
      first_name     TEXT,
      last_name      TEXT,
      photo_url      TEXT,
      is_premium     INTEGER DEFAULT 0,
      energy         INTEGER DEFAULT 5,
      last_energy_at INTEGER DEFAULT (strftime('%s','now') * 1000),
      coins          INTEGER DEFAULT 0,
      best_score     INTEGER DEFAULT 0,
      total_games    INTEGER DEFAULT 0,
      equipped_skin  TEXT DEFAULT 'default',
      vip_expiry     INTEGER DEFAULT 0,
      unlimited_expiry INTEGER DEFAULT 0,
      created_at     TEXT DEFAULT (datetime('now')),
      updated_at     TEXT DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS scores (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id    INTEGER NOT NULL,
      score          INTEGER NOT NULL,
      coins_earned   INTEGER DEFAULT 0,
      duration_secs  REAL DEFAULT 0,
      had_shield     INTEGER DEFAULT 0,
      had_score_boost INTEGER DEFAULT 0,
      had_coin_boost INTEGER DEFAULT 0,
      had_magnet     INTEGER DEFAULT 0,
      continues_used INTEGER DEFAULT 0,
      skin_used      TEXT DEFAULT 'default',
      created_at     TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
    );
    CREATE INDEX IF NOT EXISTS idx_scores_telegram_id ON scores(telegram_id);
    CREATE INDEX IF NOT EXISTS idx_scores_created_at ON scores(created_at);
    CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id     INTEGER NOT NULL,
      item_id         TEXT NOT NULL,
      star_amount     INTEGER NOT NULL,
      tg_payment_id   TEXT,
      status          TEXT DEFAULT 'pending',
      created_at      TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
    );
    CREATE INDEX IF NOT EXISTS idx_tx_telegram_id ON transactions(telegram_id);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS owned_skins (
      telegram_id    INTEGER NOT NULL,
      skin_id        TEXT NOT NULL,
      purchased_at   TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (telegram_id, skin_id),
      FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS powerups (
      telegram_id    INTEGER NOT NULL,
      type           TEXT NOT NULL,
      quantity       INTEGER DEFAULT 0,
      PRIMARY KEY (telegram_id, type),
      FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS ad_rewards (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id    INTEGER NOT NULL,
      reward_type    TEXT NOT NULL,
      reward_token   TEXT,
      created_at     TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
    );
    CREATE INDEX IF NOT EXISTS idx_ad_rewards_user_date ON ad_rewards(telegram_id, created_at);
  `);

  console.log('✅ Database initialized at:', DB_PATH);
  db.close();
}

if (require.main === module) {
  require('dotenv').config();
  initDatabase();
}

module.exports = { initDatabase, DB_PATH };
