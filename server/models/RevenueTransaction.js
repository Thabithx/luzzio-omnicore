// ADHAN
// Centralized revenue transaction schema.
// Consolidates both ONLINE and POS sales channels into unified financial accounting.

const mongoose = require('mongoose');

const revenueTransactionSchema = new mongoose.Schema({
   sourceChannel: {
      type: String,
      enum: ['ONLINE', 'POS'],
      required: true
   },
   orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
   },
   paymentId: {
      type: String,
      default: ''
   },
   amount: {
      type: Number,
      required: true
   },
   paymentMethod: {
      type: String,
      enum: ['CASH', 'CARD', 'ONLINE', 'STRIPE', 'PAYHERE', 'KOKO', 'OTHER'],
      default: 'CASH'
   },
   status: {
      type: String,
      enum: ['COMPLETED', 'VOIDED', 'REFUNDED', 'REVERSED'],
      default: 'COMPLETED'
   },
   createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
   },
   timestamp: {
      type: Date,
      default: Date.now
   },
   notes: {
      type: String,
      default: ''
   }
}, {
   timestamps: true
});

revenueTransactionSchema.index({ sourceChannel: 1, timestamp: -1 });

module.exports = mongoose.model('RevenueTransaction', revenueTransactionSchema);
