const express = require('express');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const {
    getVehicles, updateVehicleStatus, deleteVehicle,
    getDriversList, updateDriverWorkStatus, deleteDriver,
    assignDriver, unassignDriver, getMyTrip, approveAlternate,
    rebuildTripWaypoints,
} = require('../controllers/fleetAdminController');
const router = express.Router();

router.use(protect);

router.get('/vehicles', restrictTo('company_admin'), getVehicles);
router.patch('/vehicles/:id/status', restrictTo('company_admin'), updateVehicleStatus);
router.put('/vehicles/:id/assign', restrictTo('company_admin'), assignDriver);
router.put('/vehicles/:id/unassign', restrictTo('company_admin'), unassignDriver);
router.delete('/vehicles/:id', restrictTo('company_admin'), deleteVehicle);

router.get('/drivers', restrictTo('company_admin'), getDriversList);
router.patch('/drivers/:id/work-status', restrictTo('company_admin'), updateDriverWorkStatus);
router.delete('/drivers/:id', restrictTo('company_admin'), deleteDriver);

router.get('/my-trip', restrictTo('company_driver'), getMyTrip);
router.patch('/alerts/:alertId/approve-alternate', restrictTo('company_admin'), approveAlternate);
router.post('/trips/:tripId/rebuild-waypoints', restrictTo('company_admin'), rebuildTripWaypoints);
module.exports = router;