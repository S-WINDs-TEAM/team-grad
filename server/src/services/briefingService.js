const FleetVehicle = require('../models/FleetVehicle');
const Trip = require('../models/Trip');

// One automatic morning summary for the fleet manager:
// how many vehicles are safe / need caution / need delay / have no trip today,
// plus a per-vehicle recommendation.
const buildDailyBriefing = async (companyId) => {
    const vehicles = await FleetVehicle.find({ companyId })
        .populate('driverId', 'name')
        .lean();

    // today's window
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);

    let safe = 0, caution = 0, danger = 0, noTrip = 0;
    const items = [];

    for (const v of vehicles) {
        // first trip of the day for this vehicle (if any)
        const trip = await Trip.findOne({
            vehicleId: v._id,
            departureTime: { $gte: start, $lte: end },
        }).sort({ departureTime: 1 }).lean();

        if (!trip) {
            noTrip++;
            items.push({
                plateNumber: v.plateNumber,
                driver: v.driverId?.name || null,
                level: 'none',
                recommendation: 'No trip planned today.',
                route: null,
            });
            continue;
        }

        const level = trip.overallRiskLevel;
        let recommendation;
        if (level === 'high') {
            danger++;
            recommendation = 'Consider delaying departure or using an alternate route.';
        } else if (level === 'medium') {
            caution++;
            recommendation = 'Dispatch with caution — reduced speeds expected.';
        } else {
            safe++;
            recommendation = 'Safe to dispatch.';
        }

        items.push({
            plateNumber: v.plateNumber,
            driver: v.driverId?.name || null,
            level,
            recommendation,
            route: `${trip.origin?.address || 'Start'} → ${trip.destination?.address || 'End'}`,
        });
    }

    return { date: new Date(), safe, caution, danger, noTrip, items };
};

module.exports = { buildDailyBriefing };