// Explicit, visible demo-mode simulation. OFF by default — real weather otherwise.
// The hazard is a KM range (for marking waypoints while planning) AND a captured
// geographic circle (for alternate-route clearance verification).

let hazardRange = null;   // { fromKm, toKm }
let hazardCircle = null;  // { lat, lng, radiusKm }

const haversineKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const setHazardZone = (fromKm, toKm) => {
    hazardRange = { fromKm: Number(fromKm), toKm: Number(toKm) };
    hazardCircle = null;
};
const clearHazardZone = () => { hazardRange = null; hazardCircle = null; };
const getHazardZone = () => hazardRange;
const getHazardCircle = () => hazardCircle;

// Called by planRoute after waypoints are computed: convert the KM range into a
// geographic circle centered on the hazard segment.
const captureCircleFromWaypoints = (waypoints) => {
    if (!hazardRange) { hazardCircle = null; return null; }
    const hit = (waypoints || []).filter(w =>
        (w.distanceFromStart || 0) >= hazardRange.fromKm && (w.distanceFromStart || 0) <= hazardRange.toKm);
    if (!hit.length) { hazardCircle = null; return null; }
    const first = hit[0].location;
    const last = hit[hit.length - 1].location;
    const lat = (first.lat + last.lat) / 2;
    const lng = (first.lng + last.lng) / 2;
    const spanKm = haversineKm(first.lat, first.lng, last.lat, last.lng);
    hazardCircle = { lat, lng, radiusKm: Math.max(4, spanKm / 2 + 3) };
    return hazardCircle;
};

const isPointInHazard = (lat, lng) => {
    if (!hazardCircle) return false;
    return haversineKm(lat, lng, hazardCircle.lat, hazardCircle.lng) <= hazardCircle.radiusKm;
};

const applyHazardOverride = (waypoint, weather) => {
    if (!hazardRange || !waypoint || !weather) return weather;
    const km = waypoint.distanceFromStart || 0;
    if (km >= hazardRange.fromKm && km <= hazardRange.toKm) {
        return {
            ...weather,
            temperature: 41, feelsLike: 44,
            windSpeed: 75, windGust: 90,
            visibility: 0.15, precipitation: 22, pop: 100, humidity: 90,
            condition: 'sandstorm',
            description: 'SIMULATED sandstorm (demo mode)',
        };
    }
    return weather;
};

module.exports = {
    setHazardZone, clearHazardZone, getHazardZone, getHazardCircle,
    captureCircleFromWaypoints, isPointInHazard, applyHazardOverride, haversineKm,
};