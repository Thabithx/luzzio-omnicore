const Order = require('../models/Order');
const Product = require('../models/Product');
const sendEmail = require('./sendEmail');
const { paymentSuccessTemplate } = require('./emailTemplates');

/**
 * Finalizes an order after successful payment.
 * Deducts stock, updates status, and sends notifications.
 */
exports.finalizeOrder = async (orderId, paymentId, provider) => {
   try {
      const order = await Order.findById(orderId);

      if (!order) {
         console.error(`[CRITICAL] Finalization failed: Order ${orderId} not found.`);
         return { success: false, message: 'Order not found' };
      }

      if (order.isPaid) {
         console.log(`[FINALIZE] Order ${orderId} is already marked as paid. Skipping.`);
         return { success: true, message: 'Already paid' };
      }

      // 1. Mark as Paid and Update Status
      order.isPaid = true;
      order.paidAt = Date.now();
      order.status = 'paid';
      order.paymentResult = {
         id: paymentId,
         status: 'succeeded',
         provider: provider
      };

      // 2. SECURE STOCK DEDUCTION
      for (const item of order.orderItems) {
         const product = await Product.findById(item.product);
         if (product && product.variants && product.variants.length > 0) {
            const variantIndex = product.variants.findIndex(v => v.size === item.size);
            if (variantIndex !== -1) {
               product.variants[variantIndex].stock = Math.max(0, product.variants[variantIndex].stock - (item.qty || 1));
               await product.save();
               console.log(`[STOCK SYNC] Deducted ${item.qty || 1} units from ${product.name} (Size: ${item.size})`);
            }
         }
      }

      await order.save();
      console.log(`[FINALIZE] Order ${orderId} successfully finalized.`);

      // 3. DISPATCH NOTIFICATIONS (Non-blocking)
      const adminEmail = process.env.ADMIN_EMAIL || 'luzzioclothing.com@gmail.com';

      setImmediate(() => {
         // Notify Client
         sendEmail({
            email: order.email,
            subject: `Order Confirmation #${order._id.toString().slice(-6).toUpperCase()}`,
            html: paymentSuccessTemplate(order, false)
         })
            .then(() => console.log(`[FINALIZE EMAIL] Client notification delivered: ${order.email}`))
            .catch(e => console.error('[FINALIZE EMAIL FAILURE] Client Notify Deferred:', e.message));

         // Notify Admin
         sendEmail({
            email: adminEmail,
            subject: `New Order Received #${order._id.toString().slice(-6).toUpperCase()}`,
            html: paymentSuccessTemplate(order, true)
         })
            .then(() => console.log(`[FINALIZE EMAIL] Admin notification delivered: ${adminEmail}`))
            .catch(e => console.error('[FINALIZE EMAIL FAILURE] Admin Alert Deferred:', e.message));
      });

      return { success: true };
   } catch (err) {
      console.error(`[FINALIZE ERROR] Order ${orderId}:`, err.message);
      return { success: false, message: err.message };
   }
};
