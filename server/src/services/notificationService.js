const Notification = require('../models/Notification');
const User = require('../models/User');
const { getIO } = require('../socket/socketManager');
const { NOTIF_CATEGORY, NOTIF_STATUS, DEFAULT_BREAK_MIN } = require('../utils/fleetConstants');

let autoApproveTimer = null;

// Create a notification and push it in real time to the recipient + the company room.
const notify = async ({
    companyId, recipientId, senderId = null, category, title = '', message = '',
    relatedModel = null, relatedId = null, status = NOTIF_STATUS.INFO,
    actionRequired = false, autoApproveInMin = null, metadata = {},
}) => {
    const doc = {
        companyId, recipientId, senderId, category, title, message,
        relatedModel, relatedId, status, actionRequired, metadata,
    };
    if (autoApproveInMin) {
        doc.autoApproveAt = new Date(Date.now() + autoApproveInMin * 60 * 1000);
    }
    const notif = await Notification.create(doc);

    try {
        const io = getIO();
        io.to(`driver:${recipientId}`).emit('notification:new', notif);
        if (companyId) io.to(`company:${companyId}`).emit('notification:new', notif);
    } catch (e) { /* socket not ready — notification is still persisted */ }

    return notif;
};

// Safety-first scheduler: a pending break request with no manager response
// is auto-approved after BREAK_AUTO_APPROVE_MIN so a tired driver never waits.
const startAutoApproveScheduler = () => {
    if (autoApproveTimer) return;
    autoApproveTimer = setInterval(async () => {
        try {
            const now = new Date();
            const due = await Notification.find({
                category: NOTIF_CATEGORY.BREAK_REQUEST,
                status: NOTIF_STATUS.PENDING,
                autoApproveAt: { $lte: now },
            });

            for (const n of due) {
                n.status = NOTIF_STATUS.AUTO_APPROVED;
                n.metadata = { ...n.metadata, decidedBy: 'system', decidedAt: now };
                await n.save();

                const driver = await User.findById(n.senderId);
                if (driver) {
                    driver.currentBreak = {
                        startedAt: now,
                        requestedMin: n.metadata?.durationMin || DEFAULT_BREAK_MIN,
                        status: 'active',
                    };
                    await driver.save();
                }

                await notify({
                    companyId: n.companyId,
                    recipientId: n.senderId,
                    category: NOTIF_CATEGORY.DECISION,
                    title: 'Break auto-approved',
                    message: 'Your break request was auto-approved (no response within the allowed window). Stay safe.',
                    relatedModel: 'Notification',
                    relatedId: n._id,
                    status: NOTIF_STATUS.AUTO_APPROVED,
                });
            }
        } catch (e) {
            console.error('auto-approve scheduler error:', e.message);
        }
    }, 60 * 1000); // check every minute
};

const stopAutoApproveScheduler = () => {
    if (autoApproveTimer) { clearInterval(autoApproveTimer); autoApproveTimer = null; }
};

module.exports = { notify, startAutoApproveScheduler, stopAutoApproveScheduler };