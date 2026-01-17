const express = require('express');
const { createFadarParcel, testConnection } = require('../controllers/fadarController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/create-parcel', protect, admin, createFadarParcel);
router.post('/test-connection', protect, admin, testConnection);

module.exports = router;
