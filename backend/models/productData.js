const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        durationInMonths: {
            type: Number,
        },
        price: {
            type: Number,
            required: true,
        },
        strikeThroughPrice: {
            type: Number,
        },
        available : {
            type: Boolean,
            default: true,
        },
    },
    { _id: false }
);

const productSchema = new mongoose.Schema(
    {
        id: { type: Number, index: true },
        category: String,
        name: String,
        brand: {
            type: String,
            required: true,
        },
        image: String,
        downloadLink: String,
        description: String,
        plans: {
            type: [planSchema],
            validate: {
                validator: (arr) => arr.length > 0,
                message: 'A product must have at least one plan.',
            },
        },
    },
    { timestamps: true }
);

const Product = mongoose.model('Product', productSchema);

module.exports = Product;