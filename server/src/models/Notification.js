const mongoose = require('mongoose');

// Unified notification/request inbox for the fleet.
// A "request" is just a notification with actionRequired=true and status=pending.
const notificationSchema = new mongoose.Schema({
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    category: { type: String, required: true, index: true },
    title: { type: String, default: '' },
    message: { type: String, default: '' },
    relatedModel: { type: String, default: null },   // 'Trip' | 'Alert' | 'Notification'
    relatedId: { type: mongoose.Schema.Types.ObjectId, default: null },
    status: { type: String, default: 'info' },
    actionRequired: { type: Boolean, default: false },
    read: { type: Boolean, default: false },
    autoApproveAt: { type: Date, default: null },    // used for break requests
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

notificationSchema.index({ companyId: 1, recipientId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ category: 1, status: 1, autoApproveAt: 1 });

module.exports = mongoose.model('Notification', notificationSchema);