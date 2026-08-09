const Alert = require('../models/Alert');
const FleetVehicle = require('../models/FleetVehicle');
const { getIO } = require('../socket/socketManager');

// 1. Send a new alert (system or communication)
// POST /api/alerts
const sendAlert = async (req, res, next) => {
  try {
    const { vehicleId, driverId, category, type, severity, message, details } = req.body;
    const companyId = req.user.companyId;

    // Ensure the vehicle belongs to the admin's company
    const vehicle = await FleetVehicle.findOne({ _id: vehicleId, companyId });
    if (!vehicle) {
      return res.status(404).json({ success: false, msg: 'Vehicle not found in your company' });
    }

    const alert = await Alert.create({
      companyId,
      vehicleId,
      driverId,
      category,
      type,
      severity: severity || 'medium',
      message,
      details: details || {},
      status: category === 'system' ? 'acknowledged' : 'pending', // System alerts are auto-acknowledged, communication ones need action
    });

    // Emit real-time alert via WebSocket to the specific driver and the admin dashboard
    const io = getIO();
    io.to(`company:${companyId}`).emit('fleet:alert', alert);
    io.to(`driver:${driverId}`).emit('driver:alert', alert);

    res.status(201).json({ success: true, alert });
  } catch (err) {
    next(err);
  }
};

// 2. Get alerts (filtered by category and read status)
// GET /api/alerts?category=system|communication&read=true|false&limit=20
const getAlerts = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const { category, read, limit = 20, page = 1 } = req.query;

    const filter = { companyId };
    if (category) filter.category = category;
    if (read !== undefined) filter.read = read === 'true';

    const alerts = await Alert.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('vehicleId', 'plateNumber')
      .populate('driverId', 'name');

    const total = await Alert.countDocuments(filter);

    res.status(200).json({
      success: true,
      alerts,
      pagination: { total, page, limit: parseInt(limit) },
    });
  } catch (err) {
    next(err);
  }
};

// 3. Acknowledge an alert (mark as read)
// PATCH /api/alerts/:id/acknowledge
const acknowledgeAlert = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.id, companyId },
      { read: true },
      { new: true }
    );
    if (!alert) {
      return res.status(404).json({ success: false, msg: 'Alert not found' });
    }
    res.status(200).json({ success: true, alert });
  } catch (err) {
    next(err);
  }
};

// 4. Manager responds to a route change request (approve/reject)
// POST /api/alerts/:id/respond
const respondToAlert = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const { status, responseMessage } = req.body; // status: 'approved' or 'rejected'

    const alert = await Alert.findOne({ _id: req.params.id, companyId });
    if (!alert) {
      return res.status(404).json({ success: false, msg: 'Alert not found' });
    }

    if (alert.category !== 'communication' || alert.type !== 'route_change_request') {
      return res.status(400).json({
        success: false,
        msg: 'Only route change requests can be responded to via this endpoint',
      });
    }

    alert.status = status;
    alert.response = {
      message: responseMessage || (status === 'approved' ? 'Route change approved' : 'Route change rejected'),
      respondedAt: new Date(),
      respondedBy: req.user._id,
    };
    await alert.save();

    // Emit the response to the driver in real-time
    const io = getIO();
    io.to(`driver:${alert.driverId}`).emit('driver:alert:response', alert);

    res.status(200).json({ success: true, alert });
  } catch (err) {
    next(err);
  }
};

module.exports = { sendAlert, getAlerts, acknowledgeAlert, respondToAlert };