const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const path = require('path');
const compression = require('compression');
require('dotenv').config();
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch'); // npm install node-fetch@2
const productRoutes = require("./routes/productRoutes");

const app = express();
const MONGO_URL = process.env.MONGO_URL;
const PORT = process.env.PORT || 3046;

// ── Telegram config ───────────────────────────────────────────────────────────
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID   = process.env.TELEGRAM_CHAT_ID;

// ── Self-ping config (Render free-tier keep-alive) ────────────────────────────
// Set this to your deployed URL via env var instead of hardcoding it, so the
// same code works across environments (staging/prod/local) without edits.
const SELF_PING_URL = process.env.SELF_PING_URL || null;

if (!MONGO_URL) {
  console.error("[Startup] MONGO_URL is not set. Check your .env file.");
}
if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.warn("[Startup] TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set — Telegram notifications will be skipped.");
}

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'], credentials: true }));
app.use(compression());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/build')));

// ─── Multer — screenshot uploads ─────────────────────────────────────────────
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `screenshot_${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only image files are allowed"), false);
  },
});

// ─── Telegram helpers ─────────────────────────────────────────────────────────
async function sendTelegramMessage(text) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn("[Telegram] Bot token or chat ID not configured — skipping message.");
    return;
  }
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: "HTML",
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[Telegram] sendMessage failed (${res.status}): ${body}`);
  }
}

async function sendTelegramPhoto(photoPath, caption) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn("[Telegram] Bot token or chat ID not configured — skipping photo.");
    return;
  }
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
  const form = new FormData();
  form.append("chat_id", TELEGRAM_CHAT_ID);
  form.append("caption", caption, { contentType: "text/plain" });
  form.append("parse_mode", "HTML");
  form.append("photo", fs.createReadStream(photoPath));
  const res = await fetch(url, { method: "POST", body: form });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[Telegram] sendPhoto failed (${res.status}): ${body}`);
  }
}

// Minimal HTML escaping so nothing a user types can break Telegram's HTML parse mode
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ message: "Server is awake!", uptime: process.uptime() });
});

// Product routes
app.use("/api/products", productRoutes);

// POST /api/orders/notify — order intent (contact details + chosen payment
// method) sent from the payment modal on ProductPage.js, BEFORE the buyer
// actually pays. This is what was missing: ProductPage already calls this
// endpoint, but index.js never defined it, so nothing reached Telegram.
app.post('/api/orders/notify', async (req, res) => {
  const { productId, productName, amount, email, phone, method } = req.body || {};

  // ── Validation ──────────────────────────────────────────────────────────
  if (!email || String(email).trim().length < 3) {
    return res.status(400).json({ error: "Enter the email or username used at checkout" });
  }
  const phoneDigits = String(phone || "").replace(/\D/g, "");
  if (!(phoneDigits.length === 10 || (phoneDigits.length === 12 && phoneDigits.startsWith("91")))) {
    return res.status(400).json({ error: "Enter a valid phone number" });
  }
  if (amount === undefined || amount === null || Number.isNaN(Number(amount))) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  try {
    const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const captionLines = [
      `🛒 <b>New Order Started</b>`,
      ``,
      productId ? `🆔 <b>Product ID:</b> <code>${escapeHtml(String(productId).trim())}</code>` : null,
      productName ? `📦 <b>Product:</b> ${escapeHtml(String(productName).trim())}` : null,
      `💵 <b>Amount:</b> ₹${Number(amount).toLocaleString()}`,
      `👤 <b>Email/Username:</b> ${escapeHtml(String(email).trim())}`,
      `📱 <b>Phone:</b> ${escapeHtml(String(phone).trim())}`,
      `💳 <b>Method chosen:</b> ${escapeHtml(method || "—")}`,
      `🕐 <b>Time:</b> ${now}`,
    ].filter(Boolean);

    await sendTelegramMessage(captionLines.join("\n"));

    console.log(`[Order] Notified — Product: ${productName || productId}, Email/Phone: ${email.trim()}/${phone.trim()}, Method: ${method}`);

    res.json({ success: true });
  } catch (err) {
    console.error("[Order] notify error:", err.message);
    // Don't fail the checkout flow hard on a Telegram hiccup — the frontend
    // already treats this call as best-effort and proceeds to payment
    // regardless. Still return 500 so it's visible in logs/monitoring.
    res.status(500).json({ error: "Failed to notify order" });
  }
});

// POST /api/deposit — receive UTR + email/username + screenshot, forward to Telegram
// (this is the LATER step — after the buyer has actually paid — used by the
// bank-transfer payment page.)
app.post('/api/deposit', upload.single('screenshot'), async (req, res) => {
  const { utr, email, amount, method, productName, orderRef } = req.body;
  const screenshotFile = req.file;

  // ── Validation ──────────────────────────────────────────────────────────────
  // "email" doubles as email-or-username here, matching the frontend field.
  if (!email || email.trim().length < 3) {
    return res.status(400).json({ error: "Enter the email or username used at checkout" });
  }
  if (!utr || utr.trim().length < 6) {
    return res.status(400).json({ error: "UTR must be at least 6 characters" });
  }
  if (!screenshotFile) {
    return res.status(400).json({ error: "Payment screenshot is required" });
  }

  const screenshotPath = screenshotFile.path;

  try {
    // ── Build Telegram caption ────────────────────────────────────────────────
    const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const captionLines = [
      `💰 <b>New Deposit Submission</b>`,
      ``,
      orderRef ? `🎫 <b>Order Ref:</b> <code>${escapeHtml(orderRef.trim())}</code>` : null,
      productName ? `📦 <b>Product:</b> ${escapeHtml(productName.trim())}` : null,
      `👤 <b>Email/Username:</b> ${escapeHtml(email.trim())}`,
      `🔑 <b>UTR:</b> <code>${escapeHtml(utr.trim())}</code>`,
      `💵 <b>Amount:</b> ₹${amount ? Number(amount).toLocaleString() : "Not specified"}`,
      `📲 <b>Method:</b> ${escapeHtml(method || "—")}`,
      `🕐 <b>Time:</b> ${now}`,
    ].filter(Boolean);
    const caption = captionLines.join("\n");

    // ── Send photo + caption to Telegram ──────────────────────────────────────
    await sendTelegramPhoto(screenshotPath, caption);

    console.log(`[Deposit] Forwarded to Telegram — UTR: ${utr.trim()}, Email/Username: ${email.trim()}`);

    // ── Cleanup uploaded file ─────────────────────────────────────────────────
    fs.unlink(screenshotPath, () => {});

    res.json({ success: true, message: "Deposit submitted! You will be credited within 15–30 minutes." });
  } catch (err) {
    fs.unlink(screenshotPath, () => {});
    console.error("[Deposit] Error:", err.message);
    res.status(500).json({ error: "Failed to process submission. Please try again." });
  }
});

// Multer errors (bad file type, too large, etc.) land here instead of crashing
// the process or hanging the request.
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message === "Only image files are allowed") {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

// ─── Catch-all for React (must be last) ──────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// ─── Connect to MongoDB → start server ───────────────────────────────────────
mongoose
  .connect(MONGO_URL)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);

      // Self-ping every 5 mins (Render free tier keep-alive) — only runs if
      // SELF_PING_URL is configured, so this doesn't spam errors locally.
      if (SELF_PING_URL) {
        setInterval(() => {
          fetch(`${SELF_PING_URL}/health`)
            .then(() => console.log(`[${new Date().toLocaleTimeString()}] Self-ping OK`))
            .catch(err => console.error("Self-ping failed:", err.message));
        }, 5 * 60 * 1000);
      }
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  });

// ─── Graceful shutdown ────────────────────────────────────────────────────────
process.on("SIGTERM", () => {
  console.log("[Server] Shutting down gracefully...");
  process.exit(0);
});