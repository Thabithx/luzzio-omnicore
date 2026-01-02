const Cart = require('../models/Cart');
const Product = require('../models/Product');

// @desc    Get current user cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res) => {
   try {
      let cart = await Cart.findOne({ user: req.user.id }).populate('items.product');

      if (!cart) {
         cart = await Cart.create({ user: req.user.id, items: [] });
      }

      res.status(200).json({
         success: true,
         data: cart
      });
   } catch (err) {
      res.status(500).json({ success: false, message: err.message });
   }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
exports.addItemToCart = async (req, res) => {
   try {
      const { productId, quantity, size, color } = req.body;

      let cart = await Cart.findOne({ user: req.user.id });

      if (!cart) {
         cart = new Cart({ user: req.user.id, items: [] });
      }

      // Check if product already in cart with same size and color
      const itemIndex = cart.items.findIndex(
         item => item.product.toString() === productId && item.size === size && item.color === color
      );

      if (itemIndex > -1) {
         cart.items[itemIndex].quantity += quantity || 1;
      } else {
         cart.items.push({ product: productId, quantity: quantity || 1, size, color });
      }

      cart.updatedAt = Date.now();
      await cart.save();

      const updatedCart = await Cart.findById(cart._id).populate('items.product');

      res.status(200).json({
         success: true,
         data: updatedCart
      });
   } catch (err) {
      res.status(500).json({ success: false, message: err.message });
   }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart
// @access  Private
exports.updateCartItem = async (req, res) => {
   try {
      const { productId, size, color, quantity } = req.body;
      const cart = await Cart.findOne({ user: req.user.id });

      if (!cart) {
         return res.status(404).json({ success: false, message: 'Cart not found' });
      }

      const itemIndex = cart.items.findIndex(
         item => item.product.toString() === productId && item.size === size && item.color === color
      );

      if (itemIndex === -1) {
         return res.status(404).json({ success: false, message: 'Item not found in cart' });
      }

      cart.items[itemIndex].quantity = quantity;
      cart.updatedAt = Date.now();
      await cart.save();

      const updatedCart = await Cart.findById(cart._id).populate('items.product');

      res.status(200).json({
         success: true,
         data: updatedCart
      });
   } catch (err) {
      res.status(500).json({ success: false, message: err.message });
   }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId/:size
// @access  Private
exports.removeItemFromCart = async (req, res) => {
   try {
      const { productId, size, color } = req.params;
      const cart = await Cart.findOne({ user: req.user.id });

      if (!cart) {
         return res.status(404).json({ success: false, message: 'Cart not found' });
      }

      cart.items = cart.items.filter(
         item => !(item.product.toString() === productId && item.size === size && item.color === color)
      );

      cart.updatedAt = Date.now();
      await cart.save();

      const updatedCart = await Cart.findById(cart._id).populate('items.product');

      res.status(200).json({
         success: true,
         data: updatedCart
      });
   } catch (err) {
      res.status(500).json({ success: false, message: err.message });
   }
};

// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = async (req, res) => {
   try {
      await Cart.findOneAndUpdate({ user: req.user.id }, { items: [] });
      res.status(200).json({
         success: true,
         message: 'Cart cleared'
      });
   } catch (err) {
      res.status(500).json({ success: false, message: err.message });
   }
};
