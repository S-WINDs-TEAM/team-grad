const Notification = require('../models/Notification');
const Trip = require('../models/Trip');
const User = require('../models/User');
const { getIO } = require('../socket/socketManager');
const { notify } = require('../services/notificationService');
const { NOTIF_CATEGORY, NOTIF_STATUS, BREAK_AUTO_APPROVE_MIN, DEFAULT_BREAK_MIN } = require('../utils/fleetConstants');
const { calculateLocalAlternate } = require('../services/mapService');
const { rebuildWaypointsForPolyline } = require('../services/routPlanningService');
// Helper: find the managers of a company to receive a request.
const getCompanyManagers = async (companyId) => {
    return User.find({ role: 'company_admin', companyId }).select('_id');
};

// company_driver — request a short break.
const createBreakRequest = async (req, res, next) => {
    try {
        const { durationMin = DEFAULT_BREAK_MIN, note = '' } = req.body;
        const managers = await getCompanyManagers(req.user.companyId);
        if (!managers.length) return res.status(404).json({ success: false, msg: 'no manager found for your company' });

        const created = [];
        for (const m of managers) {
            const notif = await notify({
                companyId: req.user.companyId,
                recipientId: m._id,
                senderId: req.user._id,
                category: NOTIF_CATEGORY.BREAK_REQUEST,
                title: 'Break request',
                message: `${req.user.name} requested a ${durationMin}-minute break.${note ? ' Note: ' + note : ''}`,
                status: NOTIF_STATUS.PENDING,
                actionRequired: true,
                autoApproveInMin: BREAK_AUTO_APPROVE_MIN,
                metadata: { durationMin, note },
            });
            created.push(notif);
        }
        res.status(201).json({ success: true, msg: 'break request sent', requests: created });
    } catch (err) { next(err); }
};

// company_driver — request an alternate route.
// FIXED: alternateRoute is OPTIONAL — the driver reports a hazard even without
// a computed alternate; the manager reviews the route and decides.
const createRouteRequest = async (req, res, next) => {
    try {
        const { tripId, alternateRoute = null, reason = '' } = req.body;
        if (!tripId) {
            return res.status(400).json({ success: false, msg: 'tripId is required' });
        }
        const managers = await getCompanyManagers(req.user.companyId);

        // FIXED: if the driver didn't send a computed alternate, calculate one
        // server-side around the most dangerous waypoint so the manager's
        // approval has a REAL route to switch to.
        let alt = alternateRoute;
        if (!alt) {
            const tripDoc = await Trip.findById(tripId).lean();
            const wps = tripDoc?.waypoints || [];
            const danger = wps.find(w => w.weather?.riskLevel === 'high') ||
                (wps.length ? wps.reduce((max, w) => ((w.riskScore || 0) > (max.riskScore || 0) ? w : max), wps[0]) : null);
            if (tripDoc && danger) {
                const computed = await calculateLocalAlternate(
                    tripDoc.origin, tripDoc.destination,
                    { lat: danger.location.lat, lng: danger.location.lng }, 10
                );
                alt = {
                    polyline: computed.polyline,
                    waypoints: computed.coordinates.map(([lng, lat]) => ({ location: { lat, lng } })),
                    totalDistanceKm: computed.distanceKm,
                    totalDurationMin: computed.durationMin,
                    overallRiskLevel: 'low',
                };
            }
        }

        // Context for the manager
        const tripCtx = await Trip.findById(tripId).select('origin destination vehicleId').populate({ path: 'vehicleId', select: 'plateNumber' });
        const context = {
            plateNumber: tripCtx?.vehicleId?.plateNumber || null,
            driverName: req.user.name,
            routeLine: `${tripCtx?.origin?.address || 'Origin'} → ${tripCtx?.destination?.address || 'Destination'}`,
        };

        if (!managers.length) return res.status(404).json({ success: false, msg: 'no manager found for your company' });

        const created = [];
        for (const m of managers) {
            const notif = await notify({
                companyId: req.user.companyId,
                recipientId: m._id,
                senderId: req.user._id,
                category: NOTIF_CATEGORY.ROUTE_REQUEST,
                title: 'Alternate route request',
                message: `${req.user.name} reports a hazard on the route and requests an alternate path.${reason ? ' Reason: ' + reason : ''}`,
                relatedModel: 'Trip',
                relatedId: tripId,
                status: NOTIF_STATUS.PENDING,
                actionRequired: true,
                metadata: { tripId, alternateRoute: alt, context, reason },
            });
            created.push(notif);
        }
        res.status(201).json({ success: true, msg: 'route request sent', requests: created });
    } catch (err) { next(err); }
};

// company_driver — request to be assigned a trip (no trip today).
const createTripRequest = async (req, res, next) => {
    try {
        const { note = '' } = req.body;
        const managers = await getCompanyManagers(req.user.companyId);
        if (!managers.length) return res.status(404).json({ success: false, msg: 'no manager found for your company' });

        const created = [];
        for (const m of managers) {
            const notif = await notify({
                companyId: req.user.companyId,
                recipientId: m._id,
                senderId: req.user._id,
                category: NOTIF_CATEGORY.TRIP_REQUEST,
                title: 'Trip request',
                message: `${req.user.name} has no trip today and is requesting an assignment.${note ? ' Note: ' + note : ''}`,
                status: NOTIF_STATUS.PENDING,
                actionRequired: true,
                metadata: { note },
            });
            created.push(notif);
        }
        res.status(201).json({ success: true, msg: 'trip request sent', requests: created });
    } catch (err) { next(err); }
};

// company_admin — approve / reject a pending request.
const decideRequest = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { decision, note = '' } = req.body;
        if (!['approved', 'rejected'].includes(decision)) {
            return res.status(400).json({ success: false, msg: 'decision must be approved or rejected' });
        }

        const notif = await Notification.findOne({ _id: id, companyId: req.user.companyId });
        if (!notif) return res.status(404).json({ success: false, msg: 'request not found' });
        if (notif.status !== NOTIF_STATUS.PENDING) {
            return res.status(409).json({ success: false, msg: 'request already decided' });
        }

        notif.status = decision === 'approved' ? NOTIF_STATUS.APPROVED : NOTIF_STATUS.REJECTED;
        notif.metadata = { ...notif.metadata, decisionNote: note, decidedBy: req.user._id, decidedAt: new Date() };
        await notif.save();

        // Break approved: start the driver's break now.
        if (notif.category === NOTIF_CATEGORY.BREAK_REQUEST && decision === 'approved') {
            const driver = await User.findById(notif.senderId);
            if (driver) {
                driver.currentBreak = {
                    startedAt: new Date(),
                    requestedMin: notif.metadata?.durationMin || DEFAULT_BREAK_MIN,
                    status: 'active',
                };
                await driver.save();
            }
        }

        // Route approved AND an alternate route was provided: switch the trip to it.
        if (notif.category === NOTIF_CATEGORY.ROUTE_REQUEST && decision === 'approved'
            && notif.metadata?.tripId && notif.metadata?.alternateRoute) {
            const alt = notif.metadata.alternateRoute;
            // FIXED: rebuild REAL waypoints for the new polyline
            const tripDoc = await Trip.findById(notif.metadata.tripId).select('vehicleType departureTime');
            const dep = tripDoc?.departureTime && new Date(tripDoc.departureTime) > new Date()
                ? new Date(tripDoc.departureTime) : new Date();
            const rebuilt = await rebuildWaypointsForPolyline(alt.polyline, alt.totalDistanceKm, tripDoc?.vehicleType || 'car', dep);
            await Trip.findByIdAndUpdate(notif.metadata.tripId, {
                routePolyline: alt.polyline,
                waypoints: rebuilt.fullWaypoints,
                overallRiskLevel: rebuilt.overallRisk,
                totalDistanceKm: alt.totalDistanceKm,
                totalDurationMin: rebuilt.totalDurationMin,
            });
        }

        // Broadcast so dashboards/driver refresh the trip immediately
        try {
            const io = getIO();
            io.to(`company:${notif.companyId}`).emit('trip:updated', { tripId: notif.metadata?.tripId });
            io.to(`driver:${notif.senderId}`).emit('trip:updated', { tripId: notif.metadata?.tripId });
        } catch (e) { /* socket not ready */ }

        // Notify the requester (driver) about the decision.
        await notify({
            companyId: notif.companyId,
            recipientId: notif.senderId,
            senderId: req.user._id,
            category: NOTIF_CATEGORY.DECISION,
            title: decision === 'approved' ? 'Request approved' : 'Request rejected',
            message: note || (decision === 'approved' ? 'Your request was approved.' : 'Your request was rejected — continue on the current plan.'),
            relatedModel: 'Notification',
            relatedId: notif._id,
            status: decision === 'approved' ? NOTIF_STATUS.APPROVED : NOTIF_STATUS.REJECTED,
        });

        try {
            getIO().to(`driver:${notif.senderId}`).emit('request:decision', {
                notificationId: notif._id,
                category: notif.category,
                decision,
                tripId: notif.metadata?.tripId || null,
            });
        } catch (e) { /* socket not ready */ }

        res.status(200).json({ success: true, notification: notif });
    } catch (err) { next(err); }
};

// Inbox: admin sees the company's requests; driver sees their own notifications.
const getInbox = async (req, res, next) => {
    try {
        const { status, category, page = 1, limit = 20 } = req.query;
        const q = {};
        if (req.user.role === 'company_admin') {
            q.companyId = req.user.companyId;
        } else {
            q.recipientId = req.user._id;
        }
        if (status) q.status = status;
        if (category) q.category = category;

        const total = await Notification.countDocuments(q);
        const items = await Notification.find(q)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.status(200).json({
            success: true,
            notifications: items,
            pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
        });
    } catch (err) { next(err); }
};

// Unread count per category (drives the bell + chips).
const getUnreadCount = async (req, res, next) => {
    try {
        const q = req.user.role === 'company_admin'
            ? { companyId: req.user.companyId, read: false }
            : { recipientId: req.user._id, read: false };

        const [total, byCategory] = await Promise.all([
            Notification.countDocuments(q),
            Notification.aggregate([
                { $match: q },
                { $group: { _id: '$category', count: { $sum: 1 } } },
            ]),
        ]);

        const categories = {};
        byCategory.forEach(c => { categories[c._id] = c.count; });
        res.status(200).json({ success: true, total, categories });
    } catch (err) { next(err); }
};

// Mark a notification as read.
const markRead = async (req, res, next) => {
    try {
        const { id } = req.params;
        await Notification.findOneAndUpdate(
            { _id: id, $or: [{ recipientId: req.user._id }, { companyId: req.user.companyId }] },
            { read: true },
        );
        res.status(200).json({ success: true });
    } catch (err) { next(err); }
};

// Mark ALL notifications as read (called when the bell is opened).
const markAllRead = async (req, res, next) => {
    try {
        const q = req.user.role === 'company_admin'
            ? { companyId: req.user.companyId, read: false }
            : { recipientId: req.user._id, read: false };
        await Notification.updateMany(q, { read: true });
        res.status(200).json({ success: true });
    } catch (err) { next(err); }
};

module.exports = {
    createBreakRequest, createRouteRequest, createTripRequest,
    decideRequest, getInbox, getUnreadCount, markRead, markAllRead,
};