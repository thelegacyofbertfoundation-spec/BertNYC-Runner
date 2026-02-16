// ============================================
// TELEGRAM BOT (Grammy)
// Handles: /start, payments, pre_checkout
// ============================================
const { Bot, InlineKeyboard } = require('grammy');
const { getDb } = require('../db/connection');
const { SHOP_ITEMS, deliverItem } = require('../routes/shop');

function createBot(token) {
  const bot = new Bot(token);

  // ── /start command ──
  bot.command('start', async (ctx) => {
    const miniAppUrl = process.env.FRONTEND_URL || 'https://your-domain.com';

    const keyboard = new InlineKeyboard()
      .webApp('🐾 Play Bert Runner NYC!', miniAppUrl);

    await ctx.reply(
      '🏙️ *BERT RUNNER NYC*\n\n' +
      'Help Bert the Pom dodge taxis, jump over fire hydrants, and race through the streets of New York!\n\n' +
      '🏆 Compete on weekly & monthly leaderboards\n' +
      '🎨 Unlock premium skins\n' +
      '⚡ Power-ups & boosts\n' +
      '⭐ Shop with Telegram Stars\n\n' +
      'Tap below to start running! 🐾',
      {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      }
    );
  });

  // ── /help command ──
  bot.command('help', async (ctx) => {
    await ctx.reply(
      '🐾 *Bert Runner NYC - Help*\n\n' +
      '*Controls:*\n' +
      '• Swipe Left/Right → Change lanes\n' +
      '• Tap or Swipe Up → Jump\n\n' +
      '*Energy:*\n' +
      '• You get 5 free plays\n' +
      '• Energy regenerates every 20 mins\n' +
      '• Watch ads or buy Stars for more plays\n\n' +
      '*Shop:*\n' +
      '• Buy power-ups, skins, and energy with ⭐ Telegram Stars\n' +
      '• VIP Pass gives unlimited plays for 7 days!\n\n' +
      '*Leaderboards:*\n' +
      '• Weekly, Monthly, and All-Time rankings\n' +
      '• Top 3 players showcased with trophies\n\n' +
      '/start - Launch the game\n' +
      '/stats - View your stats\n' +
      '/leaderboard - Top players this week',
      { parse_mode: 'Markdown' }
    );
  });

  // ── /stats command ──
  bot.command('stats', async (ctx) => {
    const db = getDb();
    const uid = ctx.from.id;
    const user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(uid);

    if (!user) {
      return ctx.reply('You haven\'t played yet! Tap /start to begin.');
    }

    await ctx.reply(
      `📊 *Your Stats*\n\n` +
      `🏆 Best Score: *${user.best_score.toLocaleString()}*\n` +
      `🎮 Games Played: *${user.total_games}*\n` +
      `🪙 Coins: *${user.coins}*\n` +
      `⚡ Energy: *${user.energy}/5*\n` +
      `🎨 Skin: *${user.equipped_skin}*\n` +
      `${user.vip_expiry > Date.now() ? '👑 VIP Active!' : ''}`,
      { parse_mode: 'Markdown' }
    );
  });

  // ── /leaderboard command ──
  bot.command('leaderboard', async (ctx) => {
    const db = getDb();

    const top10 = db.prepare(`
      SELECT u.first_name, u.username, MAX(s.score) as best
      FROM scores s
      JOIN users u ON s.telegram_id = u.telegram_id
      WHERE s.created_at >= datetime('now', '-7 days')
      GROUP BY s.telegram_id
      ORDER BY best DESC
      LIMIT 10
    `).all();

    if (top10.length === 0) {
      return ctx.reply('No scores this week yet! Be the first to play.');
    }

    const medals = ['🥇', '🥈', '🥉'];
    let text = '🏆 *Weekly Leaderboard*\n\n';

    top10.forEach((entry, i) => {
      const medal = medals[i] || `${i + 1}.`;
      const name = entry.username ? `@${entry.username}` : entry.first_name;
      text += `${medal} ${name} — *${entry.best.toLocaleString()}*\n`;
    });

    const miniAppUrl = process.env.FRONTEND_URL || 'https://your-domain.com';
    const keyboard = new InlineKeyboard().webApp('🎮 Play Now!', miniAppUrl);

    await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: keyboard });
  });

  // ══════════════════════════════════════════
  // TELEGRAM STARS PAYMENT HANDLING
  // ══════════════════════════════════════════

  // ── Pre-checkout query: approve the purchase ──
  bot.on('pre_checkout_query', async (ctx) => {
    try {
      const payload = JSON.parse(ctx.preCheckoutQuery.invoice_payload);
      const { itemId, uid } = payload;

      // Validate item exists
      if (!SHOP_ITEMS[itemId]) {
        return ctx.answerPreCheckoutQuery(false, { error_message: 'Item no longer available' });
      }

      // If it's a skin, check not already owned
      const item = SHOP_ITEMS[itemId];
      if (item.type === 'skin') {
        const db = getDb();
        const owns = db.prepare('SELECT 1 FROM owned_skins WHERE telegram_id = ? AND skin_id = ?')
          .get(uid, item.skinId);
        if (owns) {
          return ctx.answerPreCheckoutQuery(false, { error_message: 'You already own this skin!' });
        }
      }

      // Approve the purchase
      await ctx.answerPreCheckoutQuery(true);
    } catch (err) {
      console.error('Pre-checkout error:', err);
      await ctx.answerPreCheckoutQuery(false, { error_message: 'Payment validation failed' });
    }
  });

  // ── Successful payment: deliver the item ──
  bot.on('message:successful_payment', async (ctx) => {
    try {
      const payment = ctx.message.successful_payment;
      const payload = JSON.parse(payment.invoice_payload);
      const { itemId, uid } = payload;
      const item = SHOP_ITEMS[itemId];

      if (!item) {
        console.error('Payment for unknown item:', itemId);
        return;
      }

      const db = getDb();

      // Deliver the item
      deliverItem(db, uid, itemId, item);

      // Record the transaction
      db.prepare(`
        INSERT INTO transactions (telegram_id, item_id, star_amount, tg_payment_id, status)
        VALUES (?, ?, ?, ?, 'completed')
      `).run(uid, itemId, payment.total_amount, payment.telegram_payment_charge_id);

      // Also credit the Stars to user's coin balance so they can see it in-game
      // (Stars are separate from coins - Stars are real payment, coins are in-game)

      console.log(`✅ Payment: User ${uid} bought ${item.name} for ${payment.total_amount} Stars`);

      await ctx.reply(
        `✅ *Purchase Successful!*\n\n` +
        `You received: *${item.name}*\n` +
        `Stars spent: ⭐ ${payment.total_amount}\n\n` +
        `Open the game to use your new item! 🐾`,
        { parse_mode: 'Markdown' }
      );
    } catch (err) {
      console.error('Payment delivery error:', err);
    }
  });

  // ── Error handler ──
  bot.catch((err) => {
    console.error('Bot error:', err);
  });

  return bot;
}

module.exports = { createBot };
