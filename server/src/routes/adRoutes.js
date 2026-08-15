const express = require('express');
const { getRecommendations } = require('../controllers/adController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// available to any logged-in user (individual, company_admin, company_driver)
router.get('/recommendations', protect, getRecommendations);

module.exports = router;