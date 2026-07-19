const Trip = require('../models/Trip');
const FleetVehicle = require('../models/FleetVehicle');

const { getRouteAndWaypoints, computeWaypointsForDeparture } = require('../services/routPlanningService');
const { calculateLocalAlternate } = require('../services/mapService');
const Alert = require('../models/Alert');
const { getIO } = require('../socket/socketManager');




const planRoute = async (req, res, next) => {
    try {
        const { origin, destination, vehicleType, departureTime } = req.body;
        const departure = departureTime ? new Date(departureTime) : new Date();
        const vType = vehicleType || 'car';
        const vehicleHeight = req.user?.vehicleHeight || 'medium';

        const { rawWaypoints, routePolyline, route } = await getRouteAndWaypoints(origin, destination);
        const { waypointsWithWeather, fullWaypoints, overallRisk, totalDurationMin } =
            await computeWaypointsForDeparture(rawWaypoints, vType, departure);

        // FIX: store fullWaypoints (5km) in database
        const trip = await Trip.create({
            userId: req.user._id,
            origin,
            destination,
            vehicleType: vType,
            vehicleHeight,
            departureTime: departure,
            totalDistanceKm: route.distanceKm,
            totalDurationMin,
            waypoints: fullWaypoints,        // <- 44 points stored
            routePolyline,
            overallRiskLevel: overallRisk,
        });

        //check for high-risk waypoints
        const highRiskWaypoint = fullWaypoints.find(wp => wp.weather.riskLevel === 'high'); 
         let alertId = null;
        let alternateRouteData = null;

         if (highRiskWaypoint) {
             //  جلب vehicleId من قاعدة البيانات (لو مش موجود في req.user)
            let vehicleId = req.user?.vehicleId || null;
            if (!vehicleId) {
                const vehicle = await FleetVehicle.findOne({ driverId: req.user._id });
                                vehicleId = vehicle?._id || null;
            }
            // 3a. Calculate alternate route (only around the danger zone)
            const dangerWp = {
                lat: highRiskWaypoint.location.lat,
                lng: highRiskWaypoint.location.lng,
            };

            const alternate = await calculateLocalAlternate(origin, destination, dangerWp, 10);
            // 3b. Build the alternate route details for the alert
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
                riskLevel: 'low', // assume alternate is safe (we could recalc weather here)
            };

            
            const timeSaved =  Math.round(currentRouteSummary.durationMin - proposedRouteSummary.durationMin);
            const distanceDiff = Math.round((proposedRouteSummary.distanceKm - currentRouteSummary.distanceKm) * 10) / 10;
            
            //  حساب waypointIndex بدقة
            const waypointIndex = fullWaypoints.findIndex(
                wp => wp.location.lat === highRiskWaypoint.location.lat &&
                      wp.location.lng === highRiskWaypoint.location.lng
            );

            // 3c. Create an alert for the driver and manager
            const alert = await Alert.create({
                companyId: req.user.companyId || null, // if individual, companyId is null
                vehicleId,
                driverId: req.user._id,
                category: 'communication',
                type: 'route_change_request',
                severity: 'high',
                message: `Weather hazard detected near KM ${Math.round(highRiskWaypoint.distanceFromStart)}. Alternate route available.`,
                details: {
                    lat: highRiskWaypoint.location.lat,
                    lng: highRiskWaypoint.location.lng,
                    waypointIndex,
                    currentRoute: currentRouteSummary,
                    proposedRoute: proposedRouteSummary,
                    difference: {
                        timeSavedMin: timeSaved,
                        distanceSavedKm: distanceDiff,
                    },
                },
                status: 'pending',
                read: false,
            });

             alertId = alert._id;
            alternateRouteData = {
                polyline: alternate.polyline,
                waypoints: alternate.coordinates.map(([lng, lat]) => ({
                    location: { lat, lng },
                    // We could compute weather for alternate waypoints here if needed
                })),
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
        }
             // 3d. Emit the alert via WebSocket (real-time)
        //     const io = getIO();
        //     if (req.user.companyId) {
        //         io.to(`company:${req.user.companyId}`).emit('fleet:alert', alert);
        //     }
        //     io.to(`driver:${req.user._id}`).emit('driver:alert', alert);
        // }

        // 4. Prepare response (include alternateRoute and alertId if any)
        const response = {
            success: true,
            trip: {
                id: trip._id,
                totalDistanceKm: route.distanceKm,
                totalDurationMin,
                overallRiskLevel: overallRisk,
                waypoints: waypointsWithWeather,         // 30km display
                detailedWaypoints: fullWaypoints,        // 5km full
                routePolyline,
                roadMaxSpeed: route.roadMaxSpeed || 120,
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

        // // FIX: response sends waypointsWithWeather (30km)
        // res.status(200).json({
        //     success: true,
        //     trip: {
        //         id: trip._id,
        //         totalDistanceKm: route.distanceKm,
        //         totalDurationMin,
        //         overallRiskLevel: overallRisk,
        //         waypoints: waypointsWithWeather,   // <- 8 points sent to user suammry
        //         detailedWaypoints: fullWaypoints, //5km detailed
        //         routePolyline,
        //         roadMaxSpeed: route.roadMaxSpeed || 120,
        //         urbanExitInfo: {
        //             totalUrbanMinutes: 0,
        //             exitTimeMinutes: 0,
        //             totalHighwayMinutes: 0,
        //         },
        //     },
        // });
    } catch (err) {
        console.error("Failed URL:", err.config?.url || err.response?.config?.url);
        console.error("Status Code:", err.response?.status);
        next(err);
    }
};

// FIX: getSmartDeparture also needs to handle the new return structure
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
            // FIX: we need the full calculation for smart departure, not just display
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

        res.status(200).json({
            success: true,
            suggestions: rankedSuggestions,
        });
    } catch (err) {
        console.error("Smart Departure Error:", err.message);
        next(err);
    }
};

const getTripHistory = async (req, res, next) => {
    try {
        const trips = await Trip.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(10)
            .select('-waypoints -routePolyline');
        res.status(200).json({ success: true, trips });
    } catch (err) {
        next(err);
    }
};

const getTripById = async (req, res, next) => {
    try {
        const { tripId } = req.params;
        const trip = await Trip.findOne({
            _id: tripId,
            userId: req.user._id,
        });
        if (!trip) return res.status(404).json({ msg: 'trip not found', success: false });
        res.status(200).json({
            success: true,
            trip: {
                id: trip._id,
                totalDistanceKm: trip.totalDistanceKm,
                totalDurationMin: trip.totalDurationMin,
                overallRiskLevel: trip.overallRiskLevel,
                waypoints: trip.waypoints,
                routePolyline: trip.routePolyline,
                vehicleType: trip.vehicleType,
            },
        });
    } catch (err) {
        next(err);
    }
};

module.exports = { planRoute, getSmartDeparture, getTripHistory, getTripById };