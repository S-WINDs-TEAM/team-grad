// Single source of truth for all fleet domain enums.
// Backend validation + frontend labels both read from here so they never drift apart.

const VEHICLE_CLASSES = [
    'car_small', 'car_medium', 'van', 'truck_small', 'truck_large', 'motorcycle',
];

// Old 3-type values still accepted everywhere, mapped to the physical classes.
const LEGACY_CLASS_MAP = { car: 'car_medium', truck: 'truck_small', motorcycle: 'motorcycle' };

const OPERATIONAL_STATUS = {
    AVAILABLE: 'available',
    MAINTENANCE: 'maintenance',
    RETIRED: 'retired',
};

const LIVE_STATUS = { ACTIVE: 'active', IDLE: 'idle', OFFLINE: 'offline' };

const WORK_STATUS = {
    AVAILABLE: 'available',
    RESTING: 'resting',
    ON_BREAK: 'on_break',
    ON_LEAVE: 'on_leave',
    DEACTIVATED: 'deactivated',
};

const NOTIF_CATEGORY = {
    ROUTE_REQUEST: 'route_request',
    BREAK_REQUEST: 'break_request',
    TRIP_REQUEST: 'trip_request',
    DECISION: 'decision',
    DISPATCH: 'dispatch',
    SYSTEM: 'system',
};

const NOTIF_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    AUTO_APPROVED: 'auto_approved',
    INFO: 'info',
};

const BREAK_AUTO_APPROVE_MIN = 7;   // manager no-response window
const DEFAULT_BREAK_MIN = 15;
const OVER_TRIP_HOURS = 8;          // driver considered over the daily limit

module.exports = {
    VEHICLE_CLASSES,
    LEGACY_CLASS_MAP,
    OPERATIONAL_STATUS,
    LIVE_STATUS,
    WORK_STATUS,
    NOTIF_CATEGORY,
    NOTIF_STATUS,
    BREAK_AUTO_APPROVE_MIN,
    DEFAULT_BREAK_MIN,
    OVER_TRIP_HOURS,
};