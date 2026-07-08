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
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: "HTML",
    }),
  });
}

async function sendTelegramPhoto(photoPath, caption) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
  const form = new FormData();
  form.append("chat_id", TELEGRAM_CHAT_ID);
  form.append("caption", caption, { contentType: "text/plain" });
  form.append("parse_mode", "HTML");
  form.append("photo", fs.createReadStream(photoPath));
  await fetch(url, { method: "POST", body: form });
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

// POST /api/deposit — receive UTR + email/username + screenshot, forward to Telegram
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

      // Self-ping every 5 mins (Render free tier keep-alive)
      setInterval(() => {
        fetch(`https://dexterluxuries.onrender.com/health`)
          .then(() => console.log(`[${new Date().toLocaleTimeString()}] Self-ping OK`))
          .catch(err => console.error("Self-ping failed:", err.message));
      }, 5 * 60 * 1000);
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