const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const cors = require('cors');
const compression = require('compression');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3037;

// Configure Razorpay instance
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID, // Razorpay Key ID
    key_secret: process.env.RAZORPAY_KEY_SECRET, // Razorpay Key Secret
});

// Middleware configuration
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'], credentials: true }));
app.use(compression()); // Enable Gzip compression
app.use(express.json()); // Built-in middleware for parsing JSON requests

// Helper function: Create Razorpay order with retries
async function createOrderWithRetry(options, retries = 3) {
    try {
        return await razorpayInstance.orders.create(options);
    } catch (error) {
        if (retries > 0) {
            console.log(`Retrying order creation, attempts left: ${retries}`);
            return createOrderWithRetry(options, retries - 1);
        } else {
            throw error;
        }
    }
}

// Route: Create a Razorpay order
app.post('/create-order', async (req, res) => {
    const { amount, currency = 'INR', receipt } = req.body; // Default currency to INR
    console.log('Order creation initiated.');

    try {
        const options = {
            amount: amount * 100, // Convert amount to smallest currency unit (paise for INR)
            currency,
            receipt: receipt || `receipt_${Date.now()}`,
        };

        // Use helper function to create order with retry logic
        const order = await createOrderWithRetry(options);
        res.status(200).json({ success: true, order });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ success: false, message: 'Failed to create order', error: error.message });
    }
});

// Route: Verify Razorpay payment
app.post('/verify-payment', (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    try {
        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
        hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
        const generatedSignature = hmac.digest('hex');

        if (generatedSignature === razorpay_signature) {
            res.status(200).json({ success: true, message: 'Payment verified successfully' });
        } else {
            res.status(400).json({ success: false, message: 'Payment verification failed' });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ success: false, message: 'Payment verification failed', error: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
