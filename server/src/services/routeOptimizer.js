const { getRoute, sampleWaypoints } = require('./mapService');
const { getWeatherForLocationAndTime } = require('./weatherService');
const { 
    calculateMaxSafeSpeed,  // FIX: الاسم الجديد بدل calculatemaxSafeSpeed
    calculateRiskLevel,
    calculateFuelImpact,
    calculateUrbanExitTime,
    getVehicleProfile 
} = require('../utils/geoUtils');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Step 1: call OSRM once + sample waypoints (now 5km sampling).
const getRouteAndWaypoints = async (origin, destination) => {
    const route = await getRoute(origin.lat, origin.lng, destination.lat, destination.lng);
    // FIX: sampleWaypoints now uses 5km internally
    const rawWaypoints = sampleWaypoints(route.coordinates, route.distanceKm);
    const routePolyline = route.coordinates.map(([lng, lat]) => [lat, lng]);

    // NEW: extract roadMaxSpeed and urbanSegments from the route
    const { roadMaxSpeed, urbanSegments } = route;

    return { route, rawWaypoints, routePolyline, roadMaxSpeed, urbanSegments };
};

// Step 2: chained ETA + weather calculation for ONE departure time.
// IMPROVEMENT: added roadMaxSpeed and vehicleHeight parameters
const computeWaypointsForDeparture = async (
    rawWaypoints,
    vehicleType,
    departure,
    vehicleHeight = 'medium',
    roadMaxSpeed = 120
) => {
    const waypointsWithWeather = [];
    let cumulativeEta = departure;
    let previousDistance = 0;

    for (const wp of rawWaypoints) {
        const segmentDistanceKm = wp.distanceFromStart - previousDistance;
        let etaForThisPoint = cumulativeEta;

        if (segmentDistanceKm > 0) {
            // Use the last calculated speed, or a safe default (80) for the first segment
            const lastmaxSafeSpeed = waypointsWithWeather.length > 0
                ? waypointsWithWeather[waypointsWithWeather.length - 1].maxSafeSpeed
                : 80; // FIX: changed default to a more realistic speed

            const segmentTimeHours = segmentDistanceKm / lastmaxSafeSpeed;
            const segmentTimeMs = segmentTimeHours * 60 * 60 * 1000;
            etaForThisPoint = new Date(cumulativeEta.getTime() + segmentTimeMs);
        }

        await delay(300);

        const weather = await getWeatherForLocationAndTime(wp.lat, wp.lng, etaForThisPoint);

        // Calculate for all vehicle types (for dynamic switching on frontend)
        const vehicleTypes = ['car', 'motorcycle', 'truck'];
        const speeds = {};
        const risks = {};
        const fuelImpacts = {};
        vehicleTypes.forEach((type) => {
            // FIX: passing roadMaxSpeed and vehicleHeight to the new functions
            speeds[type] = calculateMaxSafeSpeed(weather, type, vehicleHeight, roadMaxSpeed);
            risks[type] = calculateRiskLevel(weather, type, vehicleHeight, roadMaxSpeed);
            // NEW: Calculate fuel impact for each type (optional, for future use)
            fuelImpacts[type] = calculateFuelImpact(weather, type, vehicleHeight, speeds[type]);
        });

        waypointsWithWeather.push({
            location: { lat: wp.lat, lng: wp.lng },
            eta: etaForThisPoint,
            distanceFromStart: wp.distanceFromStart,
            weather: { ...weather, riskLevel: risks[vehicleType] },
            maxSafeSpeed: speeds[vehicleType],
            speeds,
            risks,
            // NEW: Store fuel impact data for this waypoint
            fuelImpact: fuelImpacts[vehicleType],
        });

        cumulativeEta = etaForThisPoint;
        previousDistance = wp.distanceFromStart;
    }

    const riskScores = { low: 1, medium: 2, high: 3 };
    const avgRiskScore = waypointsWithWeather.reduce(
        (sum, wp) => sum + riskScores[wp.weather.riskLevel], 0
    ) / waypointsWithWeather.length;

    const overallRisk = avgRiskScore > 2.2 ? 'high' : avgRiskScore > 1.4 ? 'medium' : 'low';
    const totalDurationMin = (cumulativeEta.getTime() - departure.getTime()) / (60 * 1000);

    return {
        waypointsWithWeather,
        overallRisk,
        avgRiskScore,
        totalDurationMin,
        arrivalTime: cumulativeEta,
    };
};

module.exports = { getRouteAndWaypoints, computeWaypointsForDeparture };