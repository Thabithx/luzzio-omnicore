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

      // 4. Accounts Payable (AP) & Accounts Receivable (AR) (ADAHAN)
      const PurchaseOrder = require('../models/PurchaseOrder');
      const apOrders = await PurchaseOrder.aggregate([
         { $match: { status: { $in: ['DRAFT', 'ORDERED'] } } },
         { $group: { _id: null, total: { $sum: '$totalCost' } } }
      ]);
      const accountsPayable = apOrders[0]?.total || 0;

      const arOrders = await Order.aggregate([
         { $match: { isPaid: false, status: { $nin: ['cancelled', 'draft'] } } },
         { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]);
      const accountsReceivable = arOrders[0]?.total || 0;

      const netProfit = totalRevenue - totalExpenses - totalRefunds;

      res.status(200).json({
         success: true,
         data: {
            totalRevenue,
            onlineRevenue,
            posRevenue,
            totalExpenses,
            totalRefunds,
            accountsPayable,
            accountsReceivable,
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
      if (String(description).trim().length < 3) {
         return res.status(400).json({ success: false, message: 'Description must be at least 3 characters' });
      }
      const amt = Number(amount);
      if (isNaN(amt) || amt <= 0) {
         return res.status(400).json({ success: false, message: 'Amount must be a positive number greater than 0' });
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

// ADAHAN: Payment Gateway Reconciliation across Cash, Card, Online Pay (PayHere/Koko/Stripe)
// @desc    Get Gateway Payment Reconciliation Breakdown
// @route   GET /api/finance/reconciliation
// @access  Private (Admin)
exports.getPaymentReconciliation = async (req, res) => {
   try {
      const gatewaySummary = await Order.aggregate([
         { $match: { status: { $ne: 'cancelled' } } },
         {
            $group: {
               _id: '$paymentMethod',
               totalSales: { $sum: '$totalPrice' },
               orderCount: { $sum: 1 },
               paidSales: {
                  $sum: { $cond: [{ $eq: ['$isPaid', true] }, '$totalPrice', 0] }
               },
               pendingSales: {
                  $sum: { $cond: [{ $eq: ['$isPaid', false] }, '$totalPrice', 0] }
               }
            }
         }
      ]);

      res.status(200).json({
         success: true,
         data: gatewaySummary
      });
   } catch (error) {
      console.error('getPaymentReconciliation error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};

// ADAHAN: Accounts Payable (AP) & Accounts Receivable (AR) Breakdown
// @desc    Get AP & AR detailed lists
// @route   GET /api/finance/ap-ar
// @access  Private (Admin)
exports.getPayablesReceivables = async (req, res) => {
   try {
      const PurchaseOrder = require('../models/PurchaseOrder');

      // Accounts Payable: Pending Supplier Purchase Orders
      const payables = await PurchaseOrder.find({ status: { $in: ['DRAFT', 'ORDERED'] } })
         .populate('supplier', 'supplierName contactPerson phone email')
         .sort({ createdAt: -1 });

      // Accounts Receivable: Uncollected Customer Orders
      const receivables = await Order.find({ isPaid: false, status: { $nin: ['cancelled', 'draft'] } })
         .populate('user', 'name email')
         .sort({ createdAt: -1 });

      res.status(200).json({
         success: true,
         data: {
            payables,
            receivables
         }
      });
   } catch (error) {
      console.error('getPayablesReceivables error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};

// ADAHAN: Profit & Loss (P&L) Statement and Cash Flow Summaries
// @desc    Get complete P&L Statement and Cash Flow Breakdown
// @route   GET /api/finance/profit-loss
// @access  Private (Admin)
exports.getProfitLossStatement = async (req, res) => {
   try {
      const PurchaseOrder = require('../models/PurchaseOrder');

      // 1. Total Sales Revenues (Delivered & Paid orders)
      const salesData = await Order.aggregate([
         { $match: { status: { $ne: 'cancelled' } } },
         {
            $group: {
               _id: null,
               grossSales: { $sum: '$totalPrice' },
               itemsRevenue: { $sum: '$itemsPrice' },
               shippingRevenue: { $sum: '$shippingPrice' },
               paidSales: { $sum: { $cond: [{ $eq: ['$isPaid', true] }, '$totalPrice', 0] } },
               orderCount: { $sum: 1 }
            }
         }
      ]);

      const grossRevenue = salesData.length > 0 ? (salesData[0].grossSales || 0) : 0;
      const collectedRevenue = salesData.length > 0 ? (salesData[0].paidSales || 0) : 0;

      // 2. Cost of Goods Sold (COGS) from received Purchase Orders or estimated standard 55%
      const poReceived = await PurchaseOrder.aggregate([
         { $match: { status: 'RECEIVED' } },
         { $group: { _id: null, totalCOGS: { $sum: '$totalCost' } } }
      ]);
      const actualCOGS = poReceived.length > 0 && poReceived[0].totalCOGS > 0 
         ? poReceived[0].totalCOGS 
         : Math.round(grossRevenue * 0.55);

      const grossProfit = Math.max(0, grossRevenue - actualCOGS);
      const grossMarginPercent = grossRevenue > 0 ? ((grossProfit / grossRevenue) * 100).toFixed(1) : 0;

      // 3. Operating Expenses grouped by category
      const expensesByCategory = await Expense.aggregate([
         {
            $group: {
               _id: '$category',
               total: { $sum: '$amount' },
               count: { $sum: 1 }
            }
         }
      ]);

      let totalOperatingExpenses = 0;
      const expenseBreakdown = {};
      expensesByCategory.forEach(exp => {
         expenseBreakdown[exp._id || 'Other'] = exp.total;
         totalOperatingExpenses += exp.total;
      });

      // 4. Net Operating Profit & Margin
      const netProfit = grossProfit - totalOperatingExpenses;
      const netProfitMargin = grossRevenue > 0 ? ((netProfit / grossRevenue) * 100).toFixed(1) : 0;

      // 5. Cash Flow Summary
      const cashInflow = collectedRevenue;
      const cashOutflow = totalOperatingExpenses + actualCOGS;
      const netCashFlow = cashInflow - cashOutflow;

      res.status(200).json({
         success: true,
         data: {
            revenue: {
               grossRevenue,
               collectedRevenue,
               orderCount: salesData.length > 0 ? salesData[0].orderCount : 0
            },
            cogs: {
               totalCOGS: actualCOGS,
               grossProfit,
               grossMarginPercent: Number(grossMarginPercent)
            },
            expenses: {
               totalExpenses: totalOperatingExpenses,
               breakdown: expenseBreakdown
            },
            netIncome: {
               netProfit,
               netProfitMargin: Number(netProfitMargin)
            },
            cashFlow: {
               inflow: cashInflow,
               outflow: cashOutflow,
               netCashFlow
            }
         }
      });
   } catch (error) {
      console.error('getProfitLossStatement error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};

// ADAHAN: POS Cash Drawer Shift Reconciliation
// @desc    Record POS Cash Drawer reconciliation session
// @route   POST /api/finance/cash-drawer-reconcile
// @access  Private (Admin / Sales)
exports.recordCashDrawerSession = async (req, res) => {
   try {
      const CashDrawerSession = require('../models/CashDrawerSession');
      const { cashierName, shiftType, openingFloat, cashSales, cashPayouts, actualClosingCash, notes } = req.body;

      const fOpening = Number(openingFloat) || 0;
      const fSales = Number(cashSales) || 0;
      const fPayouts = Number(cashPayouts) || 0;
      const fActual = Number(actualClosingCash) || 0;

      const expectedClosing = fOpening + fSales - fPayouts;
      const variance = fActual - expectedClosing;

      let status = 'BALANCED';
      if (variance > 0) status = 'OVERAGE';
      else if (variance < 0) status = 'SHORTAGE';

      const session = await CashDrawerSession.create({
         cashier: req.user ? req.user._id : null,
         cashierName: cashierName || (req.user ? req.user.name : 'Cashier'),
         shiftType: shiftType || 'FULL_DAY',
         openingFloat: fOpening,
         cashSales: fSales,
         cashPayouts: fPayouts,
         expectedClosingCash: expectedClosing,
         actualClosingCash: fActual,
         variance,
         status,
         notes: notes || ''
      });

      res.status(201).json({
         success: true,
         message: `Cash Drawer Reconciled: ${status} (Variance: LKR ${variance.toLocaleString()})`,
         data: session
      });
   } catch (error) {
      console.error('recordCashDrawerSession error:', error);
      res.status(400).json({ success: false, message: error.message });
   }
};

// @desc    Get all POS Cash Drawer reconciliation logs
// @route   GET /api/finance/cash-drawer-sessions
// @access  Private (Admin / Sales)
exports.getCashDrawerSessions = async (req, res) => {
   try {
      const CashDrawerSession = require('../models/CashDrawerSession');
      const sessions = await CashDrawerSession.find()
         .populate('cashier', 'name email role')
         .sort({ createdAt: -1 })
         .limit(100);

      res.status(200).json({
         success: true,
         count: sessions.length,
         data: sessions
      });
   } catch (error) {
      console.error('getCashDrawerSessions error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};
