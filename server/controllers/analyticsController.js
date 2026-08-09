const Visit = require('../models/Visit');
const { isDevStore } = require('../config/database');

// @desc    Log a new visit
// @route   POST /api/analytics/log-visit
// @access  Public
exports.logVisit = async (req, res) => {
   try {
      if (isDevStore()) {
         return res.status(200).json({ success: true, source: 'dev-store' });
      }

      const { path } = req.body;
      const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
      const userAgent = req.headers['user-agent'];

      // Don't log admin paths or developer environment calls if already handled by CORS/Auth
      if (path && !path.startsWith('/admin')) {
         await Visit.create({
            ip,
            userAgent,
            path: path || '/'
         });
      }

      res.status(200).json({ success: true });
   } catch (err) {
      console.error('Error logging visit:', err);
      // Fail silently to not disrupt user experience
      res.status(200).json({ success: true });
   }
};
