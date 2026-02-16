// ============================================
// BERT RUNNER NYC - MAIN SERVER
// ============================================
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { initDatabase } = require('./init');
const { authMiddleware } = require('./auth');
const { createBot } = require('./telegram');

// Routes
const userRoutes = require('./user');
const gameRoutes = require('./game');
const shopRoutes = require('./shop');
const leaderboardRoutes = require('./leaderboard');
const adsRoutes = require('./ads');

const PORT = process.env.PORT || 3000;
const app = express();

// ══════════════════════════════════════════
// MIDDLEWARE
// ══════════════════════════════════════════

app.use(helmet({ contentSecurityPolicy: false }));

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Telegram-Data'],
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, slow down!' },
});
app.use('/api/', limiter);

app.use(express.static(path.join(__dirname, 'public')));

// ══════════════════════════════════════════
// HEALTH CHECK
// ══════════════════════════════════════════
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    game: 'Bert Runner NYC',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ══════════════════════════════════════════
// API ROUTES
// ══════════════════════════════════════════
app.use('/api/user', authMiddleware, userRoutes);
app.use('/api/game', authMiddleware, gameRoutes);
app.use('/api/shop', authMiddleware, shopRoutes);
app.use('/api/leaderboard', authMiddleware, leaderboardRoutes);
app.use('/api/ads', authMiddleware, adsRoutes);
app.post('/api/ads/server-callback', adsRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// ══════════════════════════════════════════
// START SERVER & BOT
// ══════════════════════════════════════════
async function start() {
  // 1. Initialize database
  initDatabase();

  // 2. Start Express FIRST (so the API is always available)
  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════╗
║      🐾 BERT RUNNER NYC - BACKEND 🐾     ║
╠══════════════════════════════════════════╣
║  Server:  http://localhost:${PORT}          ║
║  Env:     ${(process.env.NODE_ENV || 'development').padEnd(29)}║
║  API:     /api/health                    ║
╚══════════════════════════════════════════╝
    `);
  });

  // 3. Start bot AFTER server is listening (so crashes don't kill the API)
  const BOT_TOKEN = process.env.BOT_TOKEN;
  if (!BOT_TOKEN || BOT_TOKEN === 'your_bot_token_here') {
    console.warn('⚠️  BOT_TOKEN not set. Bot features disabled.');
    return;
  }

  try {
    const bot = createBot(BOT_TOKEN);
    app.set('bot', bot);

    // PRODUCTION: Always use webhooks (Railway gives us a public URL)
    const RAILWAY_URL = process.env.RAILWAY_PUBLIC_DOMAIN 
      || process.env.FRONTEND_URL 
      || process.env.WEBHOOK_URL;

    if (process.env.NODE_ENV === 'production' && RAILWAY_URL) {
      // Clean the URL - ensure https:// prefix
      let webhookBase = RAILWAY_URL;
      if (!webhookBase.startsWith('http')) webhookBase = `https://${webhookBase}`;
      
      const webhookPath = `/bot-webhook-${BOT_TOKEN.split(':')[0]}`;
      
      // Register webhook route BEFORE setting webhook
      app.post(webhookPath, (req, res) => {
        bot.handleUpdate(req.body);
        res.sendStatus(200);
      });

      await bot.api.setWebhook(`${webhookBase}${webhookPath}`);
      console.log(`🤖 Bot running in webhook mode`);
      console.log(`   Webhook: ${webhookBase}${webhookPath}`);
    } else {
      // DEVELOPMENT: Use polling
      bot.start({
        onStart: () => console.log('🤖 Bot running in polling mode'),
      });
    }
  } catch (err) {
    // Bot error should NOT crash the server
    console.error('❌ Bot startup error:', err.message);
    console.warn('   API still running. Bot features disabled.');
  }
}

// Catch unhandled rejections so bot errors don't crash the process
process.on('unhandledRejection', (err) => {
  console.error('⚠️ Unhandled rejection (non-fatal):', err.message);
});

start().catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
