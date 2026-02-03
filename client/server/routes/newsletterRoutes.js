const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.post('/subscribe', newsletterController.subscribe);
router.post('/unsubscribe', newsletterController.unsubscribe);

// Admin routes
router.get('/subscribers', protect, admin, newsletterController.getAllSubscribers);

module.exports = router;
