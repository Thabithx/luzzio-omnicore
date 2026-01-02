const express = require('express');
const {
   createOrder,
   getMyOrders,
   getOrders,
   updateOrderStatus,
   updateItemTracking
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', createOrder);

router.use(protect);

router.route('/')
   .get(admin, getOrders);

router.route('/myorders').get(getMyOrders);

router.route('/:id/status').put(admin, updateOrderStatus);
router.route('/:id/item/:itemId/tracking').put(admin, updateItemTracking);

module.exports = router;
