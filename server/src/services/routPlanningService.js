const { getRoute, sampleWaypoints } = require('./mapService');
const { getWeatherForLocationAndTime } = require('./weatherService');
const { calculateMaxSafeSpeed, calculateFuelImpact } = require('../utils/geoUtils');
const { encodeGeohash, roundToNearest30Min } = require('../utils/geoUtils');
const { ALL_CLASSES, LEGACY_MAP } = require('../utils/vehicleProfiles');
const { calculateCompositeRisk } = require('../utils/riskEngine');
const weatherCache = require('../models/WeatherCache');
const { applyHazardOverride } = require('./simulationService');

// small delay used only on cache miss (Open-Meteo free-tier friendliness)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Step 1: call OSRM once + sample waypoints (5km sampling for precision)
const getRouteAndWaypoints = async (origin, destination) => {
    const route = await getRoute(origin.lat, origin.lng, destination.lat, destination.lng);
    const rawWaypoints = sampleWaypoints(route.coordinates, route.distanceKm);
    const routePolyline = route.coordinates.map(([lng, lat]) => [lat, lng]);
    return { route, rawWaypoints, routePolyline };
};

// Step 2: chained ETA + weather calculation for ONE departure time.
// IMPORTANT: we keep full 5km granularity for accuracy, but return a 30km sample for display.
const computeWaypointsForDeparture = async (rawWaypoints, vehicleType, departure) => {
    const waypointsWithWeather = [];  // will hold 5km data (full)
    let cumulativeEta = departure;
    let previousDistance = 0;

    // Loop over every 5km point (rawWaypoints)
    for (const wp of rawWaypoints) {
        const segmentDistanceKm = wp.distanceFromStart - previousDistance;
        let etaForThisPoint = cumulativeEta;
        if (segmentDistanceKm > 0) {
            const lastmaxSafeSpeed = waypointsWithWeather.length > 0
                ? waypointsWithWeather[waypointsWithWeather.length - 1].maxSafeSpeed
                : 100;  // fallback for first point
            const segmentTimeHours = segmentDistanceKm / lastmaxSafeSpeed;
            const segmentTimesMs = segmentTimeHours * 60 * 60 * 1000;
            etaForThisPoint = new Date(cumulativeEta.getTime() + segmentTimesMs);
        }

        // Caching strategy: try cache first (no delay), only delay on miss.
        const geohash = encodeGeohash(wp.lat, wp.lng);
        const roundedTime = roundToNearest30Min(etaForThisPoint);
        const cached = await weatherCache.findOne({ geohash, forecastTime: roundedTime });
        let weather;
        if (cached) {
            // Cache hit – use stored data, no network delay
            console.log(`✅ Cache HIT: ${geohash} @ ${roundedTime}`);
            weather = cached.weatherData;
        } else {
            // Cache miss – apply small delay and fetch from API
            console.log(`🌤️ API Call (Open-Meteo): ${geohash} @ ${roundedTime}`);
            await delay(50);
            weather = await getWeatherForLocationAndTime(wp.lat, wp.lng, etaForThisPoint);
        }
        
        // DEMO MODE: override weather inside the simulated hazard zone (if active)
        weather = applyHazardOverride(wp, weather);

        // speeds & risks for EVERY vehicle class (5 physical + 3 legacy keys)
        const classes = [...ALL_CLASSES, 'car', 'truck', 'motorcycle'];
        const speeds = {};
        const risks = {};
        classes.forEach((cls) => {
            speeds[cls] = calculateMaxSafeSpeed(weather, cls);
            risks[cls] = calculateCompositeRisk(weather, cls).level;
        });

        // composite risk for the requested vehicle type (real engine — no forced values)
        const composite = calculateCompositeRisk(weather, vehicleType);
        const finalRiskLevel = composite.level;

        // fuel impact: handle both object/number return shapes from geoUtils
        const fuelRaw = calculateFuelImpact(weather, vehicleType, 'medium', speeds[vehicleType] || 90);
        const fuelImpact = (fuelRaw && typeof fuelRaw === 'object')
            ? fuelRaw
            : { extraFuelPer100km: Math.round((fuelRaw || 0) * 10) / 10 };

        // Store the full 5km waypoint with all data
        waypointsWithWeather.push({
            location: { lat: wp.lat, lng: wp.lng },
            eta: etaForThisPoint,
            distanceFromStart: wp.distanceFromStart,
            weather: { ...weather, riskLevel: finalRiskLevel },
            maxSafeSpeed: speeds[vehicleType],
            speeds,
            risks,
            riskScore: composite.score,          // NEW: 0-100 composite score
            components: composite.components,    // NEW: per-factor breakdown
            fuelImpact,                          // NEW: extra fuel per 100km
            vehicleClass: LEGACY_MAP[vehicleType] || vehicleType, // NEW: physical class
        });
        cumulativeEta = etaForThisPoint;
        previousDistance = wp.distanceFromStart;
    }

    // Sample 30km for display (to reduce response payload)
    const totalDistance = rawWaypoints[rawWaypoints.length - 1]?.distanceFromStart || 0;
    const targetCount = Math.max(2, Math.ceil(totalDistance / 30)); // at least 2 points
    const step = Math.max(1, Math.floor(waypointsWithWeather.length / targetCount));
    const displayWaypoints = [];
    for (let i = 0; i < waypointsWithWeather.length; i += step) {
        displayWaypoints.push(waypointsWithWeather[i]);
    }
    // Ensure the last point is always included
    const last = waypointsWithWeather[waypointsWithWeather.length - 1];
    if (displayWaypoints[displayWaypoints.length - 1] !== last) {
        displayWaypoints.push(last);
    }

    // Compute overall risk and duration
    const riskScores = { low: 1, medium: 2, high: 3 };
    const avgRiskScore = waypointsWithWeather.reduce(
        (sum, wp) => sum + riskScores[wp.weather.riskLevel], 0
    ) / waypointsWithWeather.length;
    const overallRisk = avgRiskScore > 2.2 ? 'high' : avgRiskScore > 1.4 ? 'medium' : 'low';
    const totalDurationMin = (cumulativeEta.getTime() - departure.getTime()) / (60 * 1000);

    return {
        // For client response (30km)
        waypointsWithWeather: displayWaypoints,
        // For storage (5km full)
        fullWaypoints: waypointsWithWeather,
        overallRisk,
        avgRiskScore,
        totalDurationMin,
        arrivalTime: cumulativeEta,
    };
};

module.exports = { getRouteAndWaypoints, computeWaypointsForDeparture };