const express = require("express");
const mongoose = require("mongoose");
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
    const id = parseInt(req.params.id, 10); // Convert ID to a number

    if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format. Expected a number." });
    }

    console.log("Received ID:", id);

    try {
        const product = await Product.findOne({ id }); // Use `findOne` instead of `findById`
        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }
        res.json(product);
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
});

router.post("/health", async (req,res)=>{
    
    console.log("Jag raha hu!");
    res.status(200).json({message : "Jag raha hu!"});
   
})

module.exports = router;
