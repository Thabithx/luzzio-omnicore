const Settings = require('../models/Settings');

// @desc    Get global settings
// @route   GET /api/settings
// @access  Public
exports.getSettings = async (req, res) => {
   try {
      let settings = await Settings.findOne();

      // If no settings exist, create default
      if (!settings) {
         settings = await Settings.create({});
      }

      res.status(200).json({
         success: true,
         data: settings
      });
   } catch (err) {
      res.status(500).json({
         success: false,
         message: err.message
      });
   }
};

// @desc    Update global settings
// @route   PUT /api/settings
// @access  Private/Admin
exports.updateSettings = async (req, res) => {
   try {
      let settings = await Settings.findOne();

      if (!settings) {
         settings = await Settings.create(req.body);
      } else {
         settings = await Settings.findOneAndUpdate({}, req.body, {
            new: true,
            runValidators: true
         });
      }

      res.status(200).json({
         success: true,
         data: settings
      });
   } catch (err) {
      res.status(400).json({
         success: false,
         message: err.message
      });
   }
};
