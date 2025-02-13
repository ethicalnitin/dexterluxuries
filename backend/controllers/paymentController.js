const crypto = require('crypto');
const razorpayInstance = require('../config/razorpay');
const Product = require('../models/productData');
const transporter = require('../config/nodemailer');
const { createOrderWithRetry } = require('../utils/paymentHelper');
const mongoose= require('mongoose');

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

const verifyPayment = async (req, res) => {
    console.log('🔹 Received Payment Verification Request');
    console.log('📩 Request Body:', req.body);

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userEmail, productId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !productId) {
        return res.status(400).json({ success: false, message: 'Missing payment details' });
    }

    try {
        console.log('🔐 Verifying Razorpay Signature...');
        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
        hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
        const generatedSignature = hmac.digest('hex');

        if (generatedSignature !== razorpay_signature) {
            console.error('❌ Signature Mismatch!');
            return res.status(400).json({ success: false, message: 'Payment verification failed' });
        }

        console.log(`🔍 Searching for Product ID: ${productId}`);
        const product = await Product.findOne({ id : productId } );

        if (!product || !product.downloadLink) {
            console.error('❌ Product not found or file missing');
            return res.status(404).json({ success: false, message: 'Product not found or file unavailable' });
        }

        console.log(`✅ Product Found: ${product.name}`);
        console.log(typeof transporter.sendMail);  // Should print: 'function'


        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: `🛒 Your Purchase: ${product.name} from CyberMafia.shop`,
            text: `Thank you for purchasing ${product.name} from CyberMafia.shop. You can download your file here: ${product.downloadLink}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
                    <h2 style="text-align: center; color: #333;">🎉 Thank You for Your Purchase! 🎉</h2>
                    <p style="font-size: 16px; color: #555;">Hello,</p>
                    <p style="font-size: 16px; color: #555;">Thank you for purchasing <strong>${product.name}</strong> from <strong>CyberMafia.shop</strong>.</p>
                    <h3 style="color: #333;">📜 Order Summary</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr><td style="border: 1px solid #ddd; padding: 8px;"><strong>🛍 Product</strong></td>
                            <td style="border: 1px solid #ddd; padding: 8px;">${product.name}</td></tr>
                        <tr><td style="border: 1px solid #ddd; padding: 8px;"><strong>💰 Price</strong></td>
                            <td style="border: 1px solid #ddd; padding: 8px;">₹${product.price}</td></tr>
                    </table>
                    <h3 style="color: #333;">📂 Download Your File</h3>
                    <p style="font-size: 16px; color: #555;">Click the link below to download your file:</p>
                    <p style="text-align: center;">
                        <a href="${product.downloadLink}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">📥 Download Now</a>
                    </p>
                    <p style="font-size: 16px; color: #555;">If you have any questions, feel free to contact us at <a href="mailto:leader@cybermafia.shop">leader@cybermafia.shop</a>.</p>
                    <p style="font-size: 16px; text-align: center; color: #333;"><strong>💳 Thank you for shopping with CyberMafia.shop! 🛍</strong></p>
                </div>
            `,
        };
        

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error('❌ Email sending failed:', err);
                return res.status(500).json({ success: false, message: 'Failed to send email' });
            }
            console.log(`📧 Email sent successfully: ${info.response}`);
            res.status(200).json({ success: true, message: 'Payment verified, email sent' });
        });
        console.log(`📧 Email sent to ${userEmail}`);

        res.status(200).json({ success: true, message: 'Payment verified, email sent with product file' });
    } catch (error) {
        console.error('🔥 Error in payment verification:', error);
        res.status(500).json({ success: false, message: 'Payment verification failed', error: error.message });
    }
};


module.exports = { createOrder, verifyPayment };
