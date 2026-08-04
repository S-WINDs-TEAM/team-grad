const express = require('express');
<<<<<<< HEAD
const {planRoute, getTripHistory, getTripById}= require('../controllers/routeController');
const {protect}= require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMIddleware');
const {planRouteSchema} = require('../utils/validators');
=======
const {planRoute, getSmartDeparture, getTripHistory, getTripById}= require('../controllers/routeController');
const {protect}= require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMIddleware');
const {planRouteSchema, smartDepartureSchema} = require('../utils/validators');
>>>>>>> origin/ElSayed

const router = express.Router();

router.post('/plan', protect, validate(planRouteSchema), planRoute);
<<<<<<< HEAD
=======
router.post('/smart-departure', protect, validate(smartDepartureSchema), getSmartDeparture);
>>>>>>> origin/ElSayed
router.get('/history', protect, getTripHistory);
router.get('/:tripId', protect, getTripById);

module.exports = router;