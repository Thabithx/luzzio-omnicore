const express = require('express');
const {
   getCart,
   addItemToCart,
   updateCartItem,
   removeItemFromCart,
   clearCart
} = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.route('/')
   .get(getCart)
   .post(addItemToCart)
   .put(updateCartItem)
   .delete(clearCart);

router.route('/:productId/:size/:color')
   .delete(removeItemFromCart);

module.exports = router;
