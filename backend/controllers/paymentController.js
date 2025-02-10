const crypto = require('crypto');
const razorpayInstance = require('../config/razorpay');
const { createOrderWithRetry } = require('../utils/paymentHelper');

const createOrder = async (req, res) => {
    const { amount, currency = 'INR', receipt } = req.body;

    try {
        const options = {
            amount: amount * 100,
            currency,
            receipt: receipt || `receipt_${Date.now()}`,
        };

        const order = await createOrderWithRetry(options);
        res.status(200).json({ success: true, order });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create order', error: error.message });
    }
};

const verifyPayment = (req, res) => {
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
        res.status(500).json({ success: false, message: 'Payment verification failed', error: error.message });
    }
};

module.exports = { createOrder, verifyPayment };
