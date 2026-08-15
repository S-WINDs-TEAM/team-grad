const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const FleetVehicle = require('../models/FleetVehicle');

let io = null;

// accessToken is httpOnly (see authController.setTokenCookies), so client-side JS can't
// read it to send via `auth: { token }`. The browser still attaches the cookie to the
// socket.io handshake request automatically (same as any other request to this origin),
// so we parse it out of the raw cookie header instead.
const parseCookies = (cookieHeader = '') => {
    return cookieHeader.split(';').reduce((acc, pair) => {
        const [key, ...rest] = pair.trim().split('=');
        if (key) acc[key] = decodeURIComponent(rest.join('='));
        return acc;
    }, {});
};

const initSocket = (httpServer) => {
    // BUG FIX: mirror the app.js CORS fix. The old hardcoded
    // origin: 'http://localhost:5173' only allowed that exact string, so a
    // socket connecting from 127.0.0.1 / a LAN IP / prod domain was
    // rejected (browser blocks the handshake -> "Network Error"). Reflect
    // loopback origins during dev; lock to CLIENT_URL in production.
    const isLoopbackOrigin = (o) =>
      /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(o || '');
    const allowedSocketOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
    io = new Server(httpServer, {
        cors: {
            origin: (origin, cb) => {
                if (!origin) return cb(null, true);
                if (origin === allowedSocketOrigin || isLoopbackOrigin(origin)) return cb(null, true);
                cb(new Error('Not allowed by CORS'));
            },
            credentials: true, // required so the browser actually attaches the cookie
        },
    });

    // auth middleware for every socket connection — same access token used by the REST API.
    // sockets don't send the httpOnly cookie automatically here, so the client sends it
    // explicitly as `auth: { token }` when connecting (see useSocket.js in Task 5).
    // cookie the REST API uses. requires the client to connect with { withCredentials: true }.
    io.use(async (socket, next) => {
        try {
            const cookies = parseCookies(socket.handshake.headers.cookie);
            const token = cookies.accessToken;
            if (!token) return next(new Error('not authorized, no token'));

            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            const user = await User.findById(decoded.id).select('-password -refreshToken');

            if (!user) return next(new Error('user not found'));
            // individual drivers have no business on the fleet socket at all
            if (user.role === 'individual') return next(new Error('not authorized for fleet tracking'));
            if (!user.companyId) return next(new Error('no company associated with this account'));

            socket.user = user; // attach for use in the handlers below
            next();
        } catch (err) {
            next(new Error('not authorized, token failed'));
        }
    });

    io.on('connection', (socket) => {
        const { user } = socket;
        const companyRoom = `company:${user.companyId}`;
        socket.join(companyRoom);

        console.log(`socket connected: ${user.role} (${user.email}) joined ${companyRoom}`);

        // only company_driver accounts are allowed to report their own location.
        // role check happens HERE, not just in the handshake middleware, since the
        // middleware only proves "this is a company account", not which kind.
        socket.on('driver:location', async ({ lat, lng }) => {
            try {
                if (user.role !== 'company_driver') return;
                if (typeof lat !== 'number' || typeof lng !== 'number') return;

                const vehicle = await FleetVehicle.findOneAndUpdate(
                    { driverId: user._id },
                    {
                        currentLocation: { type: 'Point', coordinates: [lng, lat] },
                        lastSeen: new Date(),
                        status: 'active',
                    },
                    { new: true }
                ).populate('driverId', 'name email');

                if (!vehicle) return; // driver has no vehicle assigned yet, nothing to update

                // broadcast to everyone else in the same company room (i.e. the admin dashboard)
                io.to(companyRoom).emit('fleet:update', vehicle);
            } catch (err) {
                console.error('driver:location error:', err.message);
            }
        });

        // admin-only: push an alert straight from the dashboard without going through REST.
        // POST /api/fleet/alert (fleetController.sendAlert) does the exact same broadcast
        // for cases where the frontend prefers a normal HTTP call instead.
        socket.on('fleet:alert', async ({ vehicleIds, message, alertType }) => {
            try {
                if (user.role !== 'company_admin') return;
                if (!Array.isArray(vehicleIds) || vehicleIds.length === 0) return;

                const vehicles = await FleetVehicle.find({
                    _id: { $in: vehicleIds },
                    companyId: user.companyId, // never alert a vehicle outside the admin's own company
                }).populate('driverId', 'name email');

                const driverIds = vehicles
                    .map((v) => v.driverId?._id?.toString())
                    .filter(Boolean);

                io.to(companyRoom).emit('fleet:alert', {
                    message,
                    alertType: alertType || 'general',
                    targetDriverIds: driverIds,
                    sentAt: new Date(),
                });
            } catch (err) {
                console.error('fleet:alert error:', err.message);
            }
        });

        socket.on('disconnect', async () => {
            try {
                if (user.role === 'company_driver') {
                    const vehicle = await FleetVehicle.findOneAndUpdate(
                        { driverId: user._id },
                        { status: 'offline' },
                        { new: true }
                    );
                    if (vehicle) io.to(companyRoom).emit('fleet:update', vehicle);
                }
            } catch (err) {
                console.error('disconnect handler error:', err.message);
            }
        });
    });

    return io;
};

// used by REST controllers (fleetController.sendAlert) that need to emit
// without going through a socket handler directly.
const getIO = () => {
    if (!io) throw new Error('socket.io not initialized yet');
    return io;
};

module.exports = { initSocket, getIO };