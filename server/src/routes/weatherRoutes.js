const express = require('express');
const { getCurrentWeather } = require('../controllers/weatherController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// NEW: Get weather for a specific location (used for local weather widget)
router.get('/current', protect, getCurrentWeather);

module.exports = router;