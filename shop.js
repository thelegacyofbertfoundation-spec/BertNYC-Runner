// ============================================
// SHOP ROUTES - /api/shop/*
// ============================================
const express = require('express');
const router = express.Router();
const { getDb } = require('./connection');

const SHOP_ITEMS = {
  energy3:       { name: '3 Extra Plays',    price: 15,  type: 'energy',  value: 3 },
  energy10:      { name: '10 Plays',          price: 40,  type: 'energy',  value: 10 },
  unlimitedDay:  { name: 'Unlimited 24h',     price: 75,  type: 'unlimited', value: 86400000 },
  magnet:        { name: 'Coin Magnet',       price: 10,  type: 'powerup', powerType: 'magnet' },
  shield:        { name: 'Shield',            price: 12,  type: 'powerup', powerType: 'shield' },
  doubleCoins:   { name: '2x Coins',          price: 8,   type: 'powerup', powerType: 'doubleCoins' },
  scoreBoost:    { name: '2x Score',          price: 15,  type: 'powerup', powerType: 'scoreBoost' },
  skin_golden:   { name: 'Golden Bert',       price: 50,  type: 'skin', skinId: 'golden' },
  skin_neon:     { name: 'Neon Bert',         price: 75,  type: 'skin', skinId: 'neon' },
  skin_ghost:    { name: 'Ghost Bert',        price: 60,  type: 'skin', skinId: 'ghost' },
  skin_flame:    { name: 'Fire Bert',         price: 80,  type: 'skin', skinId: 'flame' },
  skin_ice:      { name: 'Ice Bert',          price: 65,  type: 'skin', skinId: 'ice' },
  skin_galaxy:   { name: 'Galaxy Bert',       price: 120, type: 'skin', skinId: 'galaxy' },
  skin_nyc:      { name: 'NYC Bert',          price: 100, type: 'skin', skinId: 'nyc' },
  vipWeekly:     { name: 'Weekly VIP Pass',   price: 150, type: 'vip', value: 604800000 },
};

function deliverItem(db, uid, itemId, item) {
  switch (item.type) {
    case 'energy':
      db.prepare('UPDATE users SET energy = energy + ? WHERE telegram_id = ?').run(item.value, uid);
      break;
    case 'unlimited':
      db.prepare('UPDATE users SET unlimited_expiry = MAX(unlimited_expiry, ?) WHERE telegram_id = ?')
        .run(Date.now() + item.value, uid);
      break;
    case 'powerup':
      db.prepare(`
        INSERT INTO powerups (telegram_id, type, quantity) VALUES (?, ?, 1)
        ON CONFLICT(telegram_id, type) DO UPDATE SET quantity = quantity + 1
      `).run(uid, item.powerType);
      break;
    case 'skin':
      db.prepare('INSERT OR IGNORE INTO owned_skins (telegram_id, skin_id) VALUES (?, ?)').run(uid, item.skinId);
      db.prepare('UPDATE users SET equipped_skin = ? WHERE telegram_id = ?').run(item.skinId, uid);
      break;
    case 'vip':
      db.prepare('UPDATE users SET vip_expiry = MAX(vip_expiry, ?) WHERE telegram_id = ?')
        .run(Date.now() + item.value, uid);
      db.prepare(`
        INSERT INTO powerups (telegram_id, type, quantity) VALUES (?, 'doubleCoins', 7)
        ON CONFLICT(telegram_id, type) DO UPDATE SET quantity = quantity + 7
      `).run(uid);
      db.prepare("INSERT OR IGNORE INTO owned_skins (telegram_id, skin_id) VALUES (?, 'nyc')").run(uid);
      break;
  }
}

router.get('/catalog', (req, res) => {
  const db = getDb();
  const uid = req.telegramUser.id;
  const ownedSkins = db.prepare('SELECT skin_id FROM owned_skins WHERE telegram_id = ?').all(uid).map(r => r.skin_id);
  const powerUps = {};
  const puRows = db.prepare('SELECT type, quantity FROM powerups WHERE telegram_id = ?').all(uid);
  for (const r of puRows) powerUps[r.type] = r.quantity;
  const user = db.prepare('SELECT coins FROM users WHERE telegram_id = ?').get(uid);

  const catalog = Object.entries(SHOP_ITEMS).map(([id, item]) => ({
    id, ...item,
    owned: item.type === 'skin' ? ownedSkins.includes(item.skinId) : false,
    inventory: item.type === 'powerup' ? (powerUps[item.powerType] || 0) : null,
  }));

  res.json({ coins: user?.coins || 0, items: catalog });
});

router.post('/create-invoice', async (req, res) => {
  const { itemId } = req.body;
  const item = SHOP_ITEMS[itemId];
  if (!item) return res.status(400).json({ error: 'Unknown item' });

  const uid = req.telegramUser.id;
  const db = getDb();

  if (item.type === 'skin') {
    const owns = db.prepare('SELECT 1 FROM owned_skins WHERE telegram_id = ? AND skin_id = ?').get(uid, item.skinId);
    if (owns) return res.status(400).json({ error: 'Already owned' });
  }

  try {
    const bot = req.app.get('bot');
    const invoiceLink = await bot.api.createInvoiceLink(
      item.name, `Bert Runner NYC - ${item.name}`,
      JSON.stringify({ itemId, uid }), '', 'XTR',
      [{ label: item.name, amount: item.price }]
    );

    db.prepare(`INSERT INTO transactions (telegram_id, item_id, star_amount, status) VALUES (?, ?, ?, 'pending')`)
      .run(uid, itemId, item.price);

    res.json({ invoiceLink });
  } catch (err) {
    console.error('Invoice creation error:', err);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

router.post('/purchase-with-coins', (req, res) => {
  const { itemId } = req.body;
  const item = SHOP_ITEMS[itemId];
  if (!item) return res.status(400).json({ error: 'Unknown item' });

  const uid = req.telegramUser.id;
  const db = getDb();
  const user = db.prepare('SELECT coins FROM users WHERE telegram_id = ?').get(uid);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.coins < item.price) return res.status(403).json({ error: 'Insufficient coins', need: item.price, have: user.coins });

  if (item.type === 'skin') {
    const owns = db.prepare('SELECT 1 FROM owned_skins WHERE telegram_id = ? AND skin_id = ?').get(uid, item.skinId);
    if (owns) return res.status(400).json({ error: 'Already owned' });
  }

  db.prepare('UPDATE users SET coins = coins - ? WHERE telegram_id = ?').run(item.price, uid);
  deliverItem(db, uid, itemId, item);

  db.prepare(`INSERT INTO transactions (telegram_id, item_id, star_amount, status) VALUES (?, ?, ?, 'completed_coins')`)
    .run(uid, itemId, item.price);

  res.json({ success: true, item: itemId, remainingCoins: user.coins - item.price });
});

module.exports = router;
module.exports.SHOP_ITEMS = SHOP_ITEMS;
module.exports.deliverItem = deliverItem;
