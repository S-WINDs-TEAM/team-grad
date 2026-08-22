const User = require('../models/User');
const FleetVehicle = require('../models/FleetVehicle');
const Trip = require('../models/Trip');
const { getDriverDrivenHoursToday } = require('../services/fatigueService');
const { OPERATIONAL_STATUS, WORK_STATUS, OVER_TRIP_HOURS } = require('../utils/fleetConstants');

const dayBounds = () => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);
    return { start, end };
};

// ---- Vehicles (paginated + filters) ----
const getVehicles = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;
        const q = { companyId: req.user.companyId };
        if (status && Object.values(OPERATIONAL_STATUS).includes(status)) q.operationalStatus = status;
        if (search) q.plateNumber = { $regex: search, $options: 'i' };

        const total = await FleetVehicle.countDocuments(q);
        const vehicles = await FleetVehicle.find(q)
            .populate('driverId', 'name email workStatus')
            .sort({ updatedAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const { start, end } = dayBounds();
        const enriched = await Promise.all(vehicles.map(async (v) => {
            const trip = await Trip.findOne({ vehicleId: v._id, departureTime: { $gte: start, $lte: end } })
                .sort({ departureTime: 1 })
                .select('origin destination departureTime overallRiskLevel totalDistanceKm totalDurationMin status')
                .lean();
            const displayStatus = v.operationalStatus !== OPERATIONAL_STATUS.AVAILABLE
                ? v.operationalStatus
                : (trip ? 'on_trip' : 'idle');
            return { ...v.toObject(), todayTrip: trip, displayStatus };
        }));

        res.status(200).json({
            success: true,
            vehicles: enriched,
            pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
        });
    } catch (err) { next(err); }
};

const updateVehicleStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { operationalStatus } = req.body;
        if (!Object.values(OPERATIONAL_STATUS).includes(operationalStatus)) {
            return res.status(400).json({ success: false, msg: 'invalid operational status' });
        }
        const vehicle = await FleetVehicle.findOneAndUpdate(
            { _id: id, companyId: req.user.companyId },
            { operationalStatus },
            { new: true },
        );
        if (!vehicle) return res.status(404).json({ success: false, msg: 'vehicle not found in your company' });
        res.status(200).json({ success: true, vehicle });
    } catch (err) { next(err); }
};

// Soft delete (retire) by default; hard delete only if the vehicle has no trip history.
const deleteVehicle = async (req, res, next) => {
    try {
        const { id } = req.params;
        const hard = req.query.hard === 'true';
        const vehicle = await FleetVehicle.findOne({ _id: id, companyId: req.user.companyId });
        if (!vehicle) return res.status(404).json({ success: false, msg: 'vehicle not found in your company' });

        const tripCount = await Trip.countDocuments({ vehicleId: id });
        if (hard) {
            if (tripCount > 0) {
                return res.status(409).json({ success: false, msg: 'cannot permanently delete a vehicle with trip history — it will be retired instead' });
            }
            await FleetVehicle.findByIdAndDelete(id);
            return res.status(200).json({ success: true, msg: 'vehicle permanently deleted' });
        }
        vehicle.operationalStatus = OPERATIONAL_STATUS.RETIRED;
        vehicle.driverId = null;
        await vehicle.save();
        res.status(200).json({ success: true, msg: 'vehicle retired', vehicle });
    } catch (err) { next(err); }
};

// ---- Drivers (paginated + filters + fatigue) ----
const getDriversList = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;
        const q = { role: 'company_driver', companyId: req.user.companyId };
        if (status && Object.values(WORK_STATUS).includes(status)) q.workStatus = status;
        if (search) q.name = { $regex: search, $options: 'i' };

        const total = await User.countDocuments(q);
        const drivers = await User.find(q)
            .select('name email accountStatus workStatus mobile breakOverruns currentBreak createdAt')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const enriched = await Promise.all(drivers.map(async (d) => {
            const hoursDriven = await getDriverDrivenHoursToday(d._id);
            const vehicle = await FleetVehicle.findOne({ driverId: d._id }).select('plateNumber operationalStatus');
            return {
                ...d.toObject(),
                hoursDriven,
                overTrip: hoursDriven >= OVER_TRIP_HOURS,
                vehicle: vehicle ? { plateNumber: vehicle.plateNumber, operationalStatus: vehicle.operationalStatus } : null,
            };
        }));

        res.status(200).json({
            success: true,
            drivers: enriched,
            pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
        });
    } catch (err) { next(err); }
};

const updateDriverWorkStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { workStatus } = req.body;
        if (!Object.values(WORK_STATUS).includes(workStatus)) {
            return res.status(400).json({ success: false, msg: 'invalid work status' });
        }
        const driver = await User.findOneAndUpdate(
            { _id: id, role: 'company_driver', companyId: req.user.companyId },
            { workStatus },
            { new: true },
        ).select('name email workStatus');
        if (!driver) return res.status(404).json({ success: false, msg: 'driver not found in your company' });
        res.status(200).json({ success: true, driver });
    } catch (err) { next(err); }
};

// Soft delete (deactivate) by default; hard delete only if no trip history.
const deleteDriver = async (req, res, next) => {
    try {
        const { id } = req.params;
        const hard = req.query.hard === 'true';
        const driver = await User.findOne({ _id: id, role: 'company_driver', companyId: req.user.companyId });
        if (!driver) return res.status(404).json({ success: false, msg: 'driver not found in your company' });

        const tripCount = await Trip.countDocuments({ userId: id });
        if (hard) {
            if (tripCount > 0) {
                return res.status(409).json({ success: false, msg: 'cannot permanently delete a driver with trip history — they will be deactivated instead' });
            }
            await FleetVehicle.updateOne({ driverId: id }, { $set: { driverId: null } });
            await User.findByIdAndDelete(id);
            return res.status(200).json({ success: true, msg: 'driver permanently deleted' });
        }
        driver.workStatus = WORK_STATUS.DEACTIVATED;
        await driver.save();
        await FleetVehicle.updateOne({ driverId: id }, { $set: { driverId: null } });
        res.status(200).json({ success: true, msg: 'driver deactivated', driver: { id: driver._id, name: driver.name, workStatus: driver.workStatus } });
    } catch (err) { next(err); }
};

// ---- Assign / Unassign driver ----
const assignDriver = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { driverId } = req.body;
        const vehicle = await FleetVehicle.findOne({ _id: id, companyId: req.user.companyId });
        if (!vehicle) return res.status(404).json({ success: false, msg: 'vehicle not found in your company' });

        if (driverId) {
            const driver = await User.findOne({ _id: driverId, role: 'company_driver', companyId: req.user.companyId });
            if (!driver) return res.status(404).json({ success: false, msg: 'driver not found in your company' });
            if (driver.workStatus === WORK_STATUS.DEACTIVATED) {
                return res.status(409).json({ success: false, msg: 'cannot assign a deactivated driver' });
            }
            // Move the driver off any other vehicle first.
            await FleetVehicle.updateOne(
                { driverId, companyId: req.user.companyId, _id: { $ne: vehicle._id } },
                { $set: { driverId: null } },
            );
        }
        vehicle.driverId = driverId || null;
        await vehicle.save();
        const populated = await vehicle.populate('driverId', 'name email workStatus');
        res.status(200).json({ success: true, vehicle: populated });
    } catch (err) { next(err); }
};

const unassignDriver = async (req, res, next) => {
    try {
        const { id } = req.params;
        const vehicle = await FleetVehicle.findOneAndUpdate(
            { _id: id, companyId: req.user.companyId },
            { driverId: null },
            { new: true },
        );
        if (!vehicle) return res.status(404).json({ success: false, msg: 'vehicle not found in your company' });
        res.status(200).json({ success: true, vehicle });
    } catch (err) { next(err); }
};

// ---- Driver's own trip today (for the driver page map) ----
const getMyTrip = async (req, res, next) => {
    try {
        const vehicle = await FleetVehicle.findOne({ driverId: req.user._id });
        if (!vehicle) return res.status(200).json({ success: true, trip: null, vehicleId: null, msg: 'no vehicle assigned to you yet' });

        const { start, end } = dayBounds();
        const trip = await Trip.findOne({ vehicleId: vehicle._id, departureTime: { $gte: start, $lte: end } })
            .sort({ departureTime: 1 })
            .lean();
        res.status(200).json({ success: true, trip, vehicleId: vehicle._id });
    } catch (err) { next(err); }
};

module.exports = {
    getVehicles, updateVehicleStatus, deleteVehicle,
    getDriversList, updateDriverWorkStatus, deleteDriver,
    assignDriver, unassignDriver, getMyTrip,
};