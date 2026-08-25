const axios = require('axios');
const Trip = require('../models/Trip');
const { getHazardCircle, haversineKm } = require('./simulationService');
const { sampleWaypoints } = require('./mapService');
const { computeWaypointsForDeparture } = require('./routPlanningService');
const { getWeatherForLocationAndTime } = require('./weatherService');
const { calculateCompositeRisk } = require('../utils/riskEngine');
const { calculateMaxSafeSpeed } = require('../utils/geoUtils');

const toRad = (d) => d * Math.PI / 180;
const toDeg = (r) => r * 180 / Math.PI;

const bearingDeg = (a, b) => {
    const φ1 = toRad(a.lat), φ2 = toRad(b.lat), Δλ = toRad(b.lng - a.lng);
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
};

const destPoint = (lat, lng, bearing, distKm) => {
    const δ = distKm / 6371, θ = toRad(bearing);
    const φ1 = toRad(lat), λ1 = toRad(lng);
    const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
    const λ2 = λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));
    return { lat: toDeg(φ2), lng: toDeg(λ2) };
};

const osrmRoute = async (points) => {
    const coords = points.map(p => `${p.lng},${p.lat}`).join(';');
    const res = await axios.get(`https://router.project-osrm.org/route/v1/driving/${coords}`, {
        params: { overview: 'full', geometries: 'geojson' },
    });
    const route = res.data?.routes?.[0];
    if (!route) return null;
    return { coordinates: route.geometry.coordinates, distanceKm: route.distance / 1000, durationMin: route.duration / 60 };
};

// clearance = how far the candidate stays OUTSIDE the hazard circle (km)
const minClearanceKm = (coordinates, circle) => {
    let min = Infinity;
    for (let i = 0; i < coordinates.length; i += 2) {
        const [lng, lat] = coordinates[i];
        const d = haversineKm(lat, lng, circle.lat, circle.lng) - circle.radiusKm;
        if (d < min) min = d;
    }
    return min;
};

const findHazardSegment = (waypoints) => {
    const hazardIdx = (waypoints || []).findIndex(w => w.weather?.riskLevel === 'high');
    if (hazardIdx === -1) return null;
    let endIdx = hazardIdx;
    while (endIdx + 1 < waypoints.length && waypoints[endIdx + 1].weather?.riskLevel === 'high') endIdx++;
    return {
        hazardIdx,
        entryIdx: Math.max(0, hazardIdx - 1),
        exitIdx: Math.min(waypoints.length - 1, endIdx + 1),
    };
};

// Generate up to 3 VERIFIED alternate candidates (local detour entry→exit).
const computeAlternateCandidates = async (trip) => {
    const circle = getHazardCircle();
    const wps = trip.waypoints || [];
    const seg = findHazardSegment(wps);
    if (!seg || !circle) return { candidates: [], segment: seg, circle };

    const entry = wps[seg.entryIdx].location;
    const exit = wps[seg.exitIdx].location;
    const corridorBearing = bearingDeg(entry, exit);

    const segKm = (wps[seg.exitIdx].distanceFromStart || 0) - (wps[seg.entryIdx].distanceFromStart || 0);
    const segMin = ((new Date(wps[seg.exitIdx].eta)) - (new Date(wps[seg.entryIdx].eta))) / 60000;

    const candidates = [];
    let id = 1;
    for (const side of [90, 270]) {
        for (const offsetKm of [6, 10, 15]) {
            const via = destPoint(circle.lat, circle.lng, (corridorBearing + side) % 360, offsetKm + circle.radiusKm);
            const route = await osrmRoute([entry, via, exit]);
            if (!route) continue;
            const clearance = minClearanceKm(route.coordinates, circle);
            if (clearance < 0.5) continue; // re-enters the hazard → REJECT
            candidates.push({
                id: id++,
                side: side === 90 ? 'right' : 'left',
                clearanceKm: Math.round(clearance * 10) / 10,
                distanceKm: Math.round(route.distanceKm * 10) / 10,
                durationMin: Math.round(route.durationMin),
                addedKm: Math.round((route.distanceKm - segKm) * 10) / 10,
                addedMin: Math.round(route.durationMin - segMin),
                polyline: route.coordinates.map(([lng, lat]) => [lat, lng]),
                coordinates: route.coordinates,
            });
        }
    }
    candidates.sort((a, b) => (a.addedMin + a.addedKm * 0.5) - (b.addedMin + b.addedKm * 0.5));
    return { candidates: candidates.slice(0, 3), segment: seg, circle };
};

const nearestPolylineIndex = (coordsLngLat, point) => {
    let best = 0, bestD = Infinity;
    for (let i = 0; i < coordsLngLat.length; i++) {
        const d = haversineKm(point.lat, point.lng, coordsLngLat[i][1], coordsLngLat[i][0]);
        if (d < bestD) { bestD = d; best = i; }
    }
    return best;
};

// Stitch: prefix (untouched) + detour (new weather/ETA) + suffix (re-chained ETA).
const applyAlternate = async (tripId, candidate) => {
    const trip = await Trip.findById(tripId);
    if (!trip) throw Object.assign(new Error('trip not found'), { statusCode: 404 });
    const wps = trip.waypoints || [];
    const seg = findHazardSegment(wps);
    if (!seg) throw Object.assign(new Error('no hazard segment on this trip'), { statusCode: 409 });

    const entry = wps[seg.entryIdx];
    const exit = wps[seg.exitIdx];

    // ---- detour waypoints (5km sampling, chained ETA from entry) ----
    const raw = sampleWaypoints(candidate.coordinates, candidate.distanceKm);
    let eta = new Date(entry.eta);
    let prevDist = 0;
    const detour = [];
    for (const r of raw) {
        if (r.distanceFromStart > 0) {
            const speed = entry.maxSafeSpeed || 80;
            eta = new Date(eta.getTime() + ((r.distanceFromStart - prevDist) / speed) * 3600000);
            prevDist = r.distanceFromStart;
        }
        const weather = await getWeatherForLocationAndTime(r.lat, r.lng, eta);
        const composite = calculateCompositeRisk(weather, trip.vehicleType);
        detour.push({
            location: { lat: r.lat, lng: r.lng },
            eta,
            distanceFromStart: Math.round((entry.distanceFromStart + r.distanceFromStart) * 10) / 10,
            weather: { ...weather, riskLevel: composite.level },
            maxSafeSpeed: calculateMaxSafeSpeed(weather, trip.vehicleType),
            riskScore: composite.score,
            components: composite.components,
        });
    }

    // ---- suffix: same weather, re-chained ETA + shifted distances ----
    const detourEndEta = detour.length ? new Date(detour[detour.length - 1].eta) : new Date(entry.eta);
    const detourEndDist = entry.distanceFromStart + candidate.distanceKm;
    const suffix = wps.slice(seg.exitIdx).map(w => {
        const gap = (w.distanceFromStart || 0) - (exit.distanceFromStart || 0);
        const speed = w.maxSafeSpeed || 80;
        return {
            ...w,
            eta: new Date(detourEndEta.getTime() + (Math.max(0, gap) / speed) * 3600000),
            distanceFromStart: Math.round((detourEndDist + Math.max(0, gap)) * 10) / 10,
        };
    });

    // ---- new polyline = original prefix + detour + original suffix ----
    const origLngLat = (trip.routePolyline || []).map(([lat, lng]) => [lng, lat]);
    const entryPolyIdx = nearestPolylineIndex(origLngLat, entry.location);
    const exitPolyIdx = nearestPolylineIndex(origLngLat, exit.location);
    const newLngLat = [
        ...origLngLat.slice(0, entryPolyIdx + 1),
        ...candidate.coordinates,
        ...origLngLat.slice(exitPolyIdx),
    ];

    const newWaypoints = [...wps.slice(0, seg.entryIdx + 1), ...detour, ...suffix];
    const totalDistanceKm = Math.round((detourEndDist + ((wps[wps.length - 1].distanceFromStart || 0) - (exit.distanceFromStart || 0))) * 10) / 10;
    const totalDurationMin = Math.round(((newWaypoints[newWaypoints.length - 1].eta - new Date(trip.departureTime)) / 60000) || trip.totalDurationMin);
    const overallRiskLevel = newWaypoints.some(w => w.weather?.riskLevel === 'high') ? 'high'
        : newWaypoints.some(w => w.weather?.riskLevel === 'medium') ? 'medium' : 'low';

    trip.routePolyline = newLngLat.map(([lng, lat]) => [lat, lng]);
    trip.waypoints = newWaypoints;
    trip.totalDistanceKm = totalDistanceKm;
    trip.totalDurationMin = totalDurationMin;
    trip.overallRiskLevel = overallRiskLevel;
    await trip.save();
    return trip;
};

module.exports = { computeAlternateCandidates, applyAlternate, findHazardSegment };