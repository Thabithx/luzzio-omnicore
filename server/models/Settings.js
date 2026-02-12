const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
   timerEnabled: {
      type: Boolean,
      default: false
   },
   timerEndTime: {
      type: Date
   },
   timerMessage: {
      type: String,
      default: "Don't miss out on these great deals"
   },
   // Future-proofing: possibly other global settings
   siteMaintenance: {
      type: Boolean,
      default: false
   }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
