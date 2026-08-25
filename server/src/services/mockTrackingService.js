const FleetVehicle = require('../models/FleetVehicle');
const Trip = require('../models/Trip');
const { getIO } = require('../socket/socketManager');

let timer = null;
const progress = new Map(); // vehicleId(string) -> current index along the polyline

// Demo Mode: move every company vehicle along its latest route polyline,
// one point every 3 seconds, broadcasting fleet:update like real GPS would.
const start = async (companyId) => {
    if (timer) return { running: true };

    const vehicles = await FleetVehicle.find({ companyId }).select('_id').lean();
    if (vehicles.length === 0) return { running: false, msg: 'no vehicles in this company' };

    timer = setInterval(async () => {
        for (const v of vehicles) {
            try {
                // latest planned route for this vehicle
                const trip = await Trip.findOne({ vehicleId: v._id })
                    .sort({ departureTime: -1 })
                    .select('routePolyline')
                    .lean();
                if (!trip || !trip.routePolyline || trip.routePolyline.length === 0) continue;

                // advance one polyline point (loop back at the end)
                const key = String(v._id);
                const idx = ((progress.get(key) ?? -1) + 1) % trip.routePolyline.length;
                progress.set(key, idx);
                const [lat, lng] = trip.routePolyline[idx]; // polyline stored as [lat, lng]

                const updated = await FleetVehicle.findByIdAndUpdate(
                    v._id,
                    {
                        currentLocation: { type: 'Point', coordinates: [lng, lat] },
                        status: 'active',
                        lastSeen: new Date(),
                    },
                    { new: true }
                ).populate('driverId', 'name email');

                // same event the real GPS pipeline would emit
                if (updated) {
                    getIO().to(`company:${companyId}`).emit('fleet:update', updated);
                }
            } catch (err) {
                // skip this vehicle this tick, keep the simulation alive
            }
        }
    }, 3000);

    return { running: true };
};

const stop = async () => {
    if (timer) clearInterval(timer);
    timer = null;
    progress.clear();
    return { running: false };
};

module.exports = { start, stop };