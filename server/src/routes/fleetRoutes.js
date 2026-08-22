const express = require('express');
const { 
    inviteDriver,
    addVehicle,
    getFleetStatus,
    getMyVehicleStatus,
    sendAlert,
    uploadVehiclePhoto,
    getDrivers,
    getFleetDashboard,
    assignDriver
} = require('../controllers/fleetController');

const { protect, restrictTo } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMIddleware');
const { inviteDriverSchema, addVehicleSchema, sendAlertSchema } = require('../utils/validators');
const upload = require('../middlewares/uploadMiddleware');

const router = express.Router();

// company_admin only
router.post('/drivers/invite', protect, restrictTo('company_admin'), validate(inviteDriverSchema), inviteDriver);
router.get('/drivers', protect, restrictTo('company_admin'), getDrivers);
router.post('/vehicles', protect, restrictTo('company_admin'), validate(addVehicleSchema), addVehicle);
router.post('/vehicles/:vehicleId/photo', protect, restrictTo('company_admin'), upload.single('photo'), uploadVehiclePhoto);
router.get('/status', protect, restrictTo('company_admin'), getFleetStatus);
router.put('/vehicles/:vehicleId/assign', protect, restrictTo('company_admin'), assignDriver);
router.get('/dashboard', protect, restrictTo('company_admin'), getFleetDashboard);

router.post('/alert', protect, restrictTo('company_admin'), validate(sendAlertSchema), sendAlert )
// company_driver only
router.get('/my-vehicle', protect, restrictTo('company_driver'), getMyVehicleStatus);

// Task 4 (Socket.io) will add: POST /alert (company_admin -> broadcast to drivers)

module.exports = router;