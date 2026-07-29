const User = require('../models/User');
const FleetVehicle = require('../models/FleetVehicle');
const Trip = require('../models/Trip');
const { getIO } = require('../socket/socketManager');

// company_admin invites a driver by email. no password is set here —
// the driver gets a link and sets their own password (see auth invite/accept endpoints).
const inviteDriver = async (req, res, next) => {
    try {
        const { name, email } = req.body;
        const companyId = req.user.companyId; // the admin's own company (protect + restrictTo already ran)

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ success: false, msg: 'email already in use' });
        }

        const driver = new User({
            name,
            email,
            role: 'company_driver',
            companyId,
            accountStatus: 'invited',
        });

        const rawToken = driver.generateInviteToken();
        await driver.save();

        // Dev-mode only: no email service wired up yet, so we log + return the link directly.
        // TODO (Task 6/8 area): send this via nodemailer once we have an SMTP/Mailtrap account.
        const inviteLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/accept-invite/${rawToken}`;
        console.log(`Invite link for ${email}: ${inviteLink}`);

        res.status(201).json({
            success: true,
            msg: 'driver invited successfully',
            driver: {
                id: driver._id,
                name: driver.name,
                email: driver.email,
                accountStatus: driver.accountStatus,
            },
            inviteLink, // TEMP: exposed here until real email sending exists
        });
    } catch (err) {
        next(err);
    }
};

// company_admin adds a vehicle to their own fleet, optionally assigning a driver right away.
const addVehicle = async (req, res, next) => {
    try {
        const { plateNumber, vehicleType, driverId } = req.body;
        const companyId = req.user.companyId;

        // if a driverId was given, make sure it's a real company_driver that belongs
        // to THIS company — otherwise an admin could accidentally (or deliberately)
        // assign a driver from another company.
        if (driverId) {
            const driver = await User.findOne({
                _id: driverId,
                role: 'company_driver',
                companyId,
            });
            if (!driver) {
                return res.status(404).json({
                    success: false,
                    msg: 'driver not found in your company',
                });
            }

            const alreadyAssigned = await FleetVehicle.findOne({ driverId });
            if (alreadyAssigned) {
                return res.status(409).json({
                    success: false,
                    msg: 'this driver is already assigned to another vehicle',
                });
            }
        }

        const vehicle = await FleetVehicle.create({
            companyId,
            driverId: driverId || null,
            plateNumber,
            vehicleType,
        });

        res.status(201).json({ success: true, vehicle });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ success: false, msg: 'plate number or driver already in use' });
        }
        next(err);
    }
};

// company_admin — full list of their company's vehicles + last known status.
// this is a plain REST snapshot; Task 4 (Socket.io) is what makes it live.
const getFleetStatus = async (req, res, next) => {
    try {
        const companyId = req.user.companyId;

        const vehicles = await FleetVehicle.find({ companyId })
            .populate('driverId', 'name email')
            .sort({ updatedAt: -1 });

        res.status(200).json({ success: true, count: vehicles.length, vehicles });
    } catch (err) {
        next(err);
    }
};

// company_driver — the driver's own vehicle only, nothing else in the fleet.
const getMyVehicleStatus = async (req, res, next) => {
    try {
        const vehicle = await FleetVehicle.findOne({ driverId: req.user._id });

        if (!vehicle) {
            return res.status(404).json({ success: false, msg: 'no vehicle assigned to you yet' });
        }

        res.status(200).json({ success: true, vehicle });
    } catch (err) {
        next(err);
    }
};


// company_admin — REST equivalent of the 'fleet:alert' socket event, for a frontend
// that prefers a normal HTTP call instead of emitting through the socket directly.
// Both paths end up broadcasting the same 'fleet:alert' event to the company room.
const sendAlert = async (req, res, next) => {
    try {
        const { vehicleIds, message, alertType } = req.body;
        const companyId = req.user.companyId;

        const vehicles = await FleetVehicle.find({
            _id: { $in: vehicleIds },
            companyId, // never alert a vehicle outside the admin's own company
        }).populate('driverId', 'name email');

        if (vehicles.length === 0) {
            return res.status(404).json({
                success: false,
                msg: 'no matching vehicles found in your company',
            });
        }

        const driverIds = vehicles
            .map((v) => v.driverId?._id?.toString())
            .filter(Boolean);

        const io = getIO();
        io.to(`company:${companyId}`).emit('fleet:alert', {
            message,
            alertType: alertType || 'general',
            targetDriverIds: driverIds,
            sentAt: new Date(),
        });

        res.status(200).json({
            success: true,
            msg: 'alert dispatched',
            targetDriverIds: driverIds,
        });
    } catch (err) {
        next(err);
    }
};

// company_admin — attach/replace a photo for one of their own vehicles
const uploadVehiclePhoto = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, msg: 'no file uploaded' });
        }

        const { vehicleId } = req.params;
        const companyId = req.user.companyId;

        const vehicle = await FleetVehicle.findOneAndUpdate(
            { _id: vehicleId, companyId }, // scoped to the admin's own company, same pattern as everywhere else
            { photoUrl: `/uploads/${req.file.filename}` },
            { new: true }
        );

        if (!vehicle) {
            return res.status(404).json({ success: false, msg: 'vehicle not found in your company' });
        }

        res.status(200).json({ success: true, vehicle });
    } catch (err) {
        next(err);
    }
};

// company_admin — list this company's drivers, used to populate the "assign driver"
// dropdown when adding a vehicle. Includes invited-but-not-yet-active drivers too,
// so the admin can pre-assign a vehicle before the driver even accepts the invite.
const getDrivers = async (req, res, next) => {
    try {
        const companyId = req.user.companyId;

        const drivers = await User.find({ role: 'company_driver', companyId })
            .select('name email accountStatus')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, drivers });
    } catch (err) {
        next(err);
    }
};


// get fleet dashboard endpoint 
const getFleetDashboard = async (req, res, next)=> {
    try {
        const companyId = req.user.companyId;
        const vehicles = await FleetVehicle.find({companyId})
        .populate('driverId', 'name email')
        .sort({updatedAt: -1});

        if((vehicles.length === 0)) {
            return res.status(200).json({
                success: true,
                fleet: [],
                msg: "no vehicales found in your company",
            });
        }

        //set start and end of the day
        const startOfDay = new Date();
        startOfDay.setHours(0,0,0,0);
        const endOfDay= new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // trips of every vehical today
        const fleetWithTrips = await Promise.all(
            vehicles.map(async (vehicle) => {
                // get first trip in the day or the nearst one
                const todayTrip = await Trip.findOne({
                    vehicleId: vehicle._id,
                    departureTime: {$gte: startOfDay, $lte: endOfDay},
                })
                .sort({departureTime: 1}) // the nearest first
                .select('-waypoints') //  
                .lean() // trans to json format

                let tripSummary = null;
                if(todayTrip) {
                    tripSummary = {
                        id: todayTrip._id,
                        origin: todayTrip.origin,
                        destination: todayTrip.destination,
                        departureTime: todayTrip.departureTime,
                        totalDistanceKm: todayTrip.totalDistanceKm,
                        totalDurationMin: todayTrip.totalDurationMin,
                        overallRiskLevel: todayTrip.overallRiskLevel,
                        routePolyline: todayTrip.routePolyline, // map draw    
                        status: todayTrip.status,
                    };
                }
                return {
                        vehicle: {
                        id: vehicle._id,
                        plateNumber: vehicle.plateNumber,
                        vehicleType: vehicle.vehicleType,
                        status: vehicle.status,
                        photoUrl: vehicle.photoUrl,
                        lastSeen: vehicle.lastSeen,
                        driver: vehicle.driverId, // populated من الـ populate أعلاه
                },
                todayTrip: tripSummary, // null if vehical have no trip today
            };
    })
        );
        res.status(200).json({
            success: true,
            fleet: fleetWithTrips,
        });
    } catch (err) {
        console.error('Fleet Dashboard Error:', err.message);
        next(err);
    }
}

module.exports = { inviteDriver, addVehicle, getFleetStatus, getMyVehicleStatus, sendAlert, uploadVehiclePhoto, getDrivers, getFleetDashboard };
