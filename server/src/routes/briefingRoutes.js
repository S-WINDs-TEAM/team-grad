const express = require('express');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const { buildDailyBriefing } = require('../services/briefingService');
const router = express.Router();

// GET /api/briefing — company_admin only
router.get('/', protect, restrictTo('company_admin'), async (req, res, next) => {
    try {
        const briefing = await buildDailyBriefing(req.user.companyId);
        res.status(200).json({ success: true, briefing });
    } catch (err) {
        next(err);
    }
});

module.exports = router;