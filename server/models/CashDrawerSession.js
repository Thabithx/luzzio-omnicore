// ADAHAN
// POS Cash Drawer Float & Shift Reconciliation Model
// Tracks opening cash float, expected cash intake, actual physical cash count, and cashier variance.

const mongoose = require('mongoose');

const CashDrawerSessionSchema = new mongoose.Schema({
   cashier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
   },
   cashierName: {
      type: String,
      required: true,
      default: 'Cashier'
   },
   shiftType: {
      type: String,
      enum: ['MORNING', 'EVENING', 'FULL_DAY'],
      default: 'FULL_DAY'
   },
   openingFloat: {
      type: Number,
      required: true,
      default: 0
   },
   cashSales: {
      type: Number,
      default: 0
   },
   cashPayouts: {
      type: Number,
      default: 0
   },
   expectedClosingCash: {
      type: Number,
      required: true
   },
   actualClosingCash: {
      type: Number,
      required: true
   },
   variance: {
      type: Number, // actualClosingCash - expectedClosingCash
      required: true
   },
   status: {
      type: String,
      enum: ['BALANCED', 'OVERAGE', 'SHORTAGE'],
      default: 'BALANCED'
   },
   notes: {
      type: String,
      default: ''
   }
}, { timestamps: true });

module.exports = mongoose.model('CashDrawerSession', CashDrawerSessionSchema);
