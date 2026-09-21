const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const compression = require('compression');
require('dotenv').config();
const multer = require('multer');
const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch'); // npm install node-fetch@2
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Render (and most PaaS) sit behind a reverse proxy. Without this, req.ip is
// the proxy's IP for every visitor, so the rate limiter below would throttle
// all users as if they were one person.
app.set('trust proxy', 1);

const MONGO_URL = process.env.MONGO_URL;
const PORT = process.env.PORT || 3046;

// ── Telegram config ───────────────────────────────────────────────────────────
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// ── Self-ping config (Render free-tier keep-alive) ────────────────────────────
const SELF_PING_URL = process.env.SELF_PING_URL || null;

// ── CORS origins ──────────────────────────────────────────────────────────────
// Comma-separated list, e.g. ALLOWED_ORIGINS=https://yoursite.com,https://www.yoursite.com
// Falls back to "*" if unset.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

if (!MONGO_URL) {
  console.error('[Startup] MONGO_URL is not set. Check your .env file.');
}
if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.warn('[Startup] TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set — Telegram notifications will be skipped.');
}
if (!process.env.JWT_SECRET) {
  console.error('[Startup] JWT_SECRET is not set. Login will not work correctly until this is set in .env.');
}

// ─── Helpers (declared before use for readability) ────────────────────────────

// Minimal HTML escaping so nothing a user types can break Telegram's HTML parse mode
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function sendTelegramMessage(text) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('[Telegram] Bot token or chat ID not configured — skipping message.');
    return;
  }
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      // Telegram rejects messages over 4096 characters.
      text: String(text).slice(0, 4096),
      parse_mode: 'HTML',
    }),
    timeout: 15000,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[Telegram] sendMessage failed (${res.status}): ${body}`);
  }
}

async function sendTelegramPhoto(photoPath, caption) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('[Telegram] Bot token or chat ID not configured — skipping photo.');
    return;
  }
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
  const form = new FormData();
  form.append('chat_id', TELEGRAM_CHAT_ID);
  // sendPhoto captions are capped at 1024 characters — longer ones are rejected
  // outright, which used to silently lose the whole deposit notification.
  form.append('caption', String(caption).slice(0, 1024), { contentType: 'text/plain' });
  form.append('parse_mode', 'HTML');
  form.append('photo', fs.createReadStream(photoPath));
  const res = await fetch(url, { method: 'POST', body: form, timeout: 30000 });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[Telegram] sendPhoto failed (${res.status}): ${body}`);
    throw new Error(`Telegram sendPhoto failed with status ${res.status}`);
  }
}

// Delete a temp upload without caring whether it existed.
function removeFile(filePath) {
  if (!filePath) return;
  fs.unlink(filePath, () => {});
}

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(
  cors({
    // "*" and credentials:true are mutually exclusive per the CORS spec —
    // browsers reject that combination. Auth here is a Bearer token, not a
    // cookie, so credentials aren't needed.
    origin: ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS : '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(compression());
app.use(express.urlencoded({ extended: true, limit: '1mb' })); // replaces body-parser
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '../frontend/build')));

// ─── Multer — screenshot uploads ─────────────────────────────────────────────
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    // Derive the extension from the validated mimetype rather than from the
    // user-supplied filename, and add randomness so two uploads in the same
    // millisecond can't collide.
    const ext = MIME_TO_EXT[file.mimetype] || '.bin';
    const rand = Math.random().toString(36).slice(2, 8);
    cb(null, `screenshot_${Date.now()}_${rand}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_, file, cb) => {
    if (MIME_TO_EXT[file.mimetype]) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
});

// ─── Model: one document per submitted UTR ───────────────────────────────────
// The unique index stops the same UTR from being used to claim two orders.
const utrSchema = new mongoose.Schema({
  utr: { type: String, required: true, unique: true, index: true },
  orderRef: String,
  productId: String,
  productName: String,
  planName: String,
  amount: Number,
  email: String,
  createdAt: { type: Date, default: Date.now },
});
const UtrSubmission =
  mongoose.models.UtrSubmission || mongoose.model('UtrSubmission', utrSchema);

// ─── Tiny in-memory rate limiter: 8 submissions per IP per 10 minutes ────────
const RATE_WINDOW_MS = 10 * 60 * 1000;
const confirmHits = new Map();

// Without this sweep the Map grows forever — one entry per IP that ever hit the
// endpoint, which is a slow memory leak on a long-running process.
const rateSweep = setInterval(() => {
  const cutoff = Date.now() - RATE_WINDOW_MS;
  for (const [ip, times] of confirmHits) {
    const recent = times.filter((t) => t > cutoff);
    if (recent.length) confirmHits.set(ip, recent);
    else confirmHits.delete(ip);
  }
}, RATE_WINDOW_MS);
rateSweep.unref();

function confirmRateLimit(req, res, next) {
  const now = Date.now();
  const recent = (confirmHits.get(req.ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= 8) {
    return res.status(429).json({ error: 'Too many attempts. Please wait a few minutes and try again.' });
  }
  recent.push(now);
  confirmHits.set(req.ip, recent);
  next();
}

// Shared amount check: must be a finite number greater than zero.
// The old `Number.isNaN(Number(amount))` test passed for "" and null, both of
// which coerce to 0.
function parseAmount(value) {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Server is awake!', uptime: process.uptime() });
});

// Product routes
app.use('/api/products', productRoutes);

// Auth routes — email + OTP, no passwords. See routes/authRoutes.js.
app.use('/api/auth', authRoutes);

// POST /api/orders/notify — order intent (contact details + chosen payment
// method) sent from the payment modal on ProductPage.js, BEFORE the buyer pays.
// Public: no session required.
app.post('/api/orders/notify', async (req, res) => {
  const { productId, productName, amount, email, phone, method } = req.body || {};

  if (!email || String(email).trim().length < 3) {
    return res.status(400).json({ error: 'Enter the email or username used at checkout' });
  }
  const phoneDigits = String(phone || '').replace(/\D/g, '');
  if (!(phoneDigits.length === 10 || (phoneDigits.length === 12 && phoneDigits.startsWith('91')))) {
    return res.status(400).json({ error: 'Enter a valid phone number' });
  }
  const amountNum = parseAmount(amount);
  if (amountNum === null) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  try {
    const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const captionLines = [
      `🛒 <b>New Order Started</b>`,
      ``,
      productId ? `🆔 <b>Product ID:</b> <code>${escapeHtml(String(productId).trim())}</code>` : null,
      productName ? `📦 <b>Product:</b> ${escapeHtml(String(productName).trim())}` : null,
      `💵 <b>Amount:</b> ₹${amountNum.toLocaleString('en-IN')}`,
      `👤 <b>Email/Username:</b> ${escapeHtml(String(email).trim())}`,
      `📱 <b>Phone:</b> ${escapeHtml(String(phone).trim())}`,
      `💳 <b>Method chosen:</b> ${escapeHtml(method || '—')}`,
      `🕐 <b>Time:</b> ${now}`,
    ].filter(Boolean);

    await sendTelegramMessage(captionLines.join('\n'));

    console.log(
      `[Order] Notified — Product: ${productName || productId}, Email: ${String(email).trim()}, Method: ${method}`
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[Order] notify error:', err.message);
    res.status(500).json({ error: 'Failed to notify order' });
  }
});

// POST /api/orders/confirm — called when the buyer taps "I've paid" on
// PaymentPage.js. Validates the 12-digit UTR, stores it, and sends it to Telegram.
// Public: no session required.
app.post('/api/orders/confirm', confirmRateLimit, async (req, res) => {
  const { productId, productName, planName, amount, email, orderRef, utr, method } = req.body || {};

  // ── Validation ──────────────────────────────────────────────────────────
  const utrClean = String(utr || '').trim();
  if (!/^\d{12}$/.test(utrClean)) {
    return res.status(400).json({ error: 'UTR must be exactly 12 digits.' });
  }
  const amountNum = parseAmount(amount);
  if (amountNum === null) {
    return res.status(400).json({ error: 'Invalid amount.' });
  }
  const orderRefClean = String(orderRef || '').trim();
  if (!orderRefClean || orderRefClean.length > 20) {
    return res.status(400).json({ error: 'Missing order reference.' });
  }

  // ── Save (rejects reused UTRs) ──────────────────────────────────────────
  try {
    await UtrSubmission.create({
      utr: utrClean,
      orderRef: orderRefClean,
      productId: productId ? String(productId).trim() : undefined,
      productName: productName ? String(productName).trim() : undefined,
      planName: planName ? String(planName).trim() : undefined,
      amount: amountNum,
      email: email ? String(email).trim() : undefined,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        error: "This UTR has already been submitted. If that's a mistake, message us on WhatsApp.",
      });
    }
    console.error('[Confirm] DB error:', err.message);
    return res.status(500).json({ error: 'Could not record your payment. Please try again.' });
  }

  // ── Telegram (best-effort: the UTR is already safely in MongoDB) ────────
  try {
    const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const lines = [
      `💰 <b>Payment Submitted — verify in bank app</b>`,
      ``,
      `🎫 <b>Order Ref:</b> <code>${escapeHtml(orderRefClean)}</code>`,
      `🔑 <b>UTR:</b> <code>${escapeHtml(utrClean)}</code>`,
      `💵 <b>Amount:</b> ₹${amountNum.toLocaleString('en-IN')}`,
      productName ? `📦 <b>Product:</b> ${escapeHtml(String(productName).trim())}` : null,
      planName ? `🗂 <b>Plan:</b> ${escapeHtml(String(planName).trim())}` : null,
      productId ? `🆔 <b>Product ID:</b> <code>${escapeHtml(String(productId).trim())}</code>` : null,
      email ? `👤 <b>Deliver to:</b> ${escapeHtml(String(email).trim())}` : null,
      `📲 <b>Method:</b> ${escapeHtml(method || 'UPI')}`,
      `🕐 <b>Time:</b> ${now}`,
    ].filter(Boolean);

    await sendTelegramMessage(lines.join('\n'));
    console.log(`[Confirm] UTR ${utrClean} — ${orderRefClean} — sent to Telegram`);
  } catch (err) {
    console.error('[Confirm] Telegram error:', err.message);
  }

  res.json({ success: true });
});

// POST /api/deposit — receive UTR + email/username + screenshot, forward to Telegram.
// This is the LATER step — after the buyer has actually paid — used by the
// bank-transfer payment page.
// Public: no session required.
app.post('/api/deposit', upload.single('screenshot'), async (req, res) => {
  const { utr, email, amount, method, productName, orderRef } = req.body || {};
  const screenshotFile = req.file;
  const screenshotPath = screenshotFile ? screenshotFile.path : null;

  // ── Validation ──────────────────────────────────────────────────────────────
  // Multer has already written the file to disk by the time we get here, so
  // every early return has to clean it up or the uploads dir fills with
  // orphaned screenshots.
  if (!email || String(email).trim().length < 3) {
    removeFile(screenshotPath);
    return res.status(400).json({ error: 'Enter the email or username used at checkout' });
  }
  if (!utr || String(utr).trim().length < 6) {
    removeFile(screenshotPath);
    return res.status(400).json({ error: 'UTR must be at least 6 characters' });
  }
  if (!screenshotFile) {
    return res.status(400).json({ error: 'Payment screenshot is required' });
  }

  try {
    const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const amountNum = parseAmount(amount);
    const captionLines = [
      `💰 <b>New Deposit Submission</b>`,
      ``,
      orderRef ? `🎫 <b>Order Ref:</b> <code>${escapeHtml(String(orderRef).trim())}</code>` : null,
      productName ? `📦 <b>Product:</b> ${escapeHtml(String(productName).trim())}` : null,
      `👤 <b>Email/Username:</b> ${escapeHtml(String(email).trim())}`,
      `🔑 <b>UTR:</b> <code>${escapeHtml(String(utr).trim())}</code>`,
      `💵 <b>Amount:</b> ₹${amountNum !== null ? amountNum.toLocaleString('en-IN') : 'Not specified'}`,
      `📲 <b>Method:</b> ${escapeHtml(method || '—')}`,
      `🕐 <b>Time:</b> ${now}`,
    ].filter(Boolean);

    await sendTelegramPhoto(screenshotPath, captionLines.join('\n'));

    console.log(`[Deposit] Forwarded to Telegram — UTR: ${String(utr).trim()}, Email: ${String(email).trim()}`);

    removeFile(screenshotPath);
    res.json({ success: true, message: 'Deposit submitted! You will be credited within 15–30 minutes.' });
  } catch (err) {
    removeFile(screenshotPath);
    console.error('[Deposit] Error:', err.message);
    res.status(500).json({ error: 'Failed to process submission. Please try again.' });
  }
});

// ─── Unknown API routes → JSON 404 ───────────────────────────────────────────
// Without this, the React catch-all below answers /api/typo with index.html and
// HTTP 200, so the frontend gets HTML where it expected JSON and fails with a
// confusing "Unexpected token <" parse error.
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ─── Catch-all for React ─────────────────────────────────────────────────────
// Express 5 no longer accepts a bare '*' pattern; /*splat works on Express 5 and
// a regex works on both. Using a regex keeps this version-proof.
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// ─── Error handler (must be LAST, and must take 4 args) ──────────────────────
app.use((err, req, res, next) => {
  // Clean up any file multer managed to write before failing.
  if (req.file) removeFile(req.file.path);

  if (err instanceof multer.MulterError) {
    const msg =
      err.code === 'LIMIT_FILE_SIZE' ? 'Image must be under 10 MB' : err.message;
    return res.status(400).json({ error: msg });
  }
  if (err && err.message === 'Only image files are allowed') {
    return res.status(400).json({ error: err.message });
  }
  console.error('[Server] Unhandled error:', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Something went wrong' });
});

// ─── Connect to MongoDB → start server ───────────────────────────────────────
let server;
let selfPingTimer;

mongoose
  .connect(MONGO_URL)
  .then(() => {
    console.log('MongoDB connected');
    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);

      if (SELF_PING_URL) {
        selfPingTimer = setInterval(() => {
          fetch(`${SELF_PING_URL}/health`)
            .then(() => console.log(`[${new Date().toLocaleTimeString()}] Self-ping OK`))
            .catch((err) => console.error('Self-ping failed:', err.message));
        }, 5 * 60 * 1000);
      }
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err);
    process.exit(1);
  });

// ─── Graceful shutdown ────────────────────────────────────────────────────────
// The old handler called process.exit(0) immediately, killing in-flight
// requests and leaving the Mongo connection open.
let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[Server] ${signal} received — shutting down gracefully...`);

  if (selfPingTimer) clearInterval(selfPingTimer);
  clearInterval(rateSweep);

  // Hard limit so a stuck connection can't block the deploy forever.
  const force = setTimeout(() => {
    console.error('[Server] Forced exit after timeout');
    process.exit(1);
  }, 10000);
  force.unref();

  try {
    if (server) await new Promise((resolve) => server.close(resolve));
    await mongoose.connection.close(false);
    console.log('[Server] Closed cleanly');
    process.exit(0);
  } catch (err) {
    console.error('[Server] Error during shutdown:', err.message);
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled promise rejection:', reason);
});