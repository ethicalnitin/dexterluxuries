const mongoose = require('mongoose');

// Sub-schema for a single pricing plan
const planSchema = new mongoose.Schema(
    {
        name: {
            type: String,       // e.g. "3 Months", "6 Months", "Lifetime"
            required: true,
        },
        durationInMonths: {
            type: Number,       // use null or 0 for "lifetime"
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
    { _id: false } // set to true if you want each plan to have its own _id
);

const productSchema = new mongoose.Schema(
    {
        id: Number,
        category: String,
        name: String,
        brand: {
            type: String,        // simplest option — just store brand name
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