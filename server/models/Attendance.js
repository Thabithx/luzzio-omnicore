// Staff Operations
// Employee attendance schema.
// Tracks daily clock in / clock out logs and shift durations.

const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
   employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
   },
   date: {
      type: Date,
      default: Date.now
   },
   clockIn: {
      type: Date,
      required: true
   },
   clockOut: {
      type: Date
   },
   status: {
      type: String,
      enum: ['PRESENT', 'LATE', 'ABSENT', 'LEAVE'],
      default: 'PRESENT'
   },
   punctuality: {
      type: String,
      enum: ['ON_TIME', 'LATE', 'EXCUSED'],
      default: 'ON_TIME'
   },
   minutesLate: {
      type: Number,
      default: 0
   },
   shiftScheduledStart: {
      type: String,
      default: '09:00'
   },
   workHours: {
      type: Number,
      default: 0
   },
   notes: {
      type: String,
      default: ''
   }
}, {
   timestamps: true
});

attendanceSchema.index({ employee: 1, date: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
