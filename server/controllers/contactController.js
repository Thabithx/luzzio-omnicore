const ContactMessage = require('../models/ContactMessage');

// @desc    Create new contact message
// @route   POST /api/contact
// @access  Private
exports.createMessage = async (req, res) => {
   try {
      const { subject, message } = req.body;

      if (!subject || !message) {
         return res.status(400).json({
            success: false,
            message: 'Subject and message are required'
         });
      }

      const contactMessage = new ContactMessage({
         user: req.user.id,
         subject,
         message
      });

      await contactMessage.save();

      res.status(201).json({
         success: true,
         message: 'Message sent successfully',
         data: contactMessage
      });
   } catch (error) {
      console.error('Create contact message error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to send message',
         error: error.message
      });
   }
};

// @desc    Get user's contact messages
// @route   GET /api/contact/my-messages
// @access  Private
exports.getMyMessages = async (req, res) => {
   try {
      const messages = await ContactMessage.find({ user: req.user.id })
         .sort({ createdAt: -1 });

      res.status(200).json({
         success: true,
         count: messages.length,
         data: messages
      });
   } catch (error) {
      console.error('Get my messages error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch messages',
         error: error.message
      });
   }
};

// @desc    Get all contact messages (admin)
// @route   GET /api/contact
// @access  Private/Admin
exports.getAllMessages = async (req, res) => {
   try {
      const messages = await ContactMessage.find()
         .populate('user', 'name email')
         .populate('repliedBy', 'name')
         .sort({ createdAt: -1 });

      res.status(200).json({
         success: true,
         count: messages.length,
         data: messages
      });
   } catch (error) {
      console.error('Get all messages error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch messages',
         error: error.message
      });
   }
};

// @desc    Reply to contact message (admin)
// @route   PUT /api/contact/:id/reply
// @access  Private/Admin
exports.replyToMessage = async (req, res) => {
   try {
      const { adminReply } = req.body;

      if (!adminReply) {
         return res.status(400).json({
            success: false,
            message: 'Reply message is required'
         });
      }

      const message = await ContactMessage.findById(req.params.id);

      if (!message) {
         return res.status(404).json({
            success: false,
            message: 'Contact message not found'
         });
      }

      message.adminReply = adminReply;
      message.status = 'replied';
      message.repliedAt = Date.now();
      message.repliedBy = req.user.id;

      await message.save();

      // Create notification for user
      const { createNotification } = require('./notificationController');
      await createNotification(
         message.user,
         'contact_reply',
         'Admin Reply to Your Message',
         `You have received a reply to your message: "${message.subject}"`,
         message._id,
         'ContactMessage'
      );

      res.status(200).json({
         success: true,
         message: 'Reply sent successfully',
         data: message
      });
   } catch (error) {
      console.error('Reply to message error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to send reply',
         error: error.message
      });
   }
};

// @desc    Update message status (admin)
// @route   PUT /api/contact/:id/status
// @access  Private/Admin
exports.updateMessageStatus = async (req, res) => {
   try {
      const { status } = req.body;

      if (!['pending', 'replied', 'closed'].includes(status)) {
         return res.status(400).json({
            success: false,
            message: 'Invalid status'
         });
      }

      const message = await ContactMessage.findById(req.params.id);

      if (!message) {
         return res.status(404).json({
            success: false,
            message: 'Contact message not found'
         });
      }

      message.status = status;
      await message.save();

      res.status(200).json({
         success: true,
         message: 'Status updated successfully',
         data: message
      });
   } catch (error) {
      console.error('Update message status error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to update status',
         error: error.message
      });
   }
};

// @desc    Delete contact message (admin)
// @route   DELETE /api/contact/:id
// @access  Private/Admin
exports.deleteMessage = async (req, res) => {
   try {
      const message = await ContactMessage.findById(req.params.id);

      if (!message) {
         return res.status(404).json({
            success: false,
            message: 'Contact message not found'
         });
      }

      await message.deleteOne();

      res.status(200).json({
         success: true,
         message: 'Message deleted successfully'
      });
   } catch (error) {
      console.error('Delete message error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to delete message',
         error: error.message
      });
   }
};
