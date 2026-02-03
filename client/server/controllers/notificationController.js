const Notification = require('../models/Notification');

// Helper function to create notification
exports.createNotification = async (userId, type, title, message, relatedId = null, relatedModel = null) => {
   try {
      const notification = new Notification({
         user: userId,
         type,
         title,
         message,
         relatedId,
         relatedModel
      });
      await notification.save();
      return notification;
   } catch (error) {
      console.error('Create notification error:', error);
      throw error;
   }
};

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
   try {
      const { unreadOnly } = req.query;

      const filter = { user: req.user.id };
      if (unreadOnly === 'true') {
         filter.isRead = false;
      }

      const notifications = await Notification.find(filter)
         .sort({ createdAt: -1 })
         .limit(50); // Limit to last 50 notifications

      const unreadCount = await Notification.countDocuments({
         user: req.user.id,
         isRead: false
      });

      res.status(200).json({
         success: true,
         count: notifications.length,
         unreadCount,
         data: notifications
      });
   } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch notifications',
         error: error.message
      });
   }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
   try {
      const notification = await Notification.findOne({
         _id: req.params.id,
         user: req.user.id
      });

      if (!notification) {
         return res.status(404).json({
            success: false,
            message: 'Notification not found'
         });
      }

      notification.isRead = true;
      await notification.save();

      res.status(200).json({
         success: true,
         message: 'Notification marked as read',
         data: notification
      });
   } catch (error) {
      console.error('Mark notification as read error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to mark notification as read',
         error: error.message
      });
   }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
   try {
      await Notification.updateMany(
         { user: req.user.id, isRead: false },
         { isRead: true }
      );

      res.status(200).json({
         success: true,
         message: 'All notifications marked as read'
      });
   } catch (error) {
      console.error('Mark all as read error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to mark all notifications as read',
         error: error.message
      });
   }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
   try {
      const notification = await Notification.findOne({
         _id: req.params.id,
         user: req.user.id
      });

      if (!notification) {
         return res.status(404).json({
            success: false,
            message: 'Notification not found'
         });
      }

      await notification.deleteOne();

      res.status(200).json({
         success: true,
         message: 'Notification deleted'
      });
   } catch (error) {
      console.error('Delete notification error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to delete notification',
         error: error.message
      });
   }
};

// @desc    Delete all read notifications
// @route   DELETE /api/notifications/clear-read
// @access  Private
exports.clearReadNotifications = async (req, res) => {
   try {
      await Notification.deleteMany({
         user: req.user.id,
         isRead: true
      });

      res.status(200).json({
         success: true,
         message: 'Read notifications cleared'
      });
   } catch (error) {
      console.error('Clear read notifications error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to clear notifications',
         error: error.message
      });
   }
};
