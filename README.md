# 🐾 Bert Runner NYC — Backend

Complete backend for the Bert Runner NYC Telegram Mini App game with Telegram Stars monetization, server-side leaderboards, energy management, and anti-cheat protection.

## Architecture

```
bert-runner-backend/
├── .env.example          # Environment configuration template
├── package.json
├── public/               # Place your frontend HTML here
│   └── index.html        # The Bert Runner game (from the frontend build)
├── data/                 # SQLite database (auto-created)
│   └── bert-runner.db
└── src/
    ├── server.js         # Express entry point
    ├── bot/
    │   └── telegram.js   # Grammy bot: /start, payments, pre_checkout
    ├── db/
    │   ├── init.js       # Schema & migrations
    │   └── connection.js # SQLite singleton
    ├── middleware/
    │   └── auth.js       # Telegram initData HMAC validation
    └── routes/
        ├── user.js       # Auth, profile, energy regen, skin equip
        ├── game.js       # Start session, submit score (anti-cheat)
        ├── shop.js       # Catalog, Star invoices, coin purchases
        ├── leaderboard.js# Weekly / monthly / all-time rankings
        └── ads.js        # Rewarded ad verification & grants
```

## Quick Start

### 1. Prerequisites
- Node.js 18+
- A Telegram Bot token from [@BotFather](https://t.me/BotFather)

### 2. Setup
```bash
cd bert-runner-backend
cp .env.example .env
# Edit .env with your BOT_TOKEN
npm run setup    # Installs deps + creates database
npm run dev      # Starts with hot-reload (nodemon)
```

### 3. Configure Mini App in BotFather
```
/mybots → Select your bot → Bot Settings → Configure Mini App → Enable Mini App
```
Set the Mini App URL to your deployed domain (e.g. `https://bert-runner.yourdomain.com`).

### 4. Deploy
The backend serves both the API and the static frontend. Place your built `bert-runner-nyc.html` into `public/index.html`.

## API Reference

All `/api/*` routes (except `/api/health`) require Telegram initData authentication via one of:
- `Authorization: tma <initData>` header
- `Telegram-Data: <initData>` header  
- `initData` field in request body

### Auth & User

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/user/auth` | Login/register, returns full profile |
| GET | `/api/user/profile` | Get current user state |
| POST | `/api/user/equip-skin` | Equip an owned skin |

### Game

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/game/start` | Deduct energy, get session token |
| POST | `/api/game/submit` | Submit score (anti-cheat validated) |
| POST | `/api/game/continue` | Buy a mid-run continue |

**Start Game Request:**
```json
POST /api/game/start
{
  "usePowerUps": ["shield", "scoreBoost"]
}
```
**Response:**
```json
{
  "sessionToken": "a1b2c3...",
  "energy": 4,
  "activePowerUps": { "shield": true, "scoreBoost": true }
}
```

**Submit Score Request:**
```json
POST /api/game/submit
{
  "sessionToken": "a1b2c3...",
  "score": 847,
  "coinsEarned": 23,
  "continuesUsed": 1,
  "skinUsed": "golden"
}
```

### Shop

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/shop/catalog` | Get all items + user's inventory |
| POST | `/api/shop/create-invoice` | Generate Telegram Stars invoice |
| POST | `/api/shop/purchase-with-coins` | Buy with in-game coins |

**Create Invoice Request:**
```json
POST /api/shop/create-invoice
{ "itemId": "skin_galaxy" }
```
**Response:**
```json
{ "invoiceLink": "https://t.me/$..." }
```
Open this link with `Telegram.WebApp.openInvoice(invoiceLink)` in the frontend.

### Leaderboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leaderboard/weekly` | Top 50 this week |
| GET | `/api/leaderboard/monthly` | Top 50 this month |
| GET | `/api/leaderboard/alltime` | Top 50 all time |
| GET | `/api/leaderboard/around-me/:period` | Players near your rank |

### Ads

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ads/reward` | Claim reward after watching ad |
| GET | `/api/ads/status` | Remaining ads today |
| POST | `/api/ads/server-callback` | Network S2S callback |

## Anti-Cheat System

The backend validates scores by:
1. **Session tokens** — Each game start generates a unique token that can only submit once
2. **Time-based validation** — Score is capped at `MAX_SCORE_PER_SECOND × duration`
3. **User binding** — Sessions are locked to the authenticated Telegram user
4. **Power-up tracking** — Server tracks which boosts were active (affects score cap)
5. **Rate limiting** — Global rate limits prevent request flooding
6. **Ad abuse limits** — Max 10 ad rewards per user per day

## Telegram Stars Payment Flow

```
Frontend                    Backend                     Telegram
   │                          │                           │
   ├─POST /shop/create-invoice│                           │
   │     { itemId }           │                           │
   │                          ├─bot.api.createInvoiceLink─│
   │                          │                           │
   │◄─── { invoiceLink } ────│                           │
   │                          │                           │
   ├─WebApp.openInvoice()────────────────────────────────►│
   │                          │                           │
   │                          │◄──pre_checkout_query──────│
   │                          ├──answerPreCheckoutQuery──►│
   │                          │                           │
   │                          │◄──successful_payment──────│
   │                          ├──deliverItem()            │
   │                          ├──record transaction       │
   │                          │                           │
   │◄─ User reopens app, sees item in inventory ─────────│
```

## Monetization Items

| Item | Stars Price | Type |
|------|------------|------|
| 3 Extra Plays | 15 ⭐ | Energy |
| 10 Plays | 40 ⭐ | Energy |
| Unlimited 24h | 75 ⭐ | Time-limited |
| Coin Magnet | 10 ⭐ | Power-up |
| Shield | 12 ⭐ | Power-up |
| 2x Coins | 8 ⭐ | Power-up |
| 2x Score | 15 ⭐ | Power-up |
| Skins | 50-120 ⭐ | Permanent |
| Weekly VIP | 150 ⭐ | Subscription bundle |

## Rewarded Ads Integration

The backend supports any rewarded ad SDK. Recommended providers for Telegram Mini Apps:

- **AdsGram** — Purpose-built for Telegram, easy integration
- **AppLixir** — HTML5 game specialist, high eCPMs
- **PropellerAds** — Large inventory, rewarded + interstitial formats

Integration pattern:
1. Frontend shows ad via SDK
2. On completion, frontend calls `POST /api/ads/reward` with the ad token
3. Backend verifies (via S2S callback in production) and grants reward
4. Max 10 rewards/day per user to prevent abuse

## Deployment Options

**Railway / Render / Fly.io (recommended):**
```bash
# Railway
railway init
railway add
railway up

# Or Render: connect GitHub repo, set env vars in dashboard
```

**VPS (Ubuntu):**
```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and setup
git clone <your-repo> && cd bert-runner-backend
cp .env.example .env
nano .env  # Set BOT_TOKEN, FRONTEND_URL, NODE_ENV=production
npm run setup
npm start

# Use PM2 for process management
npm i -g pm2
pm2 start src/server.js --name bert-runner
pm2 save && pm2 startup
```

**NGINX reverse proxy:**
```nginx
server {
    listen 443 ssl;
    server_name bert-runner.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Frontend Integration

Update your game's frontend to call the backend API instead of using localStorage:

```javascript
// In your game's init:
const API = 'https://bert-runner.yourdomain.com/api';
const initData = window.Telegram?.WebApp?.initData;
const headers = { 
  'Content-Type': 'application/json',
  'Authorization': `tma ${initData}` 
};

// Login
const { user } = await fetch(`${API}/user/auth`, { method: 'POST', headers }).then(r => r.json());

// Start game
const { sessionToken, energy } = await fetch(`${API}/game/start`, {
  method: 'POST', headers,
  body: JSON.stringify({ usePowerUps: ['shield'] })
}).then(r => r.json());

// Submit score
const result = await fetch(`${API}/game/submit`, {
  method: 'POST', headers,
  body: JSON.stringify({ sessionToken, score: 847, coinsEarned: 23 })
}).then(r => r.json());

// Buy with Stars
const { invoiceLink } = await fetch(`${API}/shop/create-invoice`, {
  method: 'POST', headers,
  body: JSON.stringify({ itemId: 'energy3' })
}).then(r => r.json());
window.Telegram.WebApp.openInvoice(invoiceLink);

// Leaderboard
const lb = await fetch(`${API}/leaderboard/weekly`, { headers }).then(r => r.json());
```

## License
MIT — Dr. Inker LABS
