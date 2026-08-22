// cargo sensitivity thresholds per cargo type
const CARGO_RULES = {
    general: {},
    perishable: { heat: 30, humidity: 85 },
    pharmaceutical: { heat: 35 },
    electronics: { humidity: 90, rain: 5 },
    chemicals: { heat: 40 },
    fragile: { gust: 60 },
};

const checkCargo = (cargoType, weather) => {
    const rule = CARGO_RULES[cargoType];
    if (!rule || !weather) return [];
    const alerts = [];
    if (rule.heat && weather.temperature > rule.heat)
        alerts.push({ type: 'heat', message: `Cargo (${cargoType}): ${weather.temperature}°C exceeds safe ${rule.heat}°C — verify cooling.` });
    if (rule.humidity && weather.humidity > rule.humidity)
        alerts.push({ type: 'humidity', message: `Cargo (${cargoType}): humidity ${weather.humidity}% above safe ${rule.humidity}%.` });
    if (rule.rain && weather.precipitation > rule.rain)
        alerts.push({ type: 'rain', message: `Cargo (${cargoType}): rain ${weather.precipitation}mm above safe ${rule.rain}mm — seal cargo bay.` });
    if (rule.gust && (weather.windGust || 0) > rule.gust)
        alerts.push({ type: 'gust', message: `Fragile cargo: wind gusts ${weather.windGust} km/h — drive below 60 km/h on bumps.` });
    return alerts;
};

module.exports = { CARGO_RULES, checkCargo };