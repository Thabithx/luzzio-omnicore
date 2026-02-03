const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { protect, admin } = require('../middleware/authMiddleware');

// User routes
router.post('/', protect, contactController.createMessage);
router.get('/my-messages', protect, contactController.getMyMessages);

// Admin routes
router.get('/', protect, admin, contactController.getAllMessages);
router.put('/:id/reply', protect, admin, contactController.replyToMessage);
router.put('/:id/status', protect, admin, contactController.updateMessageStatus);
router.delete('/:id', protect, admin, contactController.deleteMessage);

module.exports = router;
