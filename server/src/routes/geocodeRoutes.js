const express = require('express');
const { search } = require('../controllers/geocodeController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/search', protect, search);

module.exports = router;