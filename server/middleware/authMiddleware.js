const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isDevStore } = require('../config/database');

const protect = async (req, res, next) => {
   let token;

   if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
   ) {
      try {
         // Get token from header
         token = req.headers.authorization.split(' ')[1];

         // Verify token
         const decoded = jwt.verify(token, process.env.JWT_SECRET);

         // Get user from the token (mock user bypass for local dev fallback)
         if (isDevStore() && decoded.id === '600000000000000000000001') {
            req.user = {
               _id: '600000000000000000000001',
               id: '600000000000000000000001',
               name: 'Dev Admin',
               email: 'admin@luzzio.com',
               role: 'admin'
            };
         } else {
            req.user = await User.findById(decoded.id).select('-password');
         }

         if (!req.user) {
            throw new Error('User not found');
         }

         next();
      } catch (error) {
         console.error('Auth protect error:', error);

         // If it's a database connection error, return 503
         if (error.name === 'MongooseServerSelectionError' || error.message.includes('ENOTFOUND') || error.message.includes('buffering timed out')) {
            return res.status(503).json({
               success: false,
               message: 'Database connection failed. Please check your internet or database status.',
               error: error.message
            });
         }

         res.status(401).json({
            success: false,
            message: 'Not authorized, token failed',
            error: error.message
         });
      }
   }

   if (!token) {
      res.status(401).json({ success: false, message: 'Not authorized, no token' });
   }
};

const admin = (req, res, next) => {
   if (req.user && req.user.role === 'admin') {
      next();
   } else {
      res.status(401).json({ success: false, message: 'Not authorized as an admin' });
   }
};

// BIHANDU: Role-based authorization middleware
const authorize = (...roles) => {
   return (req, res, next) => {
      if (!req.user) {
         return res.status(401).json({ success: false, message: 'Not authorized, user missing' });
      }

      // Admin has blanket access to all operational routes
      if (req.user.role === 'admin' || roles.includes(req.user.role)) {
         return next();
      }

      return res.status(403).json({
         success: false,
         message: `User role '${req.user.role}' is not authorized to perform this action`
      });
   };
};

const optionalProtect = async (req, res, next) => {
   let token;

   if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
   ) {
      try {
         token = req.headers.authorization.split(' ')[1];
         const decoded = jwt.verify(token, process.env.JWT_SECRET);
         if (isDevStore() && decoded.id === '600000000000000000000001') {
            req.user = {
               _id: '600000000000000000000001',
               id: '600000000000000000000001',
               name: 'Dev Admin',
               email: 'admin@luzzio.com',
               role: 'admin'
            };
         } else {
            req.user = await User.findById(decoded.id).select('-password');
         }
      } catch (error) {
         console.error('Optional auth error:', error);
      }
   }
   next();
};

module.exports = { protect, admin, authorize, optionalProtect };
