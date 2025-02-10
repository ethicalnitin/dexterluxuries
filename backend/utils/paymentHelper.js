const razorpayInstance = require('../config/razorpay');

async function createOrderWithRetry(options, retries = 3) {
    try {
        return await razorpayInstance.orders.create(options);
    } catch (error) {
        if (retries > 0) {
            return createOrderWithRetry(options, retries - 1);
        } else {
            throw error;
        }
    }
}

module.exports = { createOrderWithRetry };
