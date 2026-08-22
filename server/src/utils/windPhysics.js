const { getVehicleProfile } = require('./vehicleProfiles');
const AIR_DENSITY = 1.225; // kg/m3

// F = 0.5 * rho * v^2 * Cd * A  (worst case: full side wind)
const calculateLateralWindForce = (windSpeedKmh, vehicleClass) => {
    const p = getVehicleProfile(vehicleClass);
    const v = windSpeedKmh / 3.6;
    return Math.round(0.5 * AIR_DENSITY * v * v * p.cd * p.sideArea);
};
// force vs vehicle weight heuristic
const isWindDangerous = (windForce, vehicleClass) => {
    const p = getVehicleProfile(vehicleClass);
    const threshold = p.weight * 0.35;
    const ratio = windForce / threshold;
    return {
        dangerous: ratio >= 1,
        level: ratio >= 1 ? 'high' : ratio >= 0.6 ? 'medium' : 'low',
        ratio: Math.round(ratio * 100) / 100,
    };
};
const calculateSafeSpeedForWind = (windSpeedKmh, vehicleClass, roadMaxSpeed) => {
    const p = getVehicleProfile(vehicleClass);
    const reduction = windSpeedKmh * p.windSensitivity * 0.5;
    return Math.round(Math.min(roadMaxSpeed, Math.max(30, p.baseSpeed - reduction)));
};
module.exports = { calculateLateralWindForce, isWindDangerous, calculateSafeSpeedForWind };