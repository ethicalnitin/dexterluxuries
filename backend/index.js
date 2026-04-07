const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const path = require('path');
const compression = require('compression');
require('dotenv').config();
const bodyParser = require('body-parser');
const productRoutes = require("./routes/productRoutes");
const Product = require("./models/productData");

const app = express();
const MONGO_URL = process.env.MONGO_URL;
const PORT = process.env.PORT || 3046;

// ✅ Middleware
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'], credentials: true }));
app.use(compression());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/build')));

// ✅ Product Cache
let cache = {
  products: null,
  time: null,
};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const isCacheValid = () =>
  cache.products && cache.time && Date.now() - cache.time < CACHE_DURATION;

// ✅ Health Check Route (must be before wildcard)
app.get('/health', (req, res) => {
  console.log("Server is awake!");
  res.status(200).json({ message: "Server is awake!", uptime: process.uptime() });
});

// ✅ API Routes
app.use("/api/products", productRoutes);

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

      // ✅ Self-ping AFTER server starts (keeps Render awake)
      // ✅ Self-ping product list every 5 mins (warms up cache too)
    setInterval(() => {
    fetch(`https://dexterluxuries.onrender.com/api/products`)
    .then(res => res.json())
    .then(data => console.log(`[${new Date().toLocaleTimeString()}] Pinged products — ${data.length} items cached`))
    .catch(err => console.error('Self-ping failed:', err.message));
}, 5 * 60 * 1000); // every 5 minutes
       // every 9 minutes (Render sleeps at 15 mins)
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
    process.exit(1); // stop server if DB fails
  });