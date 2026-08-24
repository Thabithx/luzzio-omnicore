// ADHAN
// Centralized financial management controller.
// Tracks Online vs POS revenue streams, business expense records, and computes net profit metrics.

const RevenueTransaction = require('../models/RevenueTransaction');
const Expense = require('../models/Expense');
const Order = require('../models/Order');

// @desc    Get financial dashboard overview
// @route   GET /api/finance/overview
// @access  Private (Admin)
exports.getFinancialOverview = async (req, res) => {
   try {
      // 1. Calculate Online vs POS Revenue
      const onlineRevenueAgg = await Order.aggregate([
         { $match: { channel: 'ONLINE', isPaid: true, status: { $ne: 'cancelled' } } },
         { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]);

      const posRevenueAgg = await Order.aggregate([
         { $match: { channel: 'POS', isPaid: true, status: { $ne: 'cancelled' } } },
         { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]);

      const onlineRevenue = onlineRevenueAgg[0]?.total || 0;
      const posRevenue = posRevenueAgg[0]?.total || 0;
      const totalRevenue = onlineRevenue + posRevenue;

      // 2. Calculate Total Expenses
      const expenseAgg = await Expense.aggregate([
         { $match: { status: 'PAID' } },
         { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const totalExpenses = expenseAgg[0]?.total || 0;

      // 3. Calculate Refunds Issued
      const refundAgg = await RevenueTransaction.aggregate([
         { $match: { status: 'REFUNDED' } },
         { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const totalRefunds = Math.abs(refundAgg[0]?.total || 0);

      const netProfit = totalRevenue - totalExpenses - totalRefunds;

      res.status(200).json({
         success: true,
         data: {
            totalRevenue,
            onlineRevenue,
            posRevenue,
            totalExpenses,
            totalRefunds,
            netProfit
         }
      });
   } catch (error) {
      console.error('getFinancialOverview error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};

// @desc    Get revenue transactions (Online & POS)
// @route   GET /api/finance/revenue
// @access  Private (Admin)
exports.getRevenueTransactions = async (req, res) => {
   try {
      const { channel, status, limit = 50 } = req.query;
      const query = {};

      if (channel) query.sourceChannel = channel;
      if (status) query.status = status;

      const transactions = await RevenueTransaction.find(query)
         .populate('orderId', 'orderNumber totalPrice status email')
         .populate('createdBy', 'name')
         .sort({ timestamp: -1 })
         .limit(parseInt(limit));

      res.status(200).json({
         success: true,
         count: transactions.length,
         data: transactions
      });
   } catch (error) {
      console.error('getRevenueTransactions error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};

// @desc    Get business expenses
// @route   GET /api/finance/expenses
// @access  Private (Admin)
exports.getExpenses = async (req, res) => {
   try {
      const { category, status } = req.query;
      const query = {};

      if (category) query.category = category;
      if (status) query.status = status;

      const expenses = await Expense.find(query)
         .populate('supplier', 'supplierName')
         .populate('employee', 'name')
         .populate('createdBy', 'name')
         .sort({ date: -1 });

      res.status(200).json({
         success: true,
         count: expenses.length,
         data: expenses
      });
   } catch (error) {
      console.error('getExpenses error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};

// @desc    Create new business expense
// @route   POST /api/finance/expenses
// @access  Private (Admin)
exports.createExpense = async (req, res) => {
   try {
      const { category, description, amount, paymentMethod, date, supplier, employee, reference, status, notes } = req.body;

      if (!category || !description || amount === undefined) {
         return res.status(400).json({ success: false, message: 'Category, description, and amount are required' });
      }

      const expense = await Expense.create({
         category,
         description,
         amount: Number(amount),
         paymentMethod: paymentMethod || 'CASH',
         date: date || Date.now(),
         supplier: supplier || null,
         employee: employee || null,
         reference: reference || '',
         status: status || 'PAID',
         createdBy: req.user ? req.user._id : null,
         notes: notes || ''
      });

      res.status(201).json({
         success: true,
         message: 'Expense recorded successfully',
         data: expense
      });
   } catch (error) {
      console.error('createExpense error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};

// @desc    Update business expense
// @route   PUT /api/finance/expenses/:id
// @access  Private (Admin)
exports.updateExpense = async (req, res) => {
   try {
      const expense = await Expense.findById(req.params.id);
      if (!expense) {
         return res.status(404).json({ success: false, message: 'Expense record not found' });
      }

      const fieldsToUpdate = ['category', 'description', 'amount', 'paymentMethod', 'date', 'supplier', 'employee', 'reference', 'status', 'notes'];
      fieldsToUpdate.forEach(field => {
         if (req.body[field] !== undefined) {
            expense[field] = req.body[field];
         }
      });

      await expense.save();

      res.status(200).json({
         success: true,
         message: 'Expense updated successfully',
         data: expense
      });
   } catch (error) {
      console.error('updateExpense error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};

// @desc    Delete business expense
// @route   DELETE /api/finance/expenses/:id
// @access  Private (Admin)
exports.deleteExpense = async (req, res) => {
   try {
      const expense = await Expense.findById(req.params.id);
      if (!expense) {
         return res.status(404).json({ success: false, message: 'Expense record not found' });
      }

      await expense.deleteOne();

      res.status(200).json({
         success: true,
         message: 'Expense record deleted'
      });
   } catch (error) {
      console.error('deleteExpense error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};
