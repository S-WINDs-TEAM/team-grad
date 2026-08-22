const express = require('express');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const {
    createBreakRequest, createRouteRequest, createTripRequest,
    decideRequest, getInbox, getUnreadCount, markRead,
} = require('../controllers/requestController');
const router = express.Router();

router.use(protect);

router.post('/break', restrictTo('company_driver'), createBreakRequest);
router.post('/route', restrictTo('company_driver'), createRouteRequest);
router.post('/trip', restrictTo('company_driver'), createTripRequest);
router.get('/inbox', getInbox);
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read', markRead);
router.patch('/:id/decide', restrictTo('company_admin'), decideRequest);

module.exports = router;