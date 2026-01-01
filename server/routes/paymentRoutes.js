const express = require('express');
const router = express.Router();
const {
   createCheckoutSession,
   stripeWebhook,
   initiatePayHerePayment,
   payHereNotify
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// Stripe
router.post('/create-checkout-session', protect, createCheckoutSession);
router.post('/webhook', stripeWebhook);

// PayHere
router.post('/payhere/initiate', protect, initiatePayHerePayment);
router.post('/payhere/notify', payHereNotify); // Webhook, public

module.exports = router;
