const Order = require('../models/Order');
const User = require('../models/User');
const Cart = require('../models/Cart');
const { createNotification } = require('./notificationController');
const sendEmail = require('../utils/sendEmail');
const { orderConfirmationTemplate, trackingUpdateTemplate } = require('../utils/emailTemplates');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
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

      let orderEmail = email;
      if (req.user) {
         const currentUser = await User.findById(req.user.id);
         if (currentUser) orderEmail = currentUser.email;
      }

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

      const createdOrder = await order.save();

      // Clear user cart after order if logged in
      if (req.user) {
         await Cart.findOneAndUpdate({ user: req.user.id }, { items: [] });
      }

      // Dispatch Confirmation Email Protocol
      try {
         const emailRecipient = createdOrder.email;
         const recipientName = req.user ? (await User.findById(req.user.id))?.name : `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}`.trim();

         if (emailRecipient) {
            await sendEmail({
               email: emailRecipient,
               subject: `LUZZIO ARCHIVE DISPATCH: ORDER #${createdOrder._id.toString().slice(-6).toUpperCase()}`,
               html: orderConfirmationTemplate(createdOrder, { name: recipientName || 'Valued Client' })
            });
         }
      } catch (emailErr) {
         console.error('Email Protocol Deferred:', emailErr.message);
      }

      res.status(201).json({
         success: true,
         data: createdOrder
      });
   } catch (err) {
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

         await createNotification(
            order.user,
            'order_status',
            'Order Status Update',
            statusMessages[req.body.status] || `Your order status has been updated to ${req.body.status}`,
            order._id,
            'Order'
         );

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
