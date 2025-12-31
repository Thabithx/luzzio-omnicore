const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinaryConfig');
const { protect } = require('../middleware/authMiddleware');

// Middleware to restrict access to admins only
const admin = (req, res, next) => {
   if (req.user && req.user.role === 'admin') {
      next();
   } else {
      res.status(401).json({ success: false, message: 'Not authorized as an admin' });
   }
};

// Route for multiple images upload (max 10)
router.post('/', protect, admin, (req, res) => {
   upload.array('images', 10)(req, res, (err) => {
      if (err) {
         console.error('Multer upload error:', err);
         return res.status(500).json({
            success: false,
            message: err.message || 'Error during file upload process'
         });
      }

      if (!req.files || req.files.length === 0) {
         return res.status(400).json({ success: false, message: 'No files uploaded' });
      }

      const uploadedFiles = req.files.map(file => ({
         url: file.path,
         public_id: file.filename
      }));

      res.status(200).json({
         success: true,
         files: uploadedFiles
      });
   });
});

module.exports = router;
