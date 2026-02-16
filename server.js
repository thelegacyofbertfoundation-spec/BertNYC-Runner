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

const userRoutes = require('./user');
const gameRoutes = require('./game');
const shopRoutes = require('./shop');
const leaderboardRoutes = require('./leaderboard');
const adsRoutes = require('./ads');

const PORT = process.env.PORT || 3000;
const app = express();

// CRITICAL: Railway runs behind a proxy. Express must know this.
app.set('trust proxy', 1);

app.use(helmet({ contentSecurityPolicy: false }));

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Telegram-Data'],
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 60000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, slow down!' },
  validate: { xForwardedForHeader: false },
});
app.use('/api/', limiter);

app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    game: 'Bert Runner NYC',
    version: '1.0.1',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/user', authMiddleware, userRoutes);
app.use('/api/game', authMiddleware, gameRoutes);
app.use('/api/shop', authMiddleware, shopRoutes);
app.use('/api/leaderboard', authMiddleware, leaderboardRoutes);
app.use('/api/ads', authMiddleware, adsRoutes);
app.post('/api/ads/server-callback', adsRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

async function start() {
  initDatabase();

  app.listen(PORT, '0.0.0.0', () => {
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

  const BOT_TOKEN = process.env.BOT_TOKEN;
  if (!BOT_TOKEN || BOT_TOKEN === 'your_bot_token_here') {
    console.warn('⚠️  BOT_TOKEN not set. Bot features disabled.');
    return;
  }

  try {
    const bot = createBot(BOT_TOKEN);
    app.set('bot', bot);

    const RAILWAY_URL = process.env.RAILWAY_PUBLIC_DOMAIN 
      || process.env.FRONTEND_URL 
      || process.env.WEBHOOK_URL;

    if (process.env.NODE_ENV === 'production' && RAILWAY_URL) {
      let webhookBase = RAILWAY_URL;
      if (!webhookBase.startsWith('http')) webhookBase = `https://${webhookBase}`;
      const webhookPath = `/bot-webhook-${BOT_TOKEN.split(':')[0]}`;

      app.post(webhookPath, (req, res) => {
        bot.handleUpdate(req.body);
        res.sendStatus(200);
      });

      await bot.api.setWebhook(`${webhookBase}${webhookPath}`);
      console.log(`🤖 Bot running in webhook mode`);
      console.log(`   Webhook: ${webhookBase}${webhookPath}`);
    } else {
      bot.start({ onStart: () => console.log('🤖 Bot running in polling mode') });
    }
  } catch (err) {
    console.error('❌ Bot startup error:', err.message);
    console.warn('   API still running. Bot features disabled.');
  }
}

process.on('unhandledRejection', (err) => {
  console.error('⚠️ Unhandled rejection (non-fatal):', err.message);
});

start().catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
