const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        id: Number,
        name: String,
        price: Number,
        strikeThroughPrice: Number,
        image: String,
        description: String,
        
    }
);

const Product = mongoose.model('Product',productSchema);

module.exports= Product;