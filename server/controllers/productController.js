const Product = require('../models/Product');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
   try {
      let query;

      // Copy req.query
      const reqQuery = { ...req.query };

      // Fields to exclude
      const removeFields = ['select', 'sort', 'page', 'limit'];

      // Loop over removeFields and delete them from reqQuery
      removeFields.forEach(param => delete reqQuery[param]);

      // Create query string
      let queryStr = JSON.stringify(reqQuery);

      // Create operators ($gt, $gte, etc)
      queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

      // Finding resource
      query = Product.find(JSON.parse(queryStr)).populate('categories').populate('category');

      // Select Fields
      if (req.query.select) {
         const fields = req.query.select.split(',').join(' ');
         query = query.select(fields);
      }

      // Sort
      if (req.query.sort) {
         const sortBy = req.query.sort.split(',').join(' ');
         query = query.sort(sortBy);
      } else {
         query = query.sort('-createdAt');
      }

      // Pagination
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 100;
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const total = await Product.countDocuments();

      query = query.skip(startIndex).limit(limit);

      // Executing query
      const products = await query;

      res.status(200).json({
         success: true,
         count: products.length,
         data: products
      });
   } catch (err) {
      res.status(500).json({ success: false, message: err.message });
   }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res) => {
   try {
      const product = await Product.findById(req.params.id).populate('categories').populate('category');

      if (!product) {
         return res.status(404).json({ success: false, message: 'Product not found' });
      }

      res.status(200).json({
         success: true,
         data: product
      });
   } catch (err) {
      res.status(500).json({ success: false, message: err.message });
   }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res) => {
   try {
      const product = await Product.create(req.body);

      res.status(201).json({
         success: true,
         data: product
      });
   } catch (err) {
      res.status(400).json({ success: false, message: err.message });
   }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res) => {
   try {
      let product = await Product.findById(req.params.id);

      if (!product) {
         return res.status(404).json({ success: false, message: 'Product not found' });
      }

      product = await Product.findByIdAndUpdate(req.params.id, req.body, {
         new: true,
         runValidators: true
      });

      res.status(200).json({
         success: true,
         data: product
      });
   } catch (err) {
      res.status(400).json({ success: false, message: err.message });
   }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res) => {
   try {
      const product = await Product.findById(req.params.id);

      if (!product) {
         return res.status(404).json({ success: false, message: 'Product not found' });
      }

      await product.deleteOne();

      res.status(200).json({
         success: true,
         data: {}
      });
   } catch (err) {
      res.status(500).json({ success: false, message: err.message });
   }
};

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Public
exports.createProductReview = async (req, res) => {
   try {
      const { rating, comment, name, email, images } = req.body;

      const product = await Product.findById(req.params.id);

      if (!product) {
         return res.status(404).json({ success: false, message: 'Product not found' });
      }

      const review = {
         name,
         email,
         rating: Number(rating),
         comment,
         images: images || [],
         user: req.user ? req.user._id : null,
         createdAt: new Date()
      };

      product.reviews.push(review);

      // Recalculate Average Rating
      product.numReviews = product.reviews.length;
      product.rating =
         product.reviews.reduce((acc, item) => item.rating + acc, 0) /
         product.reviews.length;

      await product.save();

      res.status(201).json({ success: true, message: 'Review added', data: review });
   } catch (err) {
      res.status(400).json({ success: false, message: err.message });
   }
};
