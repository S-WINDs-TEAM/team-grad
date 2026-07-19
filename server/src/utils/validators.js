const joi = require('joi');

// individual driver registration only — role is fixed to 'individual' in the controller,
// so it's not accepted here anymore. company_admin -> registerCompanySchema below.
const registerSchema = joi.object({
    name: joi.string().min(2).max(50).required(),
    email: joi.string().email().required(),
    password: joi.string().min(6).max(100).required(),
    // role: joi.string().valid('user', 'fleet_manager').default('user'),
    vehicleType: joi.string().valid('car', 'motorcycle', 'truck').default('car'),
    vehicleHeight: joi.string().valid('low', 'medium', 'high').default('medium'),

});

//company registeration
const registerCompanySchema = joi.object({
    companyName: joi.string().min(2).max(100).required(),
    industry: joi.string().max(100).optional(),
    adminName: joi.string().min(2).max(50).required(),
    email: joi.string().email().required(),
    password: joi.string().min(6).max(100).required(),
});

// driver invite
const inviteDriverSchema = joi.object({
    name: joi.string().min(2).max(50).required(),
    email: joi.string().email().required(),
});

// accetp invite 
const acceptInviteSchema = joi.object({
    password: joi.string().min(6).max(100).required(),
});

const addVehicleSchema = joi.object({
    plateNumber: joi.string().min(2).max(20).required(),
    vehicleType: joi.string().valid('car', 'motorcycle', 'truck').default('truck'),
    driverId: joi.string().hex().length(24).optional(), // mongo ObjectId, assign later if omitted
});
// alert
const sendAlertSchema = joi.object({
    vehicleIds: joi.array().items(joi.string().hex().length(24)).min(1).required(),
    message: joi.string().min(2).max(200).required(),
    alertType: joi.string().valid('weather', 'safety', 'general').default('general'),
});

//logging
const loginSchema = joi.object({
    email:joi.string().email().required(),
    password: joi.string().required(),
});


const planRouteSchema = joi.object({
  origin: joi.object({
    lat: joi.number().required(),
    lng: joi.number().required(),
    address: joi.string().optional(),
  }).required(),
  destination: joi.object({
    lat: joi.number().required(),
    lng: joi.number().required(),
    address: joi.string().optional(),
  }).required(),
  vehicleType: joi.string().valid('car', 'motorcycle', 'truck').default('car'),
  departureTime: joi.date().iso().optional(),
});

// SMART DP SCMA
const smartDepartureSchema = joi.object({
  origin: joi.object({
    lat: joi.number().required(),
    lng: joi.number().required(),
    address: joi.string().optional(),
  }).required(),
  destination: joi.object({
    lat: joi.number().required(),
    lng: joi.number().required(),
    address: joi.string().optional(),
  }).required(),
  vehicleType: joi.string().valid('car', 'motorcycle', 'truck').default('car'),
  departureTime: joi.date().iso().optional(), // start of the window, defaults to now
  windowHours: joi.number().min(1).max(24).default(6), // how far ahead to look
  intervalMinutes: joi.number().valid(30, 60, 90, 120).default(60), // spacing between candidate times
});

module.exports = {
  registerSchema,
  registerCompanySchema,
  inviteDriverSchema,
  acceptInviteSchema,
  addVehicleSchema,
  sendAlertSchema,
  loginSchema,
  planRouteSchema,
  smartDepartureSchema,
};