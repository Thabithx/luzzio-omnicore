const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.get('/', protect, notificationController.getNotifications);
router.put('/read-all', protect, notificationController.markAllAsRead);
router.put('/:id/read', protect, notificationController.markAsRead);
router.delete('/clear-read', protect, notificationController.clearReadNotifications);
router.delete('/:id', protect, notificationController.deleteNotification);

module.exports = router;
