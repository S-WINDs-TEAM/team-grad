const ChatMessage = require('../models/ChatMessage');
const Trip = require('../models/Trip');
const User = require('../models/User');
const FleetVehicle = require('../models/FleetVehicle');
const { getIO } = require('../socket/socketManager');

// Resolve the driver's active trip today (to link messages to the trip record).
const findDriverActiveTrip = async (driverId) => {
    const vehicle = await FleetVehicle.findOne({ driverId });
    if (!vehicle) return null;
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);
    return Trip.findOne({ vehicleId: vehicle._id, departureTime: { $gte: start, $lte: end } })
        .sort({ departureTime: 1 });
};

// Send a message (manager -> driver, or driver -> manager).
const sendMessage = async (req, res, next) => {
    try {
        const { driverId, message, tripId } = req.body;
        if (!message || !message.trim()) return res.status(400).json({ success: false, msg: 'message is required' });

        // The thread is always owned by the driver.
        const threadDriverId = req.user.role === 'company_driver' ? req.user._id : driverId;
        if (!threadDriverId) return res.status(400).json({ success: false, msg: 'driverId is required' });

        const driver = await User.findOne({ _id: threadDriverId, role: 'company_driver', companyId: req.user.companyId });
        if (!driver) return res.status(404).json({ success: false, msg: 'driver not found in your company' });

        // Link to the driver's active trip if not explicitly provided.
        let attachTripId = tripId || null;
        if (!attachTripId) {
            const trip = await findDriverActiveTrip(threadDriverId);
            if (trip) attachTripId = trip._id;
        }

        const msg = await ChatMessage.create({
            companyId: req.user.companyId,
            driverId: threadDriverId,
            tripId: attachTripId,
            senderId: req.user._id,
            senderRole: req.user.role,
            message: message.trim(),
            readBy: [req.user._id], // sender has obviously read it
        });

        try {
            const io = getIO();
            io.to(`driver:${threadDriverId}`).emit('chat:message', msg);
            io.to(`company:${req.user.companyId}`).emit('chat:message', msg);
        } catch (e) { /* socket not ready */ }

        res.status(201).json({ success: true, message: msg });
    } catch (err) { next(err); }
};

// Manager: list of threads (one per driver) with last message + unread count.
const getThreads = async (req, res, next) => {
    try {
        const companyId = req.user.companyId;
        const drivers = await User.find({ role: 'company_driver', companyId }).select('_id name accountStatus');

        const threads = await Promise.all(drivers.map(async (d) => {
            const lastMessage = await ChatMessage.findOne({ companyId, driverId: d._id }).sort({ createdAt: -1 });
            const unread = await ChatMessage.countDocuments({
                companyId, driverId: d._id,
                senderId: { $ne: req.user._id },
                readBy: { $ne: req.user._id },
            });
            return {
                driverId: d._id,
                driverName: d.name,
                accountStatus: d.accountStatus,
                lastMessage: lastMessage || null,
                unread,
            };
        }));

        res.status(200).json({ success: true, threads });
    } catch (err) { next(err); }
};

// Read one thread (manager reading a driver's thread, or driver reading own).
const getThread = async (req, res, next) => {
    try {
        const { driverId } = req.params;
        const threadDriverId = req.user.role === 'company_driver' ? req.user._id : driverId;

        const driver = await User.findOne({ _id: threadDriverId, role: 'company_driver', companyId: req.user.companyId });
        if (!driver) return res.status(404).json({ success: false, msg: 'driver not found in your company' });

        const messages = await ChatMessage.find({ companyId: req.user.companyId, driverId: threadDriverId })
            .sort({ createdAt: 1 });

        // Mark messages from the other party as read by me.
        await ChatMessage.updateMany(
            { companyId: req.user.companyId, driverId: threadDriverId, senderId: { $ne: req.user._id }, readBy: { $ne: req.user._id } },
            { $addToSet: { readBy: req.user._id } },
        );

        res.status(200).json({ success: true, driverName: driver.name, messages });
    } catch (err) { next(err); }
};

// Driver shorthand for their own thread.
const getMyThread = async (req, res, next) => {
    req.params = { driverId: req.user._id };
    return getThread(req, res, next);
};

module.exports = { sendMessage, getThreads, getThread, getMyThread };