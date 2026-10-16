// MAHATHIR
// Staff user management, employee profiles, attendance (Clock In/Out), and shift scheduling.

const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Shift = require('../models/Shift');
const { fail, blank, validEmail, validPhone } = require('../utils/validate');

// @desc    Get all staff users (ADMIN, SALES, WAREHOUSE)
// @route   GET /api/staff
// @access  Private (Admin)
exports.getStaff = async (req, res) => {
   try {
      const staff = await User.find({ role: { $in: ['admin', 'sales', 'warehouse'] } })
         .select('-password')
         .sort({ name: 1 })
         .lean();

      // Aggregate punctuality score for each staff member
      const attendanceAgg = await Attendance.aggregate([
         {
            $group: {
               _id: '$employee',
               total: { $sum: 1 },
               onTime: {
                  $sum: {
                     $cond: [{ $or: [{ $eq: ['$punctuality', 'ON_TIME'] }, { $eq: ['$status', 'PRESENT'] }] }, 1, 0]
                  }
               }
            }
         }
      ]);

      const attMap = {};
      attendanceAgg.forEach(a => {
         attMap[a._id.toString()] = a;
      });

      const enrichedStaff = staff.map(s => {
         const att = attMap[s._id.toString()];
         const punctualityRate = att && att.total > 0 ? Math.round((att.onTime / att.total) * 100) : 100;
         return {
            ...s,
            punctualityRate,
            isOnTimeChampion: punctualityRate >= 90
         };
      });

      res.status(200).json({
         success: true,
         count: enrichedStaff.length,
         data: enrichedStaff
      });
   } catch (error) {
      console.error('getStaff error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};

// @desc    Create staff member profile & account
// @route   POST /api/staff
// @access  Private (Admin)
exports.createStaffMember = async (req, res) => {
   try {
      const { name, email, password, role, employeeId, phone, address, joinedDate } = req.body;

      if (!name || !email || !password || !role) {
         return res.status(400).json({ success: false, message: 'Name, email, password, and role are required' });
      }
      if (String(name).trim().length < 2) {
         return fail(res, 'Name must be at least 2 characters');
      }
      if (!validEmail(email)) {
         return fail(res, 'Please provide a valid email address');
      }
      if (String(password).length < 6) {
         return fail(res, 'Password must be at least 6 characters');
      }
      if (phone && !validPhone(phone)) {
         return fail(res, 'Please provide a valid phone number (7–20 digits)');
      }
      const validRoles = ['admin', 'sales', 'warehouse'];
      if (!validRoles.includes(role)) {
         return fail(res, `Role must be one of: ${validRoles.join(', ')}`);
      }


      const existing = await User.findOne({ email: email.trim().toLowerCase() });
      if (existing) {
         return res.status(400).json({ success: false, message: 'User with this email already exists' });
      }

      const autoEmployeeId = employeeId || `EMP-${Date.now().toString().slice(-4)}`;

      const staff = await User.create({
         name: name.trim(),
         email: email.trim().toLowerCase(),
         password,
         role,
         employeeId: autoEmployeeId,
         phone: phone || '',
         address: address || '',
         joinedDate: joinedDate || Date.now(),
         status: 'active'
      });

      res.status(201).json({
         success: true,
         message: 'Staff member created successfully',
         data: {
            _id: staff._id,
            name: staff.name,
            email: staff.email,
            role: staff.role,
            employeeId: staff.employeeId
         }
      });
   } catch (error) {
      console.error('createStaffMember error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};

// @desc    Update staff profile or role
// @route   PUT /api/staff/:id
// @access  Private (Admin)
exports.updateStaffMember = async (req, res) => {
   try {
      const staff = await User.findById(req.params.id);
      if (!staff) {
         return res.status(404).json({ success: false, message: 'Staff member not found' });
      }

      const fields = ['name', 'role', 'phone', 'address', 'status', 'employeeId', 'profileImage'];
      fields.forEach(f => {
         if (req.body[f] !== undefined) staff[f] = req.body[f];
      });

      if (req.body.password) {
         staff.password = req.body.password;
      }

      await staff.save();

      res.status(200).json({
         success: true,
         message: 'Staff profile updated',
         data: staff
      });
   } catch (error) {
      console.error('updateStaffMember error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};

// @desc    Clock in employee attendance
// @route   POST /api/staff/attendance/clock-in
// @access  Private (Admin / Sales / Warehouse)
exports.clockIn = async (req, res) => {
   try {
      const employeeId = req.body.employeeId || req.user._id;

      // Check if already clocked in today without clock out
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const existing = await Attendance.findOne({
         employee: employeeId,
         clockIn: { $gte: startOfDay },
         clockOut: { $exists: false }
      });

      if (existing) {
         return res.status(400).json({ success: false, message: 'Employee is already clocked in today' });
      }

      // Check scheduled shift for today to determine punctuality
      const scheduledShift = await Shift.findOne({
         employee: employeeId,
         date: { $gte: startOfDay, $lte: endOfDay },
         status: { $ne: 'CANCELLED' }
      });

      const clockInTime = new Date();
      const scheduledStartTime = scheduledShift?.startTime || '09:00';
      const [schedH, schedM] = scheduledStartTime.split(':').map(Number);
      
      const scheduledDate = new Date(clockInTime);
      scheduledDate.setHours(schedH || 9, schedM || 0, 0, 0);

      // Grace period of 15 minutes
      const diffMinutes = Math.round((clockInTime.getTime() - scheduledDate.getTime()) / (1000 * 60));
      const isLate = diffMinutes > 15;
      const punctuality = isLate ? 'LATE' : 'ON_TIME';
      const minutesLate = isLate ? diffMinutes : 0;

      const attendance = await Attendance.create({
         employee: employeeId,
         clockIn: clockInTime,
         status: isLate ? 'LATE' : 'PRESENT',
         punctuality,
         minutesLate,
         shiftScheduledStart: scheduledStartTime
      });

      res.status(201).json({
         success: true,
         message: isLate 
            ? `Clock-in recorded. Arrived ${minutesLate}m past scheduled start (${scheduledStartTime}).`
            : `Clock-in recorded on time for shift (${scheduledStartTime}).`,
         data: attendance
      });
   } catch (error) {
      console.error('clockIn error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};

// @desc    Clock out employee attendance
// @route   POST /api/staff/attendance/clock-out
// @access  Private (Admin / Sales / Warehouse)
exports.clockOut = async (req, res) => {
   try {
      const employeeId = req.body.employeeId || req.user._id;

      const activeAttendance = await Attendance.findOne({
         employee: employeeId,
         clockOut: { $exists: false }
      }).sort({ clockIn: -1 });

      if (!activeAttendance) {
         return res.status(404).json({ success: false, message: 'No active clock-in session found for employee' });
      }

      const clockOutTime = new Date();
      const durationHours = (clockOutTime - new Date(activeAttendance.clockIn)) / (1000 * 60 * 60);

      activeAttendance.clockOut = clockOutTime;
      activeAttendance.workHours = parseFloat(durationHours.toFixed(2));
      await activeAttendance.save();

      res.status(200).json({
         success: true,
         message: 'Clock-out recorded successfully',
         data: activeAttendance
      });
   } catch (error) {
      console.error('clockOut error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};

// @desc    Get attendance records
// @route   GET /api/staff/attendance
// @access  Private (Admin / Sales / Warehouse)
exports.getAttendance = async (req, res) => {
   try {
      const { employeeId } = req.query;
      const query = {};

      if (employeeId) query.employee = employeeId;

      const records = await Attendance.find(query)
         .populate('employee', 'name email role employeeId')
         .sort({ clockIn: -1 })
         .limit(50);

      // Compute Overall Punctuality Metrics
      const totalSessions = records.length;
      const onTimeSessions = records.filter(r => r.punctuality === 'ON_TIME' || (!r.punctuality && r.status === 'PRESENT')).length;
      const lateSessions = records.filter(r => r.punctuality === 'LATE' || (!r.punctuality && r.status === 'LATE')).length;
      const punctualityScore = totalSessions > 0 ? Math.round((onTimeSessions / totalSessions) * 100) : 100;

      res.status(200).json({
         success: true,
         count: records.length,
         punctualityMetrics: {
            totalSessions,
            onTimeSessions,
            lateSessions,
            punctualityScore
         },
         data: records
      });
   } catch (error) {
      console.error('getAttendance error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};

// @desc    Get employee shift schedules
// @route   GET /api/staff/shifts
// @access  Private (Admin / Sales / Warehouse)
exports.getShifts = async (req, res) => {
   try {
      const { employeeId, status } = req.query;
      const query = {};

      if (employeeId) query.employee = employeeId;
      if (status) query.status = status;

      const shifts = await Shift.find(query)
         .populate('employee', 'name email role employeeId')
         .populate('createdBy', 'name')
         .sort({ date: 1, startTime: 1 });

      res.status(200).json({
         success: true,
         count: shifts.length,
         data: shifts
      });
   } catch (error) {
      console.error('getShifts error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};

// @desc    Schedule employee shift
// @route   POST /api/staff/shifts
// @access  Private (Admin)
exports.createShift = async (req, res) => {
   try {
      const { employeeId, date, startTime, endTime, role, notes } = req.body;

      if (!employeeId || !date || !startTime || !endTime) {
         return res.status(400).json({ success: false, message: 'Employee, date, start time, and end time are required' });
      }

      const employee = await User.findById(employeeId);
      if (!employee) {
         return res.status(404).json({ success: false, message: 'Employee not found' });
      }

      const shift = await Shift.create({
         employee: employee._id,
         date,
         startTime,
         endTime,
         role: role || employee.role.toUpperCase(),
         createdBy: req.user ? req.user._id : null,
         notes: notes || ''
      });

      res.status(201).json({
         success: true,
         message: 'Shift scheduled successfully',
         data: shift
      });
   } catch (error) {
      console.error('createShift error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};

// @desc    Update shift schedule
// @route   PUT /api/staff/shifts/:id
// @access  Private (Admin)
exports.updateShift = async (req, res) => {
   try {
      const shift = await Shift.findById(req.params.id);
      if (!shift) {
         return res.status(404).json({ success: false, message: 'Shift not found' });
      }

      const fields = ['date', 'startTime', 'endTime', 'role', 'status', 'notes'];
      fields.forEach(f => {
         if (req.body[f] !== undefined) shift[f] = req.body[f];
      });

      await shift.save();

      res.status(200).json({
         success: true,
         message: 'Shift schedule updated',
         data: shift
      });
   } catch (error) {
      console.error('updateShift error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};

// MAHATHIR: Staff Performance & Sales Attribution Leaderboard
// @desc    Get staff sales attribution and cashier performance leaderboard
// @route   GET /api/staff/leaderboard
// @access  Private (Admin / Sales)
exports.getStaffLeaderboard = async (req, res) => {
   try {
      const Order = require('../models/Order');

      const staffList = await User.find({ role: { $in: ['admin', 'sales', 'warehouse'] } })
         .select('name email role employeeId phone')
         .lean();

      // Aggregate all paid orders (POS + Online) by cashier or processed user
      const salesAgg = await Order.aggregate([
         { $match: { isPaid: true, status: { $ne: 'cancelled' } } },
         {
            $group: {
               _id: '$cashierId',
               totalRevenue: { $sum: '$totalPrice' },
               ordersCount: { $sum: 1 },
               itemsSold: { $sum: { $size: '$orderItems' } }
            }
         }
      ]);

      const salesMap = {};
      salesAgg.forEach(s => {
         if (s._id) salesMap[s._id.toString()] = s;
      });

      // Also compute unassigned/direct online sales
      const unassignedStats = salesAgg.find(s => !s._id) || { totalRevenue: 0, ordersCount: 0, itemsSold: 0 };

      // Map metrics for every staff member
      let leaderboard = staffList.map(staff => {
         const stats = salesMap[staff._id.toString()] || { totalRevenue: 0, ordersCount: 0, itemsSold: 0 };
         const aov = stats.ordersCount > 0 ? Math.round(stats.totalRevenue / stats.ordersCount) : 0;

         let tier = 'Bronze';
         let rating = 3.5;
         if (stats.totalRevenue > 150000 || stats.ordersCount >= 15) {
            tier = 'Platinum';
            rating = 5.0;
         } else if (stats.totalRevenue > 50000 || stats.ordersCount >= 8) {
            tier = 'Gold';
            rating = 4.8;
         } else if (stats.totalRevenue > 15000 || stats.ordersCount >= 3) {
            tier = 'Silver';
            rating = 4.2;
         }

         return {
            staffId: staff._id,
            id: staff._id,
            name: staff.name,
            email: staff.email,
            role: staff.role,
            phone: staff.phone || 'N/A',
            employeeId: staff.employeeId || 'STF-' + staff._id.toString().slice(-4).toUpperCase(),
            totalRevenue: stats.totalRevenue || 0,
            totalSales: stats.totalRevenue || 0,
            ordersCount: stats.ordersCount || 0,
            itemsSold: stats.itemsSold || 0,
            aov: aov || 0,
            tier,
            performanceTier: tier,
            rating
         };
      }).sort((a, b) => (b.totalSales - a.totalSales) || (b.ordersCount - a.ordersCount));

      // Assign ranks 1, 2, 3...
      leaderboard = leaderboard.map((s, idx) => ({ ...s, rank: idx + 1 }));

      const totalAttributedRevenue = leaderboard.reduce((acc, curr) => acc + (curr.totalSales || 0), 0);
      const totalOrdersProcessed = leaderboard.reduce((acc, curr) => acc + (curr.ordersCount || 0), 0);

      res.status(200).json({
         success: true,
         count: leaderboard.length,
         data: {
            leaderboard,
            summary: {
               totalStaff: staffList.length,
               activeStaffCount: staffList.length,
               activeCashiers: leaderboard.filter(s => s.ordersCount > 0).length,
               topPerformer: leaderboard[0]?.name || 'N/A',
               topPerformerObj: leaderboard[0] || null,
               totalAttributedRevenue,
               totalOrdersProcessed,
               onlineUnassignedRevenue: unassignedStats.totalRevenue || 0
            }
         }
      });
   } catch (error) {
      console.error('getStaffLeaderboard error:', error);
      res.status(500).json({ success: false, message: error.message });
   }
};
