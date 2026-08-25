const ngeohash = require("ngeohash");

// NEW: physical profiles (Cd & frontalArea per class) — aliased to avoid
// clashing with the legacy getVehicleProfile defined in this file
const { getVehicleProfile: getPhysicalProfile } = require("./vehicleProfiles");
const { VEHICLE_PROFILES } = require("./vehicleProfiles");

// Resolve the physical profile for the 6 vehicle classes, falling back to the
// legacy getVehicleProfile for old values (car/truck/motorcycle/bus).
const resolveProfile = (vehicleType, vehicleHeight = "medium") => {
  const heightFactor =
    vehicleHeight === "high" ? 0.8 : vehicleHeight === "medium" ? 0.6 : 0.4;
  if (VEHICLE_PROFILES[vehicleType]) {
    const p = VEHICLE_PROFILES[vehicleType];
    return {
      baseSpeed: p.baseSpeed,
      windSensitivity: p.windSensitivity,
      heightFactor,
      fuelEfficiency: p.fuelEfficiency,
    };
  }
  return getVehicleProfile(vehicleType, vehicleHeight); // legacy
};

// FIX: إضافة معامل vehicleHeight لتحسين تأثير الرياح على المركبات المختلفة
const encodeGeohash = (lat, lng, precision = 5) => {
  return ngeohash.encode(lat, lng, precision);
};

const roundToNearest30Min = (date) => {
  const ms = 30 * 60 * 1000;
  return new Date(Math.round(date.getTime() / ms) * ms);
};

// IMPROVEMENT: إضافة معامل vehicleHeight و roadMaxSpeed لتطوير الخوارزمية
// NEW: دالة مساعدة لجلب خصائص المركبة حسب النوع والارتفاع
const getVehicleProfile = (vehicleType, vehicleHeight = "medium") => {
  const profiles = {
    car: {
      baseSpeed: 120,
      windSensitivity: 1.0,
      heightFactor:
        vehicleHeight === "high" ? 0.6 : vehicleHeight === "medium" ? 0.4 : 0.3,
      fuelEfficiency: 8.0, // لتر/100 كم
    },
    motorcycle: {
      baseSpeed: 100,
      windSensitivity: 2.0,
      heightFactor: 0.2,
      fuelEfficiency: 4.5,
    },
    truck: {
      baseSpeed: 90,
      windSensitivity: 1.8,
      heightFactor:
        vehicleHeight === "high" ? 0.8 : vehicleHeight === "medium" ? 0.6 : 0.5,
      fuelEfficiency: 25.0,
    },
    bus: {
      baseSpeed: 80,
      windSensitivity: 1.6,
      heightFactor: 0.7,
      fuelEfficiency: 30.0,
    },
  };
  return profiles[vehicleType] || profiles.car;
};

// NEW: حساب تأثير سرعة الرياح على المركبة
const calculateWindImpact = (windSpeed, vehicleProfile) => {
  // كلما زاد ارتفاع المركبة وحساسيتها للرياح، زاد التأثير
  const windReduction =
    (windSpeed * vehicleProfile.windSensitivity * vehicleProfile.heightFactor) /
    2;
  const safeWindSpeed = Math.max(20, 80 - windReduction);
  return Math.round(safeWindSpeed);
};

// IMPROVEMENT: حساب السرعة الآمنة النهائية مع دمج السرعة القانونية
const calculateMaxSafeSpeed = (
  weatherData,
  vehicleType,
  vehicleHeight = "medium",
  roadMaxSpeed = 120, // NEW: السرعة القانونية للطريق
) => {
  const { condition, windSpeed, visibility, precipitation } = weatherData;

  // جلب خصائص المركبة
  const profile = resolveProfile(vehicleType, vehicleHeight);
  let speedLimit = profile.baseSpeed;

  // 1. تأثير الرؤية (متدرج حسب شدة الضباب/العواصف)
  if (condition === "sandstorm") {
    speedLimit = Math.min(speedLimit, 25);
  } else if (condition === "fog") {
    speedLimit = Math.min(speedLimit, 40);
  } else if (visibility < 0.1) {
    speedLimit = Math.min(speedLimit, 30);
  } else if (visibility < 0.2) {
    speedLimit = Math.min(speedLimit, 40);
  } else if (visibility < 0.5) {
    speedLimit = Math.min(speedLimit, 60);
  } else if (visibility < 1.0) {
    speedLimit = Math.min(speedLimit, 80);
  }

  // 2. تأثير هطول الأمطار (متدرج)
  if (precipitation > 20) {
    speedLimit = Math.min(speedLimit, 40);
  } else if (precipitation > 10) {
    speedLimit = Math.min(speedLimit, 60);
  } else if (precipitation > 2) {
    speedLimit = Math.min(speedLimit, 80);
  }

  // 3. تأثير سرعة الرياح (حسب ارتفاع المركبة وحساسيتها)
  const windLimit = calculateWindImpact(windSpeed, profile);
  speedLimit = Math.min(speedLimit, windLimit);

  // 4. تأثير خاص للشاحنات العالية (رياح جانبية)
  if (vehicleType === "truck" && vehicleHeight === "high") {
    if (windSpeed > 40) speedLimit = Math.min(speedLimit, 60);
    if (windSpeed > 60) speedLimit = Math.min(speedLimit, 40);
  }

  // 5. تأثير السرعة القانونية للطريق (الأهم)
  // FIX: دمج السرعة القانونية مع السرعة الآمنة حسب الطقس
  speedLimit = Math.min(speedLimit, roadMaxSpeed);

  return Math.round(speedLimit);
};

// IMPROVEMENT: حساب مستوى الخطر متعدد العوامل
const calculateRiskLevel = (
  weatherData,
  vehicleType,
  vehicleHeight = "medium",
  roadMaxSpeed = 120,
) => {
  const { condition, windSpeed, visibility, precipitation, windGust } =
    weatherData;

  // حساب السرعة الآمنة باستخدام الدالة المطورة
  const maxSafeSpeed = calculateMaxSafeSpeed(
    weatherData,
    vehicleType,
    vehicleHeight,
    roadMaxSpeed,
  );

  let riskScore = 0;

  // 1. مستوى الخطر من السرعة الآمنة (0-5 نقاط)
  if (maxSafeSpeed <= 30) riskScore += 5;
  else if (maxSafeSpeed <= 40) riskScore += 4;
  else if (maxSafeSpeed <= 60) riskScore += 3;
  else if (maxSafeSpeed <= 80) riskScore += 2;
  else riskScore += 1;

  // 2. تأثير الأمطار الغزيرة
  if (precipitation > 15) riskScore += 2;
  else if (precipitation > 10) riskScore += 1;

  // 3. تأثير هبوب الرياح (Wind Gusts)
  if (windGust > 60) riskScore += 2;
  else if (windGust > 40) riskScore += 1;

  // 4. تأثير الرؤية الشديدة الانخفاض
  if (visibility < 0.1) riskScore += 2;
  else if (visibility < 0.2) riskScore += 1;

  // 5. تأثير الظروف الخاصة
  if (condition === "sandstorm") riskScore += 2;
  else if (condition === "fog") riskScore += 1;

  // تحويل الـ riskScore لمستوى خطر
  if (riskScore >= 7) return "high";
  if (riskScore >= 4) return "medium";
  return "low";
};

// IMPROVED (credibility fix): fuel impact now reads per-class Cd & frontalArea
// from vehicleProfiles, and reports ONLY the wind-induced extra fuel,
// converted with documented physical constants (no magic factors).
const calculateFuelImpact = (
  weatherData,
  vehicleType,
  vehicleHeight = "medium",
  speed,
) => {
  const { windSpeed, windDirection } = weatherData;
  const physical = getPhysicalProfile(vehicleType);

  // documented physical constants
  const rho = 1.225; // air density (kg/m3)
  const ENGINE_EFFICIENCY = 0.3; // typical gasoline engine efficiency
  const FUEL_ENERGY_J_PER_L = 34.2e6; // gasoline energy density (J/L)

  // per-class aerodynamic properties (no more hardcoded guesses)
  const cd = physical.cd;
  const frontalArea = physical.frontalArea;

  // headwind component (positive = against the vehicle)
  const windAngleRad = (windDirection || 0) * (Math.PI / 180);
  const headwindComponent = (windSpeed || 0) * Math.cos(windAngleRad);

  const v = speed || 90; // vehicle speed (km/h)
  const vMs = v / 3.6;
  const relWithWind = Math.max(0, v + headwindComponent) / 3.6;
  const relNoWind = vMs;

  // aerodynamic drag with wind vs without wind
  const dragWithWind = 0.5 * rho * cd * frontalArea * relWithWind * relWithWind;
  const dragNoWind = 0.5 * rho * cd * frontalArea * relNoWind * relNoWind;

  // extra power the engine must deliver BECAUSE of the wind
  const extraPower = Math.max(0, dragWithWind - dragNoWind) * vMs; // Watts

  // convert extra power → extra fuel per 100km at this speed
  const secondsPer100km = 100000 / vMs;
  const extraFuelPer100km =
    (extraPower / (ENGINE_EFFICIENCY * FUEL_ENERGY_J_PER_L)) * secondsPer100km;

  return {
    extraFuelPer100km: Math.round(extraFuelPer100km * 10) / 10,
    headwindComponent: Math.round(headwindComponent),
    dragForce: Math.round(dragWithWind),
  };
};

// NEW: حساب الوقت المتوقع للخروج من المدينة
const calculateUrbanExitTime = (
  urbanSegments,
  speedInUrban,
  speedInHighway,
) => {
  // urbanSegments: مصفوفة من المسافات في المناطق الحضرية (كم)
  // speedInUrban: السرعة المتوقعة في المدينة (كم/س)
  // speedInHighway: السرعة المتوقعة خارج المدينة (كم/س)

  let totalUrbanTime = 0;
  let totalHighwayTime = 0;

  urbanSegments.forEach((segment) => {
    if (segment.isUrban) {
      totalUrbanTime += segment.distance / (speedInUrban || 40);
    } else {
      totalHighwayTime += segment.distance / (speedInHighway || 90);
    }
  });

  return {
    totalUrbanTimeMinutes: Math.round(totalUrbanTime * 60),
    totalHighwayTimeMinutes: Math.round(totalHighwayTime * 60),
    exitTime: totalUrbanTime * 60, // بالدقائق
  };
};

module.exports = {
  encodeGeohash,
  roundToNearest30Min,
  calculateMaxSafeSpeed, // FIX: تم تغيير الاسم من calculatemaxSafeSpeed
  calculateRiskLevel,
  calculateFuelImpact, // NEW
  calculateUrbanExitTime, // NEW
  getVehicleProfile, // NEW
  calculateWindImpact, // NEW
};
