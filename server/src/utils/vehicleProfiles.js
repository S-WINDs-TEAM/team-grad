// 5 ready-made vehicle classes + motorcycle legacy, with physical properties
// sideArea   → lateral wind force (windPhysics.js)
// frontalArea → aerodynamic drag / fuel impact (geoUtils.calculateFuelImpact)
const VEHICLE_PROFILES = {
    car_small:   { label: 'Small Car',        cd: 0.30, sideArea: 3.5,  frontalArea: 1.9, weight: 1200,  windSensitivity: 0.6, baseSpeed: 120, fuelEfficiency: 6.0 },
    car_medium:  { label: 'SUV / Medium Car', cd: 0.35, sideArea: 4.2,  frontalArea: 2.4, weight: 1800,  windSensitivity: 0.7, baseSpeed: 120, fuelEfficiency: 8.0 },
    van:         { label: 'Van',              cd: 0.45, sideArea: 7.0,  frontalArea: 2.8, weight: 3000,  windSensitivity: 0.85, baseSpeed: 100, fuelEfficiency: 12.0 },
    truck_small: { label: 'Small Truck',      cd: 0.50, sideArea: 9.0,  frontalArea: 5.5, weight: 5000,  windSensitivity: 0.9, baseSpeed: 90,  fuelEfficiency: 20.0 },
    truck_large: { label: 'Large Truck',      cd: 0.60, sideArea: 14.0, frontalArea: 8.0, weight: 15000, windSensitivity: 1.0, baseSpeed: 90,  fuelEfficiency: 30.0 },
    motorcycle:  { label: 'Motorcycle',       cd: 0.50, sideArea: 0.6,  frontalArea: 0.6, weight: 200,   windSensitivity: 2.0, baseSpeed: 100, fuelEfficiency: 4.5 },
};
// old 3-type values (car/truck/motorcycle) still accepted everywhere
const LEGACY_MAP = { car: 'car_medium', truck: 'truck_small', motorcycle: 'motorcycle' };
const getVehicleProfile = (vehicleClass) =>
    VEHICLE_PROFILES[vehicleClass] || VEHICLE_PROFILES[LEGACY_MAP[vehicleClass]] || VEHICLE_PROFILES.car_medium;
const ALL_CLASSES = Object.keys(VEHICLE_PROFILES);
module.exports = { VEHICLE_PROFILES, LEGACY_MAP, getVehicleProfile, ALL_CLASSES };