const express = require('express');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const mockTracking = require('../services/mockTrackingService');
const router = express.Router();

// POST /api/fleet/mock-tracking/start — company_admin only
router.post('/mock-tracking/start', protect, restrictTo('company_admin'), async (req, res, next) => {
    try {
        const result = await mockTracking.start(req.user.companyId);
        res.status(200).json({ success: true, ...result });
    } catch (err) {
        next(err);
    }
});

// POST /api/fleet/mock-tracking/stop — company_admin only
router.post('/mock-tracking/stop', protect, restrictTo('company_admin'), async (req, res, next) => {
    try {
        const result = await mockTracking.stop();
        res.status(200).json({ success: true, ...result });
    } catch (err) {
        next(err);
    }
});

module.exports = router;