const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
   user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
   },
   type: {
      type: String,
      enum: ['order_status', 'contact_reply', 'general'],
      required: true
   },
   title: {
      type: String,
      required: true,
      trim: true
   },
   message: {
      type: String,
      required: true,
      trim: true
   },
   relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'relatedModel'
   },
   relatedModel: {
      type: String,
      enum: ['Order', 'ContactMessage', null]
   },
   isRead: {
      type: Boolean,
      default: false
   },
   createdAt: {
      type: Date,
      default: Date.now
   }
});

// Index for faster queries
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
