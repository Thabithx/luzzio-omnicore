// ADHAN: Financial & Expense Routes

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
   getFinancialOverview,
   getRevenueTransactions,
   getExpenses,
   createExpense,
   updateExpense,
   deleteExpense
} = require('../controllers/financeController');

router.get('/overview', protect, authorize('admin'), getFinancialOverview);
router.get('/revenue', protect, authorize('admin'), getRevenueTransactions);
router.get('/expenses', protect, authorize('admin'), getExpenses);
router.post('/expenses', protect, authorize('admin'), createExpense);
router.put('/expenses/:id', protect, authorize('admin'), updateExpense);
router.delete('/expenses/:id', protect, authorize('admin'), deleteExpense);

module.exports = router;
