const Trip = require('../models/Trip');

const DAILY_LIMIT_HOURS = 8;
const EARLY_WARN_HOURS = 7;

// total driven hours for a driver since midnight (from saved trips)
const getDriverDrivenHoursToday = async (driverId) => {
    if (!driverId) return 0;
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);
    const trips = await Trip.find({
        userId: driverId,
        departureTime: { $gte: start, $lte: end },
    }).select('totalDurationMin').lean();
    const minutes = trips.reduce((s, t) => s + (t.totalDurationMin || 0), 0);
    return Math.round((minutes / 60) * 10) / 10;
};

const evaluateFatigue = async (driverId, newTripDurationMin) => {
    const hoursDriven = await getDriverDrivenHoursToday(driverId);
    const projectedHours = Math.round((hoursDriven + ((newTripDurationMin || 0) / 60)) * 10) / 10;
    if (hoursDriven >= DAILY_LIMIT_HOURS)
        return { level: 'critical', hoursDriven, projectedHours, message: 'Driver exceeded the 8h daily limit — rest required before a new trip.' };
    if (projectedHours > DAILY_LIMIT_HOURS)
        return { level: 'warn', hoursDriven, projectedHours, message: 'This trip pushes the driver over the 8h daily limit.' };
    if (hoursDriven >= EARLY_WARN_HOURS)
        return { level: 'warn', hoursDriven, projectedHours, message: 'Driver is near the daily limit (7h+ driven today).' };
    return { level: 'ok', hoursDriven, projectedHours, message: null };
};

module.exports = { evaluateFatigue, getDriverDrivenHoursToday };