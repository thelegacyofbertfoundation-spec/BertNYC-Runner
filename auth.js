// ============================================
// TELEGRAM INIT DATA VALIDATION MIDDLEWARE
// ============================================
const crypto = require('crypto');

const BOT_TOKEN = process.env.BOT_TOKEN;
const MAX_AUTH_AGE_SECONDS = 86400;

function parseInitData(initData) {
  const params = new URLSearchParams(initData);
  const data = {};
  for (const [key, value] of params.entries()) data[key] = value;
  return data;
}

function validateInitData(initData) {
  if (!initData || !BOT_TOKEN) return null;

  const parsed = parseInitData(initData);
  const hash = parsed.hash;
  if (!hash) return null;

  const dataCheckString = Object.keys(parsed)
    .filter(key => key !== 'hash')
    .sort()
    .map(key => `${key}=${parsed[key]}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  if (computedHash !== hash) return null;

  const authDate = parseInt(parsed.auth_date, 10);
  if (isNaN(authDate)) return null;
  if (Math.floor(Date.now() / 1000) - authDate > MAX_AUTH_AGE_SECONDS) return null;

  let user = null;
  try { user = JSON.parse(parsed.user); } catch (e) { return null; }

  return { user, queryId: parsed.query_id, authDate };
}

function authMiddleware(req, res, next) {
  let initData = null;

  const authHeader = req.headers['authorization'] || req.headers['telegram-data'];
  if (authHeader) {
    initData = authHeader.startsWith('tma ') ? authHeader.slice(4) : authHeader;
  } else if (req.query.initData) {
    initData = req.query.initData;
  } else if (req.body?.initData) {
    initData = req.body.initData;
  }

  if (!initData && process.env.NODE_ENV === 'development') {
    req.telegramUser = {
      id: 123456789, first_name: 'Dev', last_name: 'User',
      username: 'devuser', is_premium: false,
    };
    return next();
  }

  const result = validateInitData(initData);
  if (!result) return res.status(401).json({ error: 'Invalid or expired Telegram auth data' });

  req.telegramUser = result.user;
  req.telegramQueryId = result.queryId;
  next();
}

module.exports = { authMiddleware, validateInitData, parseInitData };
