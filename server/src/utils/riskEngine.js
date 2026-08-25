const { getVehicleProfile } = require('./vehicleProfiles');
const { calculateLateralWindForce, isWindDangerous } = require('./windPhysics');

const calculateWindRisk = (windSpeed, windGust, vehicleClass) => {
    const effective = Math.max(windSpeed || 0, windGust || 0);
    const force = calculateLateralWindForce(effective, vehicleClass);
    const { level } = isWindDangerous(force, vehicleClass);
    const base = Math.min(100, Math.round((effective / 80) * 100));
    if (level === 'high') return Math.max(base, 80);
    if (level === 'medium') return Math.max(base, 55);
    return base;
};
const calculateVisibilityRisk = (visibilityKm) => {
    if (visibilityKm == null) return 0;
    if (visibilityKm < 0.1) return 100;
    if (visibilityKm < 0.2) return 80;
    if (visibilityKm < 0.5) return 60;
    if (visibilityKm < 1) return 30;
    return 10;
};
const calculateRainRisk = (precipitation, pop) => {
    const p = precipitation || 0;
    const base = p > 20 ? 90 : p > 10 ? 70 : p > 2 ? 40 : 10;
    return Math.min(100, base + ((pop || 0) > 70 ? 10 : 0));
};
const calculateTempRisk = (temp, humidity) => {
    const t = temp == null ? 20 : temp;
    const base = t > 40 ? 80 : t > 35 ? 60 : t < 0 ? 70 : t < 10 ? 40 : 15;
    return Math.min(100, base + ((humidity || 0) > 85 ? 15 : 0));
};
// weights per vehicle class (high-profile vehicles care more about wind), sum ~ 1
const getWeights = (vehicleClass) => {
    const p = getVehicleProfile(vehicleClass);
    const wind = Math.min(0.5, Math.round((0.2 + p.windSensitivity * 0.2) * 100) / 100);
    const visibility = 0.35;
    const rain = 0.25;
    const temp = Math.max(0.05, Math.round((1 - wind - visibility - rain) * 100) / 100);
    return { wind, visibility, rain, temp };
};
// THE composite score: one number 0-100
const calculateCompositeRisk = (weather, vehicleClass) => {
    const w = getWeights(vehicleClass);
    const components = {
        wind: calculateWindRisk(weather.windSpeed, weather.windGust, vehicleClass),
        visibility: calculateVisibilityRisk(weather.visibility),
        rain: calculateRainRisk(weather.precipitation, weather.pop),
        temp: calculateTempRisk(weather.temperature, weather.humidity),
    };
    // interaction multipliers (wind+rain together, or sandstorm/fog, amplify risk)
    let interaction = 1;
    if (components.rain >= 60 && components.wind >= 60) interaction = 1.15;
    if (weather.condition === 'sandstorm' || weather.condition === 'fog') interaction = 1.2;
    const score = Math.min(100, Math.round(
        (components.wind * w.wind +
         components.visibility * w.visibility +
         components.rain * w.rain +
         components.temp * w.temp) * interaction
    ));
    const level = score >= 65 ? 'high' : score >= 35 ? 'medium' : 'low';
    return { score, level, components };
};
module.exports = { calculateCompositeRisk, calculateWindRisk, calculateVisibilityRisk, calculateRainRisk, calculateTempRisk, getWeights };