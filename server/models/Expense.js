// ADHAN
// Business expense management schema.
// Tracks operating overheads such as rent, salaries, utilities, and vendor payments.

const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
   category: {
      type: String,
      enum: [
         'Rent',
         'Salaries',
         'Utilities',
         'Supplier Payments',
         'Transportation',
         'Marketing',
         'Maintenance',
         'Other'
      ],
      required: true
   },
   description: {
      type: String,
      required: true,
      trim: true
   },
   amount: {
      type: Number,
      required: true,
      min: 0
   },
   paymentMethod: {
      type: String,
      enum: ['CASH', 'CARD', 'BANK_TRANSFER', 'CHEQUE', 'OTHER'],
      default: 'CASH'
   },
   date: {
      type: Date,
      default: Date.now
   },
   supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier'
   },
   employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
   },
   reference: {
      type: String,
      default: ''
   },
   status: {
      type: String,
      enum: ['PAID', 'PENDING', 'CANCELLED'],
      default: 'PAID'
   },
   createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
   },
   notes: {
      type: String,
      default: ''
   }
}, {
   timestamps: true
});

module.exports = mongoose.model('Expense', expenseSchema);
