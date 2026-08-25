const mongoose = require("mongoose");

const fleetVehicleSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    // ref -> User with role 'company_driver'. optional at creation time —
    // an admin might add a vehicle before assigning a driver to it.
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    plateNumber: {
      type: String,
      required: [true, "plate number is required"],
      trim: true,
    },
    vehicleType: {
      type: String,
      enum: ["car", "motorcycle", "truck"],
      default: "truck", // fleet vehicles are trucks/vans by default, but keep it flexible
    },
    currentLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat] — GeoJSON order, same convention as Ad.js will use later
        default: [0, 0],
      },
    },
    lastSeen: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "idle", "offline"],
      default: "offline",
    },
    // relative path served via express.static — see uploadMiddleware.js
    photoUrl: {
      type: String,
      default: null,
    },
    operationalStatus: {
      type: String,
      enum: ["available", "maintenance", "retired"],
      default: "available",
    },
  },
  { timestamps: true },
);

fleetVehicleSchema.index({ currentLocation: "2dsphere" });
// a driver can only be actively assigned to one vehicle at a time
fleetVehicleSchema.index(
  { driverId: 1 },
  {
    unique: true,
    partialFilterExpression: { driverId: { $type: "objectId" } },
  },
);

const FleetVehicle = mongoose.model("FleetVehicle", fleetVehicleSchema);
module.exports = FleetVehicle;
