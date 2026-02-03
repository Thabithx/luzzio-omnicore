const express = require('express');
const router = express.Router();
const {
   createCheckoutSession,
   stripeWebhook,
   initiatePayHerePayment,
   payHereNotify,
   kokoNotify
} = require('../controllers/paymentController');

// Stripe
router.post('/create-checkout-session', createCheckoutSession);
router.post('/webhook', stripeWebhook);

// PayHere
router.post('/payhere/initiate', initiatePayHerePayment);
router.post('/payhere/notify', payHereNotify); // Webhook, public

// Koko Pay
router.post('/koko/notify', kokoNotify); // Webhook, public

module.exports = router;
