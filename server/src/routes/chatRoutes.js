const express = require('express');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const { sendMessage, getThreads, getThread, getMyThread } = require('../controllers/chatController');
const router = express.Router();

router.use(protect);

router.post('/send', sendMessage);
router.get('/threads', restrictTo('company_admin'), getThreads);
router.get('/thread/me', restrictTo('company_driver'), getMyThread);
router.get('/thread/:driverId', getThread);

module.exports = router;