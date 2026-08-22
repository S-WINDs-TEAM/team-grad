// Explicit, visible demo-mode simulation. OFF by default — real weather otherwise.
let hazardZone = null; // { fromKm, toKm } when active

const setHazardZone = (fromKm, toKm) => { hazardZone = { fromKm, toKm }; };
const clearHazardZone = () => { hazardZone = null; };
const getHazardZone = () => hazardZone;

// If the waypoint falls inside the simulated zone, override its RAW weather
// values so the whole pipeline (risk engine, safe speed, alternate route)
// reacts realistically. Applied per-request AFTER cache read — cache stays clean.
const applyHazardOverride = (waypoint, weather) => {
    if (!hazardZone) return weather;
    const km = waypoint.distanceFromStart || 0;
    if (km >= hazardZone.fromKm && km <= hazardZone.toKm) {
        return {
            ...weather,
            windSpeed: 75,
            windGust: 90,
            visibility: 0.15,
            precipitation: 22,
            pop: 100,
            humidity: 90,
            condition: 'sandstorm',
            description: 'SIMULATED sandstorm (demo mode)',
        };
    }
    return weather;
};

module.exports = { setHazardZone, clearHazardZone, getHazardZone, applyHazardOverride };