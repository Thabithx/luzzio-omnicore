// DULARA: Centralized Inventory routes

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
   getInventory,
   adjustStock,
   getInventoryHistory,
   getInventoryReport
} = require('../controllers/inventoryController');

router.get('/', protect, authorize('admin', 'warehouse', 'sales'), getInventory);
router.get('/report', protect, authorize('admin', 'warehouse'), getInventoryReport);
router.post('/adjust', protect, authorize('admin', 'warehouse'), adjustStock);
router.get('/history', protect, authorize('admin', 'warehouse'), getInventoryHistory);

module.exports = router;
