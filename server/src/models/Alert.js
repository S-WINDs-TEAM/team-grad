const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      // required: true,
          default: null,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FleetVehicle',
      // required: true,
          default: null,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Category 1: System (automated) | Category 2: Communication (driver/manager initiated)
    category: {
      type: String,
      enum: ['system', 'communication'],
      required: true,
    },
    type: {
      type: String,
      enum: [
        // System types
        'offline',
        'high_risk',
        'speed_violation',
        'route_deviation',
        'maintenance',
        'geofence',
        // Communication types
        'route_change_request',
        'instruction_request',
        'route_change_confirmation',
        'announcement',
      ],
      required: true,
    },
    severity: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      default: 'medium',
    },
    message: {
      type: String,
      required: true,
    },
    // Detailed payload for interactive alerts (e.g., route change requests)
    details: {
      lat: Number,
      lng: Number,
      waypointIndex: Number,
      currentRoute: {
        polyline: [[Number]],
        distanceKm: Number,
        durationMin: Number,
        riskLevel: String,
      },
      proposedRoute: {
        polyline: [[Number]],
        distanceKm: Number,
        durationMin: Number,
        riskLevel: String,
      },
      difference: {
        timeSavedMin: Number,
        distanceSavedKm: Number,
      },
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'acknowledged', 'resolved'],
      default: 'pending',
    },
    read: {
      type: Boolean,
      default: false,
    },
    // Manager's response (if any)
    response: {
      message: String,
      respondedAt: Date,
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
  },
  { timestamps: true }
);

// Index for efficient filtering on the dashboard
alertSchema.index({ companyId: 1, category: 1, createdAt: -1 });
alertSchema.index({ vehicleId: 1, status: 1 });

const Alert = mongoose.model('Alert', alertSchema);
module.exports = Alert;