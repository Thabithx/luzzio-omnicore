const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema({
   user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
   },
   subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters']
   },
   message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters']
   },
   status: {
      type: String,
      enum: ['pending', 'replied', 'closed'],
      default: 'pending'
   },
   adminReply: {
      type: String,
      trim: true
   },
   repliedAt: {
      type: Date
   },
   repliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
   },
   createdAt: {
      type: Date,
      default: Date.now
   }
});

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
