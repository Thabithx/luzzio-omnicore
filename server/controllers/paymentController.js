const Order = require('../models/Order');
const User = require('../models/User');

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
