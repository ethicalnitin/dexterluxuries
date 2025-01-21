const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const app = express();
const PORT = process.env.PORT || 3037;
const Razorpay = require('razorpay');

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID, // Access the environment variable
    key_secret: process.env.RAZORPAY_KEY_SECRET, // Add this if you also have a secret
  });

app.post('/create-order', async (req, res) => {
    const { amount, currency, receipt } = req.body;

    try {
        const options = {
            amount: amount * 100, // Amount in smallest currency unit (e.g., 100 = 1 INR)
            currency: currency || 'INR',
            receipt: receipt || `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);
        res.status(200).json({ success: true, order });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ success: false, message: 'Failed to create order', error: error.message });
    }
});


app.post('/verify-payment', (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    try {
        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
        hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
        const generatedSignature = hmac.digest('hex');

        if (generatedSignature === razorpay_signature) {
            // Payment verified successfully
            res.status(200).json({ success: true, message: 'Payment verified' });
        } else {
            res.status(400).json({ success: false, message: 'Payment verification failed' });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ success: false, message: 'Payment verification failed', error: error.message });
    }
});





app.use(cors({
  origin: '*',  // Allow all origins
  methods: ['GET', 'POST', 'OPTIONS'],  // Allow specific HTTP methods
  credentials: true  // Enable credentials (cookies, authorization headers, etc.)
}));

// Handle CORS preflight requests
app.options('*', cors());

app.use(bodyParser.json());




const upload = multer({ storage: storage });

const ACCESS_TOKEN = 'EAB2dUthO3SoBOxMFQAZAq9TUameZCnKMyK2Ey9jwGpg98VU7CrcUaVNHOBsWJjpTbSwjShuRG7af9eGESHmBF1HXwkZAHfxTnnM6VBPgD405v3ZBNdyZAJ6YJyBlJneL1LjA4ZAzuRf9rMwZAeyhO0g6stpq4BJ8X4g1pxWMTN70ogWPKNSCtW9c5mEA7pAh3N1OwZDZD';

const FB_API_URL = `https://graph.facebook.com/v14.0/1244760100199023/events?access_token=${ACCESS_TOKEN}`;


// Helper function to validate IP address format
function isValidIpAddress(ip) {
    const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
}

// Facebook Pixel Event (CAPI) Tracking Endpoint
app.post('/track-event', async (req, res) => {
    const { event_name, event_time, event_id, custom_data, user_data, event_source_url, action_source } = req.body;

    try {
        // Ensure event_time is a valid Unix timestamp
        const eventTimestamp = event_time && event_time > Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60
            ? event_time
            : Math.floor(Date.now() / 1000);

        // Hash user data
        const hashedEmail = user_data.email ? crypto.createHash('sha256').update(user_data.email).digest('hex') : undefined;
        const hashedPhone = user_data.phone_number ? crypto.createHash('sha256').update(user_data.phone_number).digest('hex') : undefined;
        const hashedZip = user_data.zip ? crypto.createHash('sha256').update(user_data.zip).digest('hex') : undefined;

        // Get client IP address
        let clientIpAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '8.8.8.8';
        if (!isValidIpAddress(clientIpAddress)) {
            clientIpAddress = '8.8.8.8'; // Default valid IP
        }

        // Get client user agent
        const clientUserAgent = req.headers['user-agent'];

        // Construct the payload for Facebook CAPI
       const payload = {
    data: [{
        event_name,
        event_time: eventTimestamp,
        event_id,
        event_source_url,
        action_source,
        user_data: {
            em: hashedEmail,
            ph: hashedPhone,
            zp: hashedZip,
            client_ip_address: clientIpAddress,
            client_user_agent: clientUserAgent
        },
        custom_data: custom_data || {},
       
    }],
};

        // Send the request to Facebook's API
        const response = await axios.post(FB_API_URL, payload, { timeout: 8000 });
        res.status(200).json({ success: true, message: 'Event tracked successfully', data: response.data });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error tracking event', error: error.message });
    }
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
