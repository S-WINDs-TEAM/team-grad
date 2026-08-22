const express = require('express');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const { setHazardZone, clearHazardZone, getHazardZone } = require('../services/simulationService');
const router = express.Router();

router.use(protect, restrictTo('company_admin'));

router.post('/hazard/on', (req, res) => {
    const { fromKm = 40, toKm = 60 } = req.body;
    setHazardZone(Number(fromKm), Number(toKm));
    res.status(200).json({ success: true, hazardZone: getHazardZone(), msg: 'hazard simulation enabled' });
});

router.post('/hazard/off', (req, res) => {
    clearHazardZone();
    res.status(200).json({ success: true, hazardZone: null, msg: 'hazard simulation disabled — back to real weather' });
});

router.get('/status', (req, res) => {
    res.status(200).json({ success: true, hazardZone: getHazardZone() });
});

module.exports = router;