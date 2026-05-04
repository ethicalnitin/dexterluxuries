const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const path = require('path');
const compression = require('compression');
require('dotenv').config();
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const cron = require('node-cron');
const productRoutes = require("./routes/productRoutes");
const Product = require("./models/productData");
const lotus365 = require("./services/lotus365.service");

const app = express();
const MONGO_URL = process.env.MONGO_URL;
const PORT = process.env.PORT || 3046;
const QR_REFRESH_MINUTES = parseInt(process.env.QR_REFRESH_INTERVAL) || 10;

// ✅ Middleware
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'], credentials: true }));
app.use(compression());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/build')));

// ✅ Multer — screenshot uploads
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

// ✅ Product Cache
let cache = {
  products: null,
  time: null,
};
const CACHE_DURATION = 5 * 60 * 1000;
const isCacheValid = () =>
  cache.products && cache.time && Date.now() - cache.time < CACHE_DURATION;

// ✅ QR State — cached per amount
let qrCache = {};
// qrCache[amount] = { methods, nextRefreshAt, lastUpdated, isLoading, error }

function getQrState(amount) {
  if (!qrCache[amount]) {
    qrCache[amount] = {
      methods: [],
      nextRefreshAt: null,
      lastUpdated: null,
      isLoading: false,
      error: null,
    };
  }
  return qrCache[amount];
}

async function updateQR(amount) {
  const state = getQrState(amount);
  if (state.isLoading) return;
  state.isLoading = true;
  state.error = null;
  try {
    const result = await lotus365.refreshQR(amount);
    state.methods = result.methods;
    state.nextRefreshAt = result.nextRefreshAt;
    state.lastUpdated = result.timestamp;
    console.log(`[QR] Updated for amount=₹${amount} at ${new Date().toLocaleTimeString()}`);
  } catch (err) {
    state.error = err.message;
    console.error(`[QR] Update failed for amount=₹${amount}:`, err.message);
  } finally {
    state.isLoading = false;
  }
}

// ✅ Health Check
app.get('/health', (req, res) => {
  console.log("Server is awake!");
  res.status(200).json({ message: "Server is awake!", uptime: process.uptime() });
});

// ✅ Product Routes
app.use("/api/products", productRoutes);

// ─────────────────────────────────────────────────────────────
// ✅ Payment / QR Routes
// ─────────────────────────────────────────────────────────────

// GET /api/qr?amount=2000 — return QR for the given amount
app.get('/api/qr', async (req, res) => {
  const amount = parseInt(req.query.amount) || parseInt(process.env.DEFAULT_DEPOSIT_AMOUNT) || 500;

  if (isNaN(amount) || amount < 300) {
    return res.status(400).json({ error: "Amount must be at least 300" });
  }

  const state = getQrState(amount);

  // If nothing cached for this amount yet, trigger a fresh fetch
  if (!state.lastUpdated && !state.isLoading) {
    updateQR(amount); // fire without awaiting — client will poll
  }

  if (state.isLoading && state.methods.length === 0) {
    return res.json({ loading: true, message: "QR is being fetched, please wait..." });
  }
  if (state.error && state.methods.length === 0) {
    return res.status(500).json({ error: state.error });
  }

  res.json({
    methods: state.methods,
    lastUpdated: state.lastUpdated,
    nextRefreshAt: state.nextRefreshAt,
    isRefreshing: state.isLoading,
  });
});

// POST /api/qr/refresh?amount=2000 — manually trigger QR refresh
app.post('/api/qr/refresh', (req, res) => {
  const amount = parseInt(req.query.amount || req.body.amount) || parseInt(process.env.DEFAULT_DEPOSIT_AMOUNT) || 500;
  updateQR(amount);
  res.json({ message: `QR refresh triggered for ₹${amount}` });
});

// POST /api/deposit — submit deposit with UTR + screenshot
app.post('/api/deposit', upload.single('screenshot'), async (req, res) => {
  const { utr, amount } = req.body;
  const screenshotFile = req.file;

  if (!utr || utr.trim().length < 6) {
    return res.status(400).json({ error: "UTR must be at least 6 digits" });
  }
  if (!amount || isNaN(amount) || Number(amount) < 300) {
    return res.status(400).json({ error: "Amount must be at least 300" });
  }
  if (!screenshotFile) {
    return res.status(400).json({ error: "Payment screenshot is required" });
  }

  const screenshotPath = screenshotFile.path;
  try {
    const result = await lotus365.submitDeposit({
      utr: utr.trim(),
      screenshotPath,
      amount: Number(amount),
      method: req.body.method || "gpay",
    });
    fs.unlink(screenshotPath, () => {});
    res.json({ success: result.success, message: result.message || "Deposit submitted" });
  } catch (err) {
    fs.unlink(screenshotPath, () => {});
    res.status(500).json({ error: "Deposit submission failed: " + err.message });
  }
});

// ─────────────────────────────────────────────────────────────

// ✅ Catch-all for React frontend (must be last)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// ✅ Connect to MongoDB, then start server
mongoose
  .connect(MONGO_URL)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);

      // ✅ Initial QR fetch on startup with default amount
      const defaultAmount = parseInt(process.env.DEFAULT_DEPOSIT_AMOUNT) || 500;
      updateQR(defaultAmount);

      // ✅ Cron: refresh all cached amounts every N minutes
      cron.schedule(`*/${QR_REFRESH_MINUTES} * * * *`, () => {
        console.log(`[QR] Cron refresh triggered`);
        const cachedAmounts = Object.keys(qrCache);
        if (cachedAmounts.length === 0) {
          updateQR(defaultAmount);
        } else {
          cachedAmounts.forEach(amt => updateQR(parseInt(amt)));
        }
      });

      // ✅ Self-ping every 5 mins
      setInterval(() => {
        fetch(`https://dexterluxuries.onrender.com/api/products`)
          .then(res => res.json())
          .then(data => console.log(`[${new Date().toLocaleTimeString()}] Pinged products — ${data.length} items cached`))
          .catch(err => console.error('Self-ping failed:', err.message));
      }, 5 * 60 * 1000);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  });

// ✅ Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("[Server] Shutting down...");
  await lotus365.closeBrowser();
  process.exit(0);
});