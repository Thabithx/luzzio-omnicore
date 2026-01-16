const Order = require('../models/Order');
const User = require('../models/User');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { createNotification } = require('./notificationController');
const sendEmail = require('../utils/sendEmail');
const { orderConfirmationTemplate, trackingUpdateTemplate, adminOrderNotificationTemplate } = require('../utils/emailTemplates');
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
      const orderEmail = (req.user ? req.user.email : (email || '')).trim().toLowerCase();

      const firstName = shippingAddress?.firstName || '';
      const lastName = shippingAddress?.lastName || '';
      const recipientName = req.user ? req.user.name : `${firstName} ${lastName}`.trim();

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

      // 3. SECURE STOCK RESERVATION PROTOCOL (Internal)
      // Deduct stock for each item's specific variant
      setImmediate(async () => {
         try {
            for (const item of orderItems) {
               const product = await Product.findById(item.product);
               if (product && product.variants && product.variants.length > 0) {
                  const variantIndex = product.variants.findIndex(v => v.size === item.size);
                  if (variantIndex !== -1) {
                     // Deduct from variant
                     product.variants[variantIndex].stock = Math.max(0, product.variants[variantIndex].stock - (item.qty || 1));

                     // total stock is auto-recalculated by the pre-save hook in Product.js
                     await product.save();
                     console.log(`[STOCK SYNC] Deducted ${item.qty || 1} units from ${product.name} (Size: ${item.size})`);
                  }
               }
            }
         } catch (stockErr) {
            console.error('[STOCK SYNC FAILURE] Critical inventory mismatch:', stockErr.message);
         }
      });

      // 4. Prepare PayHere parameters if needed (Calculated locally, near-instant)
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
            phone: shippingAddress.phone || '0771234567',
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
         console.log(`[ORDER PROTOCOL] Background tasks initiated for Order: ${createdOrder._id}`);

         if (orderEmail) {
            console.log(`[ORDER PROTOCOL] Dispatching confirmation to client: ${orderEmail}`);
            sendEmail({
               email: orderEmail,
               subject: `Order Confirmation #${createdOrder._id.toString().slice(-6).toUpperCase()}`,
               html: orderConfirmationTemplate(createdOrder, { name: recipientName || 'Valued Customer' })
            })
               .then(() => console.log(`[ORDER PROTOCOL] Client confirmation delivered: ${orderEmail}`))
               .catch(emailErr => console.error('[ORDER PROTOCOL FAILURE] Client Email Deferred:', emailErr.message));
         } else {
            console.warn(`[ORDER PROTOCOL] No client email found for Order: ${createdOrder._id}`);
         }

         // Protocol: Admin Notification Dispatch
         const adminEmail = process.env.ADMIN_EMAIL || 'luzzioclothing.com@gmail.com';
         console.log(`[ORDER PROTOCOL] Dispatching notification to admin: ${adminEmail}`);
         sendEmail({
            email: adminEmail,
            subject: `New Order Received #${createdOrder._id.toString().slice(-6).toUpperCase()}`,
            html: adminOrderNotificationTemplate(createdOrder)
         })
            .then(() => console.log(`[ORDER PROTOCOL] Admin notification delivered: ${adminEmail}`))
            .catch(adminEmailErr => console.error('[ORDER PROTOCOL FAILURE] Admin Notification Deferred:', adminEmailErr.message));
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
      setImmediate(async () => {
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
      });

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
      const email = (req.params.email || '').trim().toLowerCase();
      const orders = await Order.find({ email: email, user: null }).sort('-createdAt');
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
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const total = await Order.countDocuments({ user: req.user.id });
      const orders = await Order.find({ user: req.user.id })
         .sort('-createdAt')
         .limit(limit)
         .skip(skip);

      const pages = Math.ceil(total / limit);

      res.status(200).json({
         success: true,
         count: total,
         pages: pages,
         page: page,
         data: orders
      });
   } catch (err) {
      res.status(500).json({ success: false, message: err.message });
   }
};

exports.linkGuestOrders = async (email, userId) => {
   try {
      if (!email) return 0;
      const normalizedEmail = email.trim().toLowerCase();
      const escapedEmail = normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      const result = await Order.updateMany(
         {
            email: { $regex: new RegExp(`^\\s*${escapedEmail}\\s*$`, 'i') },
            user: null
         },
         { user: userId }
      );

      if (result.modifiedCount > 0) {
         console.log(`[SYNC SUCCESS] Linked ${result.modifiedCount} orders for ${normalizedEmail}`);
      }
      return result.modifiedCount;
   } catch (err) {
      console.error('Error linking guest orders:', err);
      return 0;
   }
};

// @desc    Manually sync guest orders to current user
// @route   PUT /api/orders/sync
// @access  Private
exports.syncMyOrders = async (req, res) => {
   try {
      const { email } = req.body;
      let count = await exports.linkGuestOrders(req.user.email, req.user.id);

      // If a specific guest email was provided and it's different, sync that too
      if (email && email.toLowerCase() !== req.user.email.toLowerCase()) {
         count += await exports.linkGuestOrders(email, req.user.id);
      }

      res.status(200).json({
         success: true,
         message: `Synchronization complete. ${count} orders linked.`,
         count
      });
   } catch (err) {
      res.status(500).json({ success: false, message: err.message });
   }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
exports.getOrders = async (req, res) => {
   try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const count = await Order.countDocuments({});
      const orders = await Order.find({})
         .populate('user', 'id name')
         .sort('-createdAt')
         .skip(skip)
         .limit(limit);

      res.status(200).json({
         success: true,
         count,
         pages: Math.ceil(count / limit),
         page,
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

// @desc    Update status for multiple orders
// @route   PUT /api/orders/batch-status
// @access  Private/Admin
exports.batchUpdateOrderStatus = async (req, res) => {
   try {
      const { ids, status, weights } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
         return res.status(400).json({ success: false, message: 'No order IDs provided' });
      }

      const orders = await Order.find({ _id: { $in: ids } });
      const results = [];

      for (const order of orders) {
         const oldStatus = order.status;
         order.status = status;

         if (status === 'delivered') {
            order.isDelivered = true;
            order.deliveredAt = Date.now();
         }

         if (status === 'completed') {
            order.isDelivered = true;
            if (!order.deliveredAt) order.deliveredAt = Date.now();
         }

         if (status === 'paid') {
            order.isPaid = true;
            order.paidAt = Date.now();
         }

         // Fadar Integration Logic
         let fadarSuccess = false;
         let fadarMessage = '';

         if (oldStatus !== 'processing' && status === 'processing' && !order.fadar_order_id) {
            try {
               const weight = (weights && weights[order._id]) || 1;
               const { createFadarParcelInternal } = require('./fadarController');

               // We need an internal version or just refactor fadarController to be more reusable
               // For now, let's keep it simple and just update status if Fadar fails or skip complex logic in batch
               // Actually, it's better to support it.
               const fadarResult = await triggerFadarInternal(order, weight);
               if (fadarResult.success) {
                  order.fadar_order_id = fadarResult.fadar_order_id;
                  fadarSuccess = true;
               } else {
                  fadarMessage = fadarResult.message;
               }
            } catch (fadarErr) {
               fadarMessage = fadarErr.message;
            }
         }

         await order.save();

         // Create notification for user
         if (order.user) {
            const statusMessages = {
               'processing': 'Your order is being processed',
               'shipped': 'Your order has been shipped',
               'delivered': 'Your order has been delivered',
               'completed': 'Your order is complete',
               'cancelled': 'Your order has been cancelled'
            };

            await createNotification(
               order.user,
               'order_status',
               'Order Status Update',
               statusMessages[status] || `Your order status has been updated to ${status}`,
               order._id,
               'Order'
            ).catch(err => console.error(`Notification failed for order ${order._id}:`, err.message));
         }

         results.push({
            id: order._id,
            status: 'success',
            fadar: fadarSuccess ? 'created' : (fadarMessage || 'not_triggered')
         });
      }

      res.status(200).json({
         success: true,
         message: `Successfully updated ${results.length} orders`,
         results
      });

   } catch (err) {
      res.status(500).json({ success: false, message: err.message });
   }
};

// Helper to trigger Fadar without a req/res cycle
async function triggerFadarInternal(order, weight) {
   const axios = require('axios');
   const apiKey = process.env.FADAR_API_KEY;
   const clientId = process.env.FADAR_CLIENT_ID;

   if (!apiKey || !clientId) {
      return { success: false, message: 'Fadar API configuration missing' };
   }

   const params = new URLSearchParams();
   params.append('api_key', apiKey);
   params.append('client_id', clientId);
   params.append('order_id', order._id.toString());
   params.append('parcel_weight', weight && weight > 0 ? weight.toString() : '1');
   params.append('parcel_description', `Order #${order._id.toString().slice(-6).toUpperCase()}`);
   params.append('recipient_name', `${order.shippingAddress.firstName || ''} ${order.shippingAddress.lastName || ''}`.trim());
   params.append('recipient_contact_1', order.shippingAddress.phone || '');
   params.append('recipient_contact_2', order.shippingAddress.phone2 || '');
   params.append('recipient_address', order.shippingAddress.address || '');
   params.append('recipient_city', order.shippingAddress.city || '');
   params.append('amount', order.totalPrice.toString());
   params.append('exchange', 'no');

   try {
      console.log(`[FADAR BATCH] Initiating request for Order: ${order._id}`);
      const response = await axios.post('https://www.fdedomestic.com/api/parcel/new_api_v1.php', params, {
         headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      console.log(`[FADAR BATCH] API RESPONSE:`, response.data);

      if (response.data) {
         const fadarId = response.data.fadar_order_id || response.data.order_id || response.data.id;
         if (fadarId) {
            return { success: true, fadar_order_id: fadarId };
         }
         return {
            success: false,
            message: response.data.message || 'API accepted request but returned no sequence ID. Check Fadar credentials.'
         };
      }
      return { success: false, message: 'Empty payload received from Courier API.' };
   } catch (err) {
      console.error(`[FADAR BATCH ERROR] Order ${order._id}:`, err.response?.data || err.message);
      return { success: false, message: err.message };
   }
}
