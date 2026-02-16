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

// Security headers
app.use(helmet({
  contentSecurityPolicy: false,
}));

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Telegram-Data'],
}));

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, slow down!' },
});
app.use('/api/', limiter);

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// ══════════════════════════════════════════
// HEALTH CHECK (no auth required)
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
// API ROUTES (auth required)
// ══════════════════════════════════════════
app.use('/api/user', authMiddleware, userRoutes);
app.use('/api/game', authMiddleware, gameRoutes);
app.use('/api/shop', authMiddleware, shopRoutes);
app.use('/api/leaderboard', authMiddleware, leaderboardRoutes);
app.use('/api/ads', authMiddleware, adsRoutes);

// Ad network server-to-server callback
app.post('/api/ads/server-callback', adsRoutes);

// ══════════════════════════════════════════
// CATCH-ALL: Serve frontend
// ══════════════════════════════════════════
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// ══════════════════════════════════════════
// START SERVER & BOT
// ══════════════════════════════════════════
async function start() {
  // 1. Initialize database
  initDatabase();

  // 2. Create and start Telegram bot
  const BOT_TOKEN = process.env.BOT_TOKEN;
  if (!BOT_TOKEN || BOT_TOKEN === 'your_bot_token_here') {
    console.warn('⚠️  BOT_TOKEN not set. Bot features disabled. Set it in .env');
  } else {
    try {
      const bot = createBot(BOT_TOKEN);
      app.set('bot', bot);

      if (process.env.NODE_ENV === 'production' && process.env.WEBHOOK_URL) {
        const webhookPath = `/bot${BOT_TOKEN.split(':')[0]}`;
        app.post(webhookPath, express.json(), (req, res) => {
          bot.handleUpdate(req.body);
          res.sendStatus(200);
        });
        await bot.api.setWebhook(`${process.env.WEBHOOK_URL}${webhookPath}`);
        console.log('🤖 Bot running in webhook mode');
      } else {
        bot.start({
          onStart: () => console.log('🤖 Bot running in polling mode'),
        });
      }
    } catch (err) {
      console.error('❌ Bot startup error:', err.message);
      console.warn('   Continuing without bot. Check your BOT_TOKEN.');
    }
  }

  // 3. Start Express server
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
}

start().catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
