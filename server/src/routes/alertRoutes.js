const express = require('express');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const {
  sendAlert,
  getAlerts,
  acknowledgeAlert,
  respondToAlert,
} = require('../controllers/alertController');

const router = express.Router();

// All alert endpoints are for company admins (they manage the fleet)
router.use(protect, restrictTo('company_admin'));

router.post('/', sendAlert);
router.get('/', getAlerts);
router.patch('/:id/acknowledge', acknowledgeAlert);
router.post('/:id/respond', respondToAlert);

module.exports = router;