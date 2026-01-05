const Order = require('../models/Order');
const User = require('../models/User');
const Cart = require('../models/Cart');
const { createNotification } = require('./notificationController');
const sendEmail = require('../utils/sendEmail');
const { orderConfirmationTemplate, trackingUpdateTemplate } = require('../utils/emailTemplates');
const crypto = require('crypto');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
   const start = Date.now();
   console.log(`[ORDER PROTOCOL START] User: ${req.user ? req.user.id : 'Guest'}`);

   try {
      const {
         orderItems,
         shippingAddress,
         paymentMethod,
         itemsPrice,
         shippingPrice,
         totalPrice,
         email
      } = req.body;

      if (orderItems && orderItems.length === 0) {
         return res.status(400).json({ success: false, message: 'No order items' });
      }

      // 1. Efficient Email & Name selection (No redundant DB trips)
      const orderEmail = req.user ? req.user.email : email;
      const recipientName = req.user ? req.user.name : `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}`.trim();

      const order = new Order({
         orderItems,
         user: req.user ? req.user.id : null,
         shippingAddress,
         paymentMethod,
         itemsPrice,
         shippingPrice,
         totalPrice,
         email: orderEmail
      });

      console.time('DB_OPERATIONS');
      // 2. Parallelize DB Save and Cart Clear for maximum throughput
      const saveTasks = [order.save()];
      if (req.user) {
         saveTasks.push(Cart.findOneAndUpdate({ user: req.user.id }, { items: [] }));
      }

      const [createdOrder] = await Promise.all(saveTasks);
      console.timeEnd('DB_OPERATIONS');

      // 3. Prepare PayHere parameters if needed (Calculated locally, near-instant)
      let payhereParams = null;
      if (paymentMethod === 'PayHere') {
         const merchantId = (process.env.PAYHERE_MERCHANT_ID || '').trim();
         const merchantSecret = (process.env.PAYHERE_SECRET || '').trim();
         const amount = createdOrder.totalPrice.toFixed(2);
         const currency = 'LKR';

         const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
         const hashSource = merchantId + createdOrder._id + amount + currency + hashedSecret;
         const hash = crypto.createHash('md5').update(hashSource).digest('hex').toUpperCase();

         const isSandbox = process.env.PAYHERE_MODE === 'sandbox' || (process.env.NODE_ENV !== 'production' && process.env.PAYHERE_MODE !== 'live');

         payhereParams = {
            sandbox: isSandbox,
            merchant_id: merchantId,
            return_url: `${process.env.CLIENT_URL}/payment-success`,
            cancel_url: `${process.env.CLIENT_URL}/cart`,
            notify_url: `${process.env.SERVER_URL || 'https://luzzio-production.up.railway.app'}/api/payments/payhere/notify`,
            order_id: createdOrder._id,
            items: `Order ${createdOrder._id}`,
            amount: amount,
            currency: currency,
            hash: hash,
            first_name: shippingAddress.firstName,
            last_name: shippingAddress.lastName,
            email: createdOrder.email,
            phone: '0771234567',
            address: shippingAddress.address,
            city: shippingAddress.city,
            country: 'Sri Lanka',
         };
      }

      // 4. IMMEDIATE RESPONSE DISPATCH (Background everything else)
      res.status(201).json({
         success: true,
         data: createdOrder,
         payhereParams
      });

      console.log(`[ORDER PROTOCOL DISPATCHED] Time to respond: ${Date.now() - start}ms`);

      // 5. ASYNC BACKGROUND TASKS (Not blocking the user)
      setImmediate(() => {
         if (orderEmail) {
            sendEmail({
               email: orderEmail,
               subject: `LUZZIO ARCHIVE DISPATCH: ORDER #${createdOrder._id.toString().slice(-6).toUpperCase()}`,
               html: orderConfirmationTemplate(createdOrder, { name: recipientName || 'Valued Client' })
            }).catch(emailErr => console.error('Background Email Protocol Deferred:', emailErr.message));
         }
      });

   } catch (err) {
      console.error(`[ORDER PROTOCOL FAILURE] Time elapsed: ${Date.now() - start}ms - Error: ${err.message}`);
      res.status(400).json({ success: false, message: err.message });
   }
};

// @desc    Update order item tracking number
// @route   PUT /api/orders/:id/item/:itemId/tracking
// @access  Private/Admin
exports.updateItemTracking = async (req, res) => {
   try {
      const { trackingNumber } = req.body;
      const order = await Order.findById(req.params.id);

      if (!order) {
         return res.status(404).json({ success: false, message: 'Order not found' });
      }

      const item = order.orderItems.id(req.params.itemId);
      if (!item) {
         return res.status(404).json({ success: false, message: 'Item not found in order' });
      }

      item.trackingNumber = trackingNumber;
      await order.save();

      // Notify User
      if (order.user) {
         try {
            await createNotification(
               order.user,
               'order_status',
               'SHIPMENT UPDATED',
               `A tracking number (${trackingNumber}) has been registered for your item: ${item.name}.`,
               order._id,
               'Order'
            );
         } catch (notifErr) {
            console.error('Notification failed:', notifErr.message);
         }
      }

      // Dispatch Email Update Protocol
      try {
         const user = order.user ? await User.findById(order.user) : null;
         const recipientEmail = order.email || (user ? user.email : null);
         const recipientName = user ? user.name : `${order.shippingAddress.firstName || ''} ${order.shippingAddress.lastName || ''}`.trim();

         if (recipientEmail) {
            await sendEmail({
               email: recipientEmail,
               subject: `LUZZIO LOGISTICS: TRACKING REGISTERED FOR ${item.name.toUpperCase()}`,
               html: trackingUpdateTemplate(order, item, trackingNumber, { name: recipientName || 'Valued Client' })
            });
         }
      } catch (emailErr) {
         console.error('Logistics Email Protocol Deferred:', emailErr.message);
      }

      res.status(200).json({
         success: true,
         data: order
      });
   } catch (err) {
      res.status(500).json({ success: false, message: err.message });
   }
};

// @desc    Get orders by email (Guest access)
// @route   GET /api/orders/guest/:email
// @access  Public
exports.getGuestOrders = async (req, res) => {
   try {
      const orders = await Order.find({ email: req.params.email, user: null }).sort('-createdAt');
      res.status(200).json({
         success: true,
         data: orders
      });
   } catch (err) {
      res.status(500).json({ success: false, message: err.message });
   }
};

// @desc    Get my orders
// @route   GET /api/orders/myorders
// @access  Private
exports.getMyOrders = async (req, res) => {
   try {
      const orders = await Order.find({ user: req.user.id }).sort('-createdAt');
      res.status(200).json({
         success: true,
         data: orders
      });
   } catch (err) {
      res.status(500).json({ success: false, message: err.message });
   }
};

// Helper: Link guest orders to user
exports.linkGuestOrders = async (email, userId) => {
   try {
      await Order.updateMany(
         { email: email, user: null },
         { user: userId }
      );
   } catch (err) {
      console.error('Error linking guest orders:', err);
   }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
exports.getOrders = async (req, res) => {
   try {
      const orders = await Order.find({}).populate('user', 'id name').sort('-createdAt');
      res.status(200).json({
         success: true,
         data: orders
      });
   } catch (err) {
      res.status(500).json({ success: false, message: err.message });
   }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
   try {
      const order = await Order.findById(req.params.id);

      if (order) {
         order.status = req.body.status || order.status;

         if (req.body.status === 'delivered') {
            order.isDelivered = true;
            order.deliveredAt = Date.now();
         }

         if (req.body.status === 'completed') {
            order.isDelivered = true;
            if (!order.deliveredAt) order.deliveredAt = Date.now();
         }

         if (req.body.status === 'paid') {
            order.isPaid = true;
            order.paidAt = Date.now();
         }

         const updatedOrder = await order.save();

         // Create notification for user
         const { createNotification } = require('./notificationController');
         const statusMessages = {
            'processing': 'Your order is being processed',
            'shipped': 'Your order has been shipped',
            'delivered': 'Your order has been delivered',
            'completed': 'Your order is complete',
            'cancelled': 'Your order has been cancelled'
         };

         if (order.user) {
            await createNotification(
               order.user,
               'order_status',
               'Order Status Update',
               statusMessages[req.body.status] || `Your order status has been updated to ${req.body.status}`,
               order._id,
               'Order'
            );
         }

         res.status(200).json({
            success: true,
            data: updatedOrder
         });
      } else {
         res.status(404).json({ success: false, message: 'Order not found' });
      }
   } catch (err) {
      res.status(500).json({ success: false, message: err.message });
   }
};
