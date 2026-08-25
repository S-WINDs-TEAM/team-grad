const mongoose = require('mongoose');

// One persistent thread per driver (thread owner = driverId).
// If the driver is on an active trip, messages are auto-linked to it (tripId)
// so the conversation becomes part of the trip's audit record.
const chatMessageSchema = new mongoose.Schema({
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', default: null },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, default: '' },
    message: { type: String, required: true, maxlength: 1000 },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

chatMessageSchema.index({ companyId: 1, driverId: 1, createdAt: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);