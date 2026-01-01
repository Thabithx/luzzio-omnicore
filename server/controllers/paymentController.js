const Order = require('../models/Order');
const User = require('../models/User');
const crypto = require('crypto');

// Initialize Stripe lazily to prevent server crashes if keys are missing
const getStripe = () => {
   if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('YOUR_STRIPE')) {
      return null;
   }
   return require('stripe')(process.env.STRIPE_SECRET_KEY);
};

/**
 * Stripe Payment Protocol Controller
 * Handles secure session creation and verified webhook signals.
 */

// @desc    Create Stripe Checkout Session
// @route   POST /api/payments/create-checkout-session
// @access  Private
exports.createCheckoutSession = async (req, res) => {
   try {
      const stripe = getStripe();
      if (!stripe) {
         return res.status(500).json({
            success: false,
            message: 'Stripe Protocol not configured. Please add valid STRIPE_SECRET_KEY to .env'
         });
      }

      const { orderId } = req.body;
      const order = await Order.findById(orderId).populate('user', 'email name');

      if (!order) {
         return res.status(404).json({ success: false, message: 'Order protocol not found' });
      }

      const lineItems = order.orderItems.map((item) => ({
         price_data: {
            currency: 'usd',
            product_data: {
               name: item.name,
               images: [item.image],
               metadata: {
                  size: item.size
               }
            },
            unit_amount: Math.round(item.price * 100), // Stripe uses cents
         },
         quantity: item.qty,
      }));

      const session = await stripe.checkout.sessions.create({
         payment_method_types: ['card'],
         line_items: lineItems,
         mode: 'payment',
         success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
         cancel_url: `${process.env.CLIENT_URL}/cart`,
         customer_email: order.user.email,
         client_reference_id: orderId.toString(),
         metadata: {
            orderId: orderId.toString()
         }
      });

      order.stripeSessionId = session.id;
      await order.save();

      res.status(200).json({
         success: true,
         url: session.url
      });
   } catch (err) {
      console.error('Stripe Session Error:', err);
      res.status(500).json({ success: false, message: err.message });
   }
};

// @desc    Stripe Webhook Handler
// @route   POST /api/payments/webhook
// @access  Public (Stripe Signature Verified)
exports.stripeWebhook = async (req, res) => {
   const stripe = getStripe();
   if (!stripe) return res.status(500).send('Stripe Protocol not configured.');

   const sig = req.headers['stripe-signature'];
   let event;

   try {
      // We need the raw body for signature verification
      event = stripe.webhooks.constructEvent(
         req.body,
         sig,
         process.env.STRIPE_WEBHOOK_SECRET
      );
   } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
   }

   // Handle the event
   if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      try {
         const orderId = session.metadata.orderId;
         const order = await Order.findById(orderId);

         if (order) {
            order.isPaid = true;
            order.paidAt = Date.now();
            order.status = 'paid';
            order.paymentResult = {
               id: session.payment_intent,
               status: 'succeeded',
               email_address: session.customer_details.email
            };

            await order.save();
            console.log(`Order ${orderId} verified and paid via Stripe Protocol.`);
         }
      } catch (err) {
         console.error('Order update failure during webhook:', err);
      }
   }

   res.json({ received: true });
};

/**
 * PayHere Payment Protocol Controller
 */

// @desc    Initiate PayHere Payment
// @route   POST /api/payments/payhere/initiate
// @access  Private
exports.initiatePayHerePayment = async (req, res) => {
   try {
      const { orderId } = req.body;
      const order = await Order.findById(orderId).populate('user', 'email name');

      if (!order) {
         return res.status(404).json({ success: false, message: 'Order protocol not found' });
      }

      const merchantId = process.env.PAYHERE_MERCHANT_ID;
      const merchantSecret = process.env.PAYHERE_SECRET;
      const amount = order.totalPrice.toFixed(2); // Ensure 2 decimal places
      const currency = 'LKR';

      // Generate Hash
      // Hash = md5(merchant_id + order_id + amount + currency + md5(merchant_secret).toUpperCase()).toUpperCase()
      const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
      const amountFormatted = amount; // PayHere expects amount like "1000.00"
      const hashSource = merchantId + orderId + amountFormatted + currency + hashedSecret;
      const hash = crypto.createHash('md5').update(hashSource).digest('hex').toUpperCase();

      const payHereParams = {
         sandbox: true, // TODO: Toggle based on NODE_ENV
         merchant_id: merchantId,
         return_url: `${process.env.CLIENT_URL}/payment-success`,
         cancel_url: `${process.env.CLIENT_URL}/cart`,
         notify_url: `${process.env.SERVER_URL || 'http://localhost:5001'}/api/payments/payhere/notify`,
         order_id: orderId,
         items: `Order ${orderId}`,
         amount: amount,
         currency: currency,
         hash: hash,
         first_name: order.shippingAddress.firstName,
         last_name: order.shippingAddress.lastName,
         email: order.user.email,
         phone: '0771234567', // Optional, can collect from user if needed
         address: order.shippingAddress.address,
         city: order.shippingAddress.city,
         country: 'Sri Lanka',
      };

      res.status(200).json({
         success: true,
         params: payHereParams
      });

   } catch (err) {
      console.error('PayHere Initiation Error:', err);
      res.status(500).json({ success: false, message: err.message });
   }
};

// @desc    PayHere Webhook Handler (Notify URL)
// @route   POST /api/payments/payhere/notify
// @access  Public (Signature Verified)
exports.payHereNotify = async (req, res) => {
   try {
      console.log('PayHere Notification Received:', req.body);

      const {
         merchant_id,
         order_id,
         payment_id,
         payhere_amount,
         payhere_currency,
         status_code,
         md5sig
      } = req.body;

      const merchantSecret = process.env.PAYHERE_SECRET;
      const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();

      // Verify Signature
      // md5sig = md5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + md5(merchant_secret).toUpperCase()).toUpperCase()
      const signatureSource = merchant_id + order_id + payhere_amount + payhere_currency + status_code + hashedSecret;
      const localMd5sig = crypto.createHash('md5').update(signatureSource).digest('hex').toUpperCase();

      if (localMd5sig !== md5sig) {
         console.warn('PayHere Signature Mismatch');
         return res.status(400).send('Invalid Signature');
      }

      // Status Code 2 means success
      if (status_code == 2) {
         const order = await Order.findById(order_id);
         if (order && !order.isPaid) {
            order.isPaid = true;
            order.paidAt = Date.now();
            order.status = 'paid';
            order.paymentResult = {
               id: payment_id,
               status: 'succeeded',
               email_address: 'payhere_customer', // PayHere doesn't send email in notify, optional
               provider: 'PayHere'
            };
            await order.save();
            console.log(`Order ${order_id} verified and paid via PayHere Protocol.`);
         }
      }

      res.status(200).send('OK');

   } catch (err) {
      console.error('PayHere Notify Error:', err);
      res.status(500).send('Internal Server Error');
   }
};
