// BIHANDU: Return & Exchange Routes

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
   createReturnRequest,
   getReturnRequests,
   processReturnStatus,
   getReturnsReport,
   swapReturnSize
} = require('../controllers/returnController');

router.post('/', protect, createReturnRequest);
router.get('/', protect, authorize('admin', 'warehouse', 'sales'), getReturnRequests);
router.get('/report', protect, authorize('admin', 'warehouse', 'sales'), getReturnsReport);
router.put('/:id/status', protect, authorize('admin', 'warehouse'), processReturnStatus);
router.post('/:id/swap-size', protect, authorize('admin', 'warehouse', 'sales'), swapReturnSize);

module.exports = router;
