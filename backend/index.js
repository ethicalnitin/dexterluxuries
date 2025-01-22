const express = require('express');
const Razorpay = require('razorpay');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3037;

// Configure Razorpay instance
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID, // Razorpay Key ID
    key_secret: process.env.RAZORPAY_KEY_SECRET, // Razorpay Key Secret
});

console.log('Key ID:', process.env.RAZORPAY_KEY_ID);
console.log('Key Secret:', process.env.RAZORPAY_KEY_SECRET);



// Middleware configuration
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'], credentials: true }));
app.use(bodyParser.json());

// Create a Razorpay order
app.post('/create-order', async (req, res) => {
    const { amount, currency, receipt } = req.body;
    console.log("Working");

    try {
        const options = {
            amount: amount * 100, // Amount in smallest currency unit (e.g., paise for INR)
            currency: currency || 'INR',
            receipt: receipt || `receipt_${Date.now()}`,
        };

        const order = await razorpayInstance.orders.create(options);
        res.status(200).json({ success: true, order });
        
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ success: false, message: 'Failed to create order', error: error.message });
    }
});

// Verify Razorpay payment
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
