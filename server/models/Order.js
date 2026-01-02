const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
   user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: false
   },
   email: {
      type: String,
      required: true
   },
   orderItems: [
      {
         name: { type: String, required: true },
         qty: { type: Number, required: true },
         image: { type: String },
         price: { type: Number, required: true },
         product: {
            type: mongoose.Schema.ObjectId,
            ref: 'Product',
            required: true
         },
         size: { type: String, required: true },
         color: { type: String, default: 'Noir' },
         trackingNumber: { type: String, default: '' }
      }
   ],
   shippingAddress: {
      firstName: { type: String },
      lastName: { type: String },
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true }
   },
   paymentMethod: {
      type: String,
      required: true,
      default: 'Stripe'
   },
   stripeSessionId: {
      type: String
   },
   paymentResult: {
      id: { type: String },
      status: { type: String },
      update_time: { type: String },
      email_address: { type: String }
   },
   itemsPrice: {
      type: Number,
      required: true,
      default: 0.0
   },
   shippingPrice: {
      type: Number,
      required: true,
      default: 0.0
   },
   totalPrice: {
      type: Number,
      required: true,
      default: 0.0
   },
   isPaid: {
      type: Boolean,
      required: true,
      default: false
   },
   paidAt: {
      type: Date
   },
   isDelivered: {
      type: Boolean,
      required: true,
      default: false
   },
   deliveredAt: {
      type: Date
   },
   status: {
      type: String,
      enum: ['pending', 'paid', 'processing', 'packaged', 'out for delivery', 'delivered', 'completed', 'cancelled', 'returned'],
      default: 'pending'
   }
}, {
   timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
