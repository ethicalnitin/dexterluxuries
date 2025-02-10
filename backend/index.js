const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const compression = require('compression');
require('dotenv').config();
const bodyParser= require('body-parser');
const path = require("path"); // <-- Add this
const productRoutes = require("./routes/productRoutes");
const paymentRoutes = require('./routes/paymentRoutes');
const Product = require("./models/productData");

const app = express();

const MONGO_URL = process.env.MONGO_URL;
const PORT = process.env.PORT || 3040;

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'], credentials: true }));
app.use(compression());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

mongoose
  .connect(MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// API Routes
app.use('/api/payment', paymentRoutes);
app.use("/api/products", productRoutes);

// ---------------------------
// Serve static assets in production
// ---------------------------
app.use(express.static(path.join(__dirname, "build")));

// Catch-all route: for any request that doesn't match the above, send back index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
