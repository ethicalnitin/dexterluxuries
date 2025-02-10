const express = require("express");
const Product = require("../models/productData");
const router = express.Router();

// Add a new product
router.post("/add", async (req, res) => {
    try {
        const product = req.body; // Single product object
        
        if (!product || typeof product !== "object") {
            return res.status(400).json({ error: "Invalid data format, expected a product object." });
        }

        const newProduct = new Product(product);
        await newProduct.save();

        res.status(201).json({ message: "Product added successfully!", product: newProduct });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Get all products
router.get("/", async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch products" });
    }
});

// Get a single product by ID
router.get("/:id", async (req, res) => {
    try {
        const id = req.params.id; // Correct way to access id
        console.log("Requested Product ID:", id);

        // Use findOne if ID is not a MongoDB ObjectId
        const product = await Product.findOne({ id: id });

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.json(product);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = router;
