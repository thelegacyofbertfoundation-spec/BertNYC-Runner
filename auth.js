// ============================================
// TELEGRAM INIT DATA VALIDATION MIDDLEWARE
// ============================================
// Validates that requests come from a genuine
// Telegram Mini App session using HMAC-SHA-256
// ============================================
const crypto = require('crypto');

const BOT_TOKEN = process.env.BOT_TOKEN;
const MAX_AUTH_AGE_SECONDS = 86400; // 24 hours

/**
 * Parse Telegram initData query string into object
 */
function parseInitData(initData) {
  const params = new URLSearchParams(initData);
  const data = {};
  for (const [key, value] of params.entries()) {
    data[key] = value;
  }
  return data;
}

/**
 * Validate initData signature using HMAC-SHA-256
 * Reference: https://core.telegram.org/bots/webapps#validating-data
 */
function validateInitData(initData) {
  if (!initData || !BOT_TOKEN) return null;

  const parsed = parseInitData(initData);
  const hash = parsed.hash;
  if (!hash) return null;

  // Build data-check-string: all params except hash, sorted alphabetically
  const dataCheckString = Object.keys(parsed)
    .filter(key => key !== 'hash')
    .sort()
    .map(key => `${key}=${parsed[key]}`)
    .join('\n');

  // HMAC-SHA-256 of bot token with "WebAppData" as key
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(BOT_TOKEN)
    .digest();

  // HMAC-SHA-256 of data-check-string with secret key
  const computedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (computedHash !== hash) return null;

  // Check auth_date freshness
  const authDate = parseInt(parsed.auth_date, 10);
  if (isNaN(authDate)) return null;
  
  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > MAX_AUTH_AGE_SECONDS) return null;

  // Parse user object
  let user = null;
  try {
    user = JSON.parse(parsed.user);
  } catch (e) {
    return null;
  }

  return {
    user,
    queryId: parsed.query_id,
    authDate: authDate,
  };
}

/**
 * Express middleware: validates Telegram initData from header
 * Attaches req.telegramUser on success
 */
function authMiddleware(req, res, next) {
  // Accept initData from Authorization header or query param
  let initData = null;

  const authHeader = req.headers['authorization'] || req.headers['telegram-data'];
  if (authHeader) {
    // Support "tma <initData>" format or raw
    initData = authHeader.startsWith('tma ') 
      ? authHeader.slice(4) 
      : authHeader;
  } else if (req.query.initData) {
    initData = req.query.initData;
  } else if (req.body?.initData) {
    initData = req.body.initData;
  }

  // In development, allow bypass with mock user
  if (!initData && process.env.NODE_ENV === 'development') {
    req.telegramUser = {
      id: 123456789,
      first_name: 'Dev',
      last_name: 'User',
      username: 'devuser',
      is_premium: false,
    };
    return next();
  }

  const result = validateInitData(initData);
  if (!result) {
    return res.status(401).json({ error: 'Invalid or expired Telegram auth data' });
  }

  req.telegramUser = result.user;
  req.telegramQueryId = result.queryId;
  next();
}

module.exports = { authMiddleware, validateInitData, parseInitData };
