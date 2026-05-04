const express = require("express");
const Product = require("../models/productData");
const router = express.Router();

// ✅ Shared Cache
let cache = {
  allProducts: null,
  time: null,
};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const isCacheValid = () =>
  cache.allProducts && cache.time && Date.now() - cache.time < CACHE_DURATION;

// ✅ Add Product
router.post("/add", async (req, res) => {
  try {
    const product = req.body;

    if (!product || typeof product !== "object") {
      return res.status(400).json({ error: "Invalid data format, expected a product object." });
    }

    const newProduct = new Product(product);
    await newProduct.save();

    // ✅ Clear cache when new product is added
    cache.allProducts = null;
    cache.time = null;

    res.status(201).json({ message: "Product added successfully!", product: newProduct });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Get All Products — WITH CACHE
router.get("/", async (req, res) => {
  try {
    // Return cached data if still valid
    if (isCacheValid()) {
      console.log(`[${new Date().toLocaleTimeString()}] Serving products from cache`);
      return res.json(cache.allProducts);
    }

    // Fetch fresh from DB
    console.log(`[${new Date().toLocaleTimeString()}] Fetching products from DB...`);
    const products = await Product.find().lean(); // .lean() = 2x faster

    // Save to cache
    cache.allProducts = products;
    cache.time = Date.now();

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// ✅ Get Product by ID — with cache check first
router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid ID format. Expected a number." });
  }

  try {
    // ✅ Check cache first before hitting DB
    if (isCacheValid()) {
      const cachedProduct = cache.allProducts.find(p => p.id === id);
      if (cachedProduct) {
        console.log(`[${new Date().toLocaleTimeString()}] Serving product ${id} from cache`);
        return res.json(cachedProduct);
      }
    }

    // Fallback to DB
    const product = await Product.findOne({ id }).lean();
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    res.json(product);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// ✅ Fixed testwake route — was returning 500 (error code!) before
router.get("/testwake", async (req, res) => {
  res.status(200).json({ message: "Jag raha hu!" });
});

module.exports = router;