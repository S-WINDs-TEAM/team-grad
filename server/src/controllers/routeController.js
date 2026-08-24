const Trip = require('../models/Trip');
const FleetVehicle = require('../models/FleetVehicle');
const User = require('../models/User');
const { getRouteAndWaypoints, computeWaypointsForDeparture } = require('../services/routPlanningService');
const { calculateLocalAlternate } = require('../services/mapService');
const { captureCircleFromWaypoints } = require('../services/simulationService');
const Alert = require('../models/Alert');
const { getIO } = require('../socket/socketManager');
const { evaluateFatigue } = require('../services/fatigueService');
const { checkCargo } = require('../services/cargoService');
const { notify } = require('../services/notificationService');
const { computeAlternateCandidates, applyAlternate } = require('../services/alternateService');
// ================================================================
// Plan Route (Unit 1/2 fields + alternate route + manager notification)
// ================================================================
const planRoute = async (req, res, next) => {
    try {
        const { origin, destination, vehicleType, departureTime, vehicleId, cargoType } = req.body;
        const departure = departureTime ? new Date(departureTime) : new Date();
        const vType = vehicleType || 'car';
        const vehicleHeight = req.user?.vehicleHeight || 'medium';

        const { rawWaypoints, routePolyline, route } = await getRouteAndWaypoints(origin, destination);
        const { waypointsWithWeather, fullWaypoints, overallRisk, totalDurationMin } =
                await computeWaypointsForDeparture(rawWaypoints, vType, departure);

        captureCircleFromWaypoints(fullWaypoints);
        // Unit 2: Cargo sensitivity — one alert per risk type
        const cargo = cargoType || 'general';
        const cargoAlerts = [];
        const seenAlerts = new Set();
        fullWaypoints.forEach((wp) => {
            checkCargo(cargo, wp.weather).forEach((a) => {
                if (!seenAlerts.has(a.type)) {
                    seenAlerts.add(a.type);
                    cargoAlerts.push({ type: a.type, message: a.message });
                }
            });
        });

        // Unit 2: Fatigue — evaluate the actual driver of the vehicle (or the planner)
        let driverIdForFatigue = req.user._id;
        if (vehicleId) {
            const veh = await FleetVehicle.findById(vehicleId).select('driverId');
            if (veh && veh.driverId) driverIdForFatigue = veh.driverId;
        }
        const fatigueInfo = await evaluateFatigue(driverIdForFatigue, totalDurationMin);

        // Overall composite score = average of waypoint scores
        const riskScore = Math.round(
            fullWaypoints.reduce((s, w) => s + (w.riskScore || 0), 0) / (fullWaypoints.length || 1)
        );

        const trip = await Trip.create({
            userId: req.user._id,
            vehicleId: vehicleId || null,
            origin,
            destination,
            vehicleType: vType,
            vehicleHeight,
            cargoType: cargo,
            departureTime: departure,
            totalDistanceKm: route.distanceKm,
            totalDurationMin,
            waypoints: fullWaypoints,
            routePolyline,
            overallRiskLevel: overallRisk,
            riskScore,
            fatigueInfo,
            cargoAlerts: cargoAlerts.slice(0, 10),
        });

        // High-risk waypoint → alert + local alternate route
        const highRiskWaypoint = fullWaypoints.find(wp => wp.weather.riskLevel === 'high');
        let alertId = null;
        let alternateRouteData = null;

        if (highRiskWaypoint) {
            let vehicleIdForAlert = req.user?.vehicleId || null;
            if (!vehicleIdForAlert) {
                const vehicle = await FleetVehicle.findOne({ driverId: req.user._id });
                vehicleIdForAlert = vehicle?._id || null;
            }

            const dangerWp = {
                lat: highRiskWaypoint.location.lat,
                lng: highRiskWaypoint.location.lng,
            };
            const alternate = await calculateLocalAlternate(origin, destination, dangerWp, 10);

            const currentRouteSummary = {
                polyline: routePolyline,
                distanceKm: route.distanceKm,
                durationMin: totalDurationMin,
                riskLevel: overallRisk,
            };
            const proposedRouteSummary = {
                polyline: alternate.polyline,
                distanceKm: alternate.distanceKm,
                durationMin: alternate.durationMin,
                riskLevel: 'low',
            };
            const timeSaved = Math.round(currentRouteSummary.durationMin - proposedRouteSummary.durationMin);
            const distanceDiff = Math.round((proposedRouteSummary.distanceKm - currentRouteSummary.distanceKm) * 10) / 10;
            const waypointIndex = fullWaypoints.findIndex(
                wp => wp.location.lat === highRiskWaypoint.location.lat &&
                      wp.location.lng === highRiskWaypoint.location.lng
            );
            // Context so the manager knows WHICH vehicle/driver/route instantly
            let ctxVehicle = null;
            if (vehicleIdForAlert) {
                ctxVehicle = await FleetVehicle.findById(vehicleIdForAlert).populate('driverId', 'name');
            }
            const context = {
                plateNumber: ctxVehicle?.plateNumber || null,
                driverName: ctxVehicle?.driverId?.name || req.user.name,
                routeLine: `${origin.address || 'Origin'} → ${destination.address || 'Destination'}`,
            };

            const alert = await Alert.create({
                companyId: req.user.companyId || null,
                vehicleId: vehicleIdForAlert,
                driverId: req.user._id,
                category: 'communication',
                type: 'route_change_request',
                severity: 'high',
                message: `Weather hazard detected near KM ${Math.round(highRiskWaypoint.distanceFromStart)}. Alternate route available.`,
                details: {
                    lat: highRiskWaypoint.location.lat,
                    lng: highRiskWaypoint.location.lng,
                    waypointIndex,
                    tripId: trip._id,
                    context,     
                    currentRoute: currentRouteSummary,
                    proposedRoute: proposedRouteSummary,
                    difference: { timeSavedMin: timeSaved, distanceSavedKm: distanceDiff },
                },
                status: 'pending',
                read: false,
            });

            alertId = alert._id;
            alternateRouteData = {
                polyline: alternate.polyline,
                waypoints: alternate.coordinates.map(([lng, lat]) => ({ location: { lat, lng } })),
                totalDistanceKm: alternate.distanceKm,
                totalDurationMin: alternate.durationMin,
                overallRiskLevel: 'low',
            };

            let io;
            try {
                io = getIO();
            } catch (err) {
                console.warn('Socket.io not initialized, skipping real-time alerts.');
            }
            if (io) {
                if (req.user.companyId) {
                    io.to(`company:${req.user.companyId}`).emit('fleet:alert', alert);
                }
                io.to(`driver:${req.user._id}`).emit('driver:alert', alert);
            }

            // FIXED (كان خارج الـ if فبيكرش على الرحلات الآمنة):
            // Fleet trips → actionable notification for the manager, so they can
            // switch the trip to the alternate from the bell.
            if (req.user.companyId) {
                const managers = await User.find({ role: 'company_admin', companyId: req.user.companyId }).select('_id');
                for (const m of managers) {
                    await notify({
                        companyId: req.user.companyId,
                        recipientId: m._id,
                        senderId: req.user._id,
                        category: 'route_request',
                        title: 'Hazard on planned route',
                        message: `Weather hazard near KM ${Math.round(highRiskWaypoint.distanceFromStart)}. Alternate route saves ${timeSaved} min (${distanceDiff > 0 ? '+' : ''}${distanceDiff} km).`,
                        relatedModel: 'Trip',
                        relatedId: trip._id,
                        status: 'pending',
                        actionRequired: true,
                        metadata: { tripId: trip._id, alternateRoute: alternateRouteData, context, reason: 'auto-detected hazard' },
                    });
                }
            }
        }

        // Response (30km display + 5km full + Unit 2 fields)
        const response = {
            success: true,
            trip: {
                id: trip._id,
                totalDistanceKm: route.distanceKm,
                totalDurationMin,
                overallRiskLevel: overallRisk,
                waypoints: waypointsWithWeather,
                detailedWaypoints: fullWaypoints,
                routePolyline,
                roadMaxSpeed: route.roadMaxSpeed || 120,
                cargoType: cargo,
                cargoAlerts: cargoAlerts.slice(0, 10),
                fatigueInfo,
                riskScore,
                urbanExitInfo: {
                    totalUrbanMinutes: 0,
                    exitTimeMinutes: 0,
                    totalHighwayMinutes: 0,
                },
            },
        };
        if (alertId) {
            response.alertId = alertId;
            response.alternateRoute = alternateRouteData;
        }
        res.status(200).json(response);
    } catch (err) {
        console.error("Failed URL:", err.config?.url || err.response?.config?.url);
        console.error("Status Code:", err.response?.status);
        next(err);
    }
};

// ================================================================
// Smart Departure
// ================================================================
const getSmartDeparture = async (req, res, next) => {
    try {
        const { origin, destination, vehicleType, windowHours, departureTime, intervalMinutes } = req.body;
        const vtype = vehicleType || 'car';
        const windowStart = departureTime ? new Date(departureTime) : new Date();
        const stepMinutes = intervalMinutes || 60;
        const totalWindowMinutes = (windowHours || 6) * 60;

        const { rawWaypoints } = await getRouteAndWaypoints(origin, destination);

        const candidateTimes = [];
        for (let offset = 0; offset <= totalWindowMinutes; offset += stepMinutes) {
            candidateTimes.push(new Date(windowStart.getTime() + offset * 60 * 1000));
        }

        const suggestions = [];
        for (const candidateDeparture of candidateTimes) {
            const { overallRisk, avgRiskScore, totalDurationMin, arrivalTime } =
                await computeWaypointsForDeparture(rawWaypoints, vtype, candidateDeparture);
            suggestions.push({
                departureTime: candidateDeparture,
                arrivalTime,
                totalDurationMin,
                overallRisk,
                avgRiskScore,
            });
        }

        suggestions.sort((a, b) => {
            if (a.avgRiskScore !== b.avgRiskScore) return a.avgRiskScore - b.avgRiskScore;
            return a.totalDurationMin - b.totalDurationMin;
        });

        const riskSummary = {
            low: 'Good conditions for travel.',
            medium: 'Moderate weather risk — drive with caution.',
            high: 'High weather risk — consider a different departure time.',
        };

        const rankedSuggestions = suggestions.map((s, index) => ({
            ...s,
            isBest: index === 0,
            summary: riskSummary[s.overallRisk],
        }));

        res.status(200).json({ success: true, suggestions: rankedSuggestions });
    } catch (err) {
        console.error("Smart Departure Error:", err.message);
        next(err);
    }
};

// ================================================================
// Trip History: role-based filtering + real pagination
// ================================================================
const getTripHistory = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);
        const skip = (page - 1) * limit;

        let filter = {};
        if (req.user.role === 'company_admin' && req.user.companyId) {
            const vehicles = await FleetVehicle.find({ companyId: req.user.companyId }).select('_id').lean();
            const vehicleIds = vehicles.map(v => v._id);
            filter = {
                $or: [
                    { userId: req.user._id },
                    ...(vehicleIds.length > 0 ? [{ vehicleId: { $in: vehicleIds } }] : [])
                ]
            };
        } else {
            filter = { userId: req.user._id };
        }

        const totalTrips = await Trip.countDocuments(filter);
        const trips = await Trip.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-waypoints -routePolyline')
            .populate('vehicleId', 'plateNumber vehicleType')
            .lean();

        res.status(200).json({
            success: true,
            trips,
            pagination: {
                total: totalTrips,
                page,
                limit,
                pages: Math.ceil(totalTrips / limit)
            }
        });
    } catch (err) {
        console.error('Get Trip History Error:', err.message);
        next(err);
    }
};

// ================================================================
// Get Trip By ID: full details + linked vehicle (Fleet Mode card)
// ================================================================
const getTripById = async (req, res, next) => {
    try {
        const { tripId } = req.params;
        let query;

        if (req.user.role === 'company_admin' && req.user.companyId) {
            const vehicles = await FleetVehicle.find({ companyId: req.user.companyId }).select('_id').lean();
            const vehicleIds = vehicles.map(v => v._id);
            query = {
                _id: tripId,
                $or: [
                    { userId: req.user._id },
                    ...(vehicleIds.length > 0 ? [{ vehicleId: { $in: vehicleIds } }] : [])
                ]
            };
        } else {
            query = { _id: tripId, userId: req.user._id };
        }

        const trip = await Trip.findOne(query)
            .populate({
                path: 'vehicleId',
                populate: { path: 'driverId', select: 'name email' },
            });

        if (!trip) {
            return res.status(404).json({ msg: 'trip not found', success: false });
        }

        res.status(200).json({
            success: true,
            trip: {
                id: trip._id,
                origin: trip.origin,
                destination: trip.destination,
                departureTime: trip.departureTime,
                status: trip.status,
                cargoType: trip.cargoType,
                cargoAlerts: trip.cargoAlerts,
                fatigueInfo: trip.fatigueInfo,
                riskScore: trip.riskScore,
                totalDistanceKm: trip.totalDistanceKm,
                totalDurationMin: trip.totalDurationMin,
                overallRiskLevel: trip.overallRiskLevel,
                waypoints: trip.waypoints,
                routePolyline: trip.routePolyline,
                vehicleType: trip.vehicleType,
                vehicle: trip.vehicleId ? {
                    id: trip.vehicleId._id,
                    plateNumber: trip.vehicleId.plateNumber,
                    vehicleType: trip.vehicleId.vehicleType,
                    driver: trip.vehicleId.driverId ? {
                        id: trip.vehicleId.driverId._id,
                        name: trip.vehicleId.driverId.name,
                    } : null,
                } : null,
            },
        });
    } catch (err) {
        console.error('Get Trip By Id Error:', err.message);
        next(err);
    }
};

// GET /api/routes/:tripId/alternates — verified alternate candidates + hazard info
const getAlternates = async (req, res, next) => {
    try {
        const trip = await Trip.findById(req.params.tripId);
        if (!trip) return res.status(404).json({ success: false, msg: 'trip not found' });
        const result = await computeAlternateCandidates(trip);
        res.status(200).json({ success: true, ...result });
    } catch (err) { next(err); }
};

// POST /api/routes/:tripId/apply-alternate — stitch the chosen candidate into the trip
const applyAlternateRoute = async (req, res, next) => {
    try {
        const { candidate } = req.body;
        if (!candidate?.coordinates?.length) return res.status(400).json({ success: false, msg: 'candidate is required' });
        const trip = await applyAlternate(req.params.tripId, candidate);
        res.status(200).json({ success: true, msg: 'alternate applied', tripId: trip._id });
    } catch (err) {
        if (err.statusCode) return res.status(err.statusCode).json({ success: false, msg: err.message });
        next(err);
    }
};

module.exports = { planRoute, getSmartDeparture, getTripHistory, getTripById, getAlternates, applyAlternateRoute };