const express = require("express");
const Product = require("../models/productData");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { logger } = require("../utils/logger");
const router = express.Router();

const PUBLIC_PROJECTION = "-downloadLink";

const PRODUCT_FIELDS = ["id", "category", "name", "brand", "image", "downloadLink", "description", "plans"];

const cache = {
  allProducts: null,
  time: null,
};
const CACHE_DURATION = 5 * 60 * 1000;

const isCacheValid = () =>
  cache.allProducts && cache.time && Date.now() - cache.time < CACHE_DURATION;

const clearCache = () => {
  cache.allProducts = null;
  cache.time = null;
};

router.post("/add", requireAuth, requireAdmin, async (req, res) => {
  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({ error: "Invalid data format, expected a product object." });
  }

  const product = {};
  for (const field of PRODUCT_FIELDS) {
    if (body[field] !== undefined) product[field] = body[field];
  }

  if (!Number.isInteger(product.id) || product.id <= 0) {
    return res.status(400).json({ error: "id must be a positive whole number." });
  }
  if (typeof product.name !== "string" || !product.name.trim()) {
    return res.status(400).json({ error: "name is required." });
  }

  try {
    if (await Product.exists({ id: product.id })) {
      return res.status(409).json({ error: `A product with id ${product.id} already exists.` });
    }

    const newProduct = new Product(product);
    await newProduct.save();

    clearCache();

    res.status(201).json({ message: "Product added successfully!", product: newProduct });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ error: error.message });
    }
    logger.error("Adding product failed", { requestId: req.id, err: error });
    res.status(500).json({ error: "Failed to add product." });
  }
});

router.get("/", async (req, res) => {
  try {
    if (isCacheValid()) {
      return res.json(cache.allProducts);
    }

    const products = await Product.find().select(PUBLIC_PROJECTION).lean();

    cache.allProducts = products;
    cache.time = Date.now();

    res.json(products);
  } catch (error) {
    logger.error("Listing products failed", { requestId: req.id, err: error });
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

router.get("/testwake", async (req, res) => {
  res.status(200).json({ message: "Jag raha hu!" });
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid ID format. Expected a number." });
  }

  try {
    if (isCacheValid()) {
      const cachedProduct = cache.allProducts.find(p => p.id === id);
      if (cachedProduct) {
        return res.json(cachedProduct);
      }
    }

    const product = await Product.findOne({ id }).select(PUBLIC_PROJECTION).lean();
    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    res.json(product);
  } catch (error) {
    logger.error("Fetching product failed", { requestId: req.id, productId: id, err: error });
    res.status(500).json({ error: "Failed to fetch product." });
  }
});

module.exports = router;
