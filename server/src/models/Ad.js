const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'ad name is required'],
        trim: true,
    },
    type: {
        type: String,
        enum: ['rest', 'wash', 'fuel'],
        required: true,
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
        },
        coordinates: {
            type: [Number], // [lng, lat] — GeoJSON order, same convention as FleetVehicle.js
            required: true,
        },
    },
    offerText: {
        type: String,
        required: [true, 'offer text is required'],
        trim: true,
    },
    // which weather conditions this ad should surface for, e.g. a rest stop
    // wants to show up when it's hot, a car wash wants to show up after rain/dust
    triggerConditions: {
        heat: { type: Boolean, default: false },
        rain: { type: Boolean, default: false },
        dust: { type: Boolean, default: false },
    },
}, { timestamps: true });

adSchema.index({ location: '2dsphere' });

const Ad = mongoose.model('Ad', adSchema);
module.exports = Ad;