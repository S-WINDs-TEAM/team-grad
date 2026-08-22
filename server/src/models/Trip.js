const mongoose = require('mongoose');

// Weather sub-schema (one waypoint's forecast)
const WeatherSchema = new mongoose.Schema({
    temperature: Number,
    feelsLike: Number,
    windSpeed: Number,
    windDirection: Number,
    windGust: Number,
    precipitation: Number,
    pop: Number,
    humidity: Number,
    pressure: Number,
    visibility: Number,
    clouds: Number,
    uvIndex: Number,
    dewPoint: Number,
    condition: String,
    description: String,
    icon: String,
    riskLevel: String,
}, { _id: false });

// Waypoint sub-schema (5km granularity, stored full in DB)
const WaypointSchema = new mongoose.Schema({
    location: { lat: Number, lng: Number },
    eta: Date,
    distanceFromStart: Number,
    weather: WeatherSchema,
    maxSafeSpeed: Number,
    // Mixed so any set of vehicle-class keys (3 legacy + 6 physical) saves fine
    speeds: { type: mongoose.Schema.Types.Mixed },
    risks: { type: mongoose.Schema.Types.Mixed },
    // Unit 1 (Risk Engine) additions
    riskScore: { type: Number, default: null },
    components: { type: mongoose.Schema.Types.Mixed, default: null },
    fuelImpact: { type: mongoose.Schema.Types.Mixed, default: null },
    vehicleClass: { type: String, default: null },
}, { _id: false });

const TripSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'FleetVehicle', default: null },
    origin: { lat: Number, lng: Number, address: String },
    destination: { lat: Number, lng: Number, address: String },
    vehicleType: { type: String, enum: ['car', 'motorcycle', 'truck'], default: 'car' },
    vehicleHeight: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    // Unit 2: cargo sensitivity
    cargoType: {
        type: String,
        enum: ['general', 'perishable', 'pharmaceutical', 'electronics', 'chemicals', 'fragile'],
        default: 'general',
    },
    departureTime: { type: Date, default: Date.now },
    totalDistanceKm: Number,
    totalDurationMin: Number,
    waypoints: [WaypointSchema],
    routePolyline: [[Number]],
    overallRiskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    // Unit 1/2: composite score for the whole trip
    riskScore: { type: Number, default: null },
    // Unit 2: driver fatigue evaluation at planning time
    fatigueInfo: {
        level: String,
        hoursDriven: Number,
        projectedHours: Number,
        message: String,
    },
    // Unit 2: FIX — explicit object array schema.
    // The old `[{ type: String, message: String }]` made Mongoose treat it as
    // [String] and throw CastError when saving objects.
    cargoAlerts: {
        type: [
            {
                type: { type: String },
                message: { type: String },
            },
        ],
        default: [],
    },
    status: { type: String, enum: ['planned', 'active', 'completed'], default: 'planned' },
}, { timestamps: true });

TripSchema.index({ userId: 1, createdAt: -1 });
TripSchema.index({ vehicleId: 1, departureTime: 1 });

module.exports = mongoose.model('Trip', TripSchema);