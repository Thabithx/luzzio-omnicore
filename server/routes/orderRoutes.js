const express = require('express');
const {
   createOrder,
   getMyOrders,
   getOrders,
   getGuestOrders,
   syncMyOrders,
   updateOrderStatus,
   updateItemTracking
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', createOrder);
router.get('/guest/:email', getGuestOrders);

router.use(protect);
router.put('/sync', syncMyOrders);

router.route('/')
   .get(admin, getOrders);

router.route('/myorders').get(getMyOrders);

router.route('/:id/status').put(admin, updateOrderStatus);
router.route('/:id/item/:itemId/tracking').put(admin, updateItemTracking);

module.exports = router;
