// RISK TRANSLATOR – turns raw weather numbers into actionable insights

// Helper to get vehicle‑specific wind sensitivity
const getWindSensitivity = (vehicleType, vehicleHeight) => {
  if (vehicleType === 'truck') {
    return vehicleHeight === 'high' ? 2.0 : 1.4;
  }
  if (vehicleType === 'motorcycle') return 2.5;
  return 1.0; // car
};

//  Individual parameter translators 

const translateTemperature = (temp, vehicleType) => {
  if (temp > 40) return {
    level: 'critical',
    interpretation: 'Extremely hot (above 40°C). Risk of heat stress for drivers and engine overheating.',
    recommendation: 'Reduce speed, take breaks every hour, drink plenty of water. Avoid midday driving.',
  };
  if (temp > 35) return {
    level: 'high',
    interpretation: 'Very hot (35‑40°C). Can cause driver fatigue and tyre pressure issues.',
    recommendation: 'Take regular breaks, keep cabin cool, check tyre pressure.',
  };
  if (temp > 30) return {
    level: 'medium',
    interpretation: 'Warm (30‑35°C). Comfortable but may cause slight fatigue on long trips.',
    recommendation: 'Stay hydrated, use air conditioning if available.',
  };
  if (temp > 20) return {
    level: 'low',
    interpretation: 'Pleasant temperatures (20‑30°C). Ideal driving conditions.',
    recommendation: 'No special precautions needed.',
  };
  if (temp > 10) return {
    level: 'low',
    interpretation: 'Cool (10‑20°C). Comfortable for driving.',
    recommendation: 'No special precautions needed.',
  };
  return {
    level: 'medium',
    interpretation: 'Cold (below 10°C). Possible frost or ice on roads.',
    recommendation: 'Check for icy patches, reduce speed on bridges and shadows.',
  };
};

const translateHumidity = (humidity) => {
  if (humidity > 85) return {
    level: 'high',
    interpretation: 'Very humid (above 85%). High chance of fog and reduced visibility.',
    recommendation: 'Use fog lights, increase following distance, reduce speed.',
  };
  if (humidity > 70) return {
    level: 'medium',
    interpretation: 'Humid (70‑85%). Possible light fog or mist, especially in early morning.',
    recommendation: 'Be cautious in low‑visibility areas, use low beams.',
  };
  if (humidity > 40) return {
    level: 'low',
    interpretation: 'Moderate humidity (40‑70%). Comfortable, good visibility.',
    recommendation: 'No special precautions needed.',
  };
  return {
    level: 'low',
    interpretation: 'Low humidity (below 40%). Dry conditions, good visibility.',
    recommendation: 'No special precautions needed.',
  };
};

const translateWind = (windSpeed, vehicleType, vehicleHeight) => {
  const sensitivity = getWindSensitivity(vehicleType, vehicleHeight);
  const effective = windSpeed * sensitivity;
  if (effective > 60) return {
    level: 'critical',
    interpretation: `Extremely strong wind (effective ${Math.round(effective)} km/h). Dangerous for ${vehicleType}s, especially high‑profile vehicles.`,
    recommendation: 'Delay departure if possible. If driving, reduce speed to 40 km/h, grip steering firmly.',
  };
  if (effective > 40) return {
    level: 'high',
    interpretation: `Strong wind (effective ${Math.round(effective)} km/h). Affects vehicle stability, especially on open roads and bridges.`,
    recommendation: 'Reduce speed, avoid sudden lane changes, keep both hands on wheel.',
  };
  if (effective > 25) return {
    level: 'medium',
    interpretation: `Moderate wind (effective ${Math.round(effective)} km/h). Noticeable but manageable.`,
    recommendation: 'Stay alert, especially when overtaking or passing high‑sided vehicles.',
  };
  return {
    level: 'low',
    interpretation: `Light wind (effective ${Math.round(effective)} km/h). No significant impact.`,
    recommendation: 'Drive normally.',
  };
};

const translateVisibility = (visibility) => {
  if (visibility < 0.1) return {
    level: 'critical',
    interpretation: 'Virtually zero visibility (< 100m). Likely dense fog or sandstorm.',
    recommendation: 'Pull over safely, use hazard lights, wait for conditions to improve.',
  };
  if (visibility < 0.2) return {
    level: 'high',
    interpretation: 'Very poor visibility (100‑200m). Dangerous for driving.',
    recommendation: 'Reduce speed to 30 km/h, use fog lights, keep safe distance.',
  };
  if (visibility < 0.5) return {
    level: 'medium',
    interpretation: 'Poor visibility (200‑500m). Caution required.',
    recommendation: 'Reduce speed, use low beams, increase following distance.',
  };
  if (visibility < 1) return {
    level: 'low',
    interpretation: 'Moderate visibility (500m‑1km). Generally safe but stay alert.',
    recommendation: 'Drive with caution, watch for sudden changes.',
  };
  return {
    level: 'low',
    interpretation: 'Good visibility (above 1km). Clear conditions.',
    recommendation: 'Drive normally.',
  };
};

const translatePrecipitation = (precip) => {
  if (precip > 20) return {
    level: 'high',
    interpretation: `Heavy rain (${precip}mm/h). Risk of flooding, aquaplaning, and reduced grip.`,
    recommendation: 'Reduce speed to 40‑60 km/h, avoid puddles, increase following distance.',
  };
  if (precip > 10) return {
    level: 'medium',
    interpretation: `Moderate rain (${precip}mm/h). Wet roads, longer braking distance.`,
    recommendation: 'Reduce speed, turn on wipers, keep safe distance.',
  };
  if (precip > 2) return {
    level: 'low',
    interpretation: `Light rain (${precip}mm/h). Slightly wet roads.`,
    recommendation: 'Drive cautiously, roads may be slippery.',
  };
  return {
    level: 'low',
    interpretation: 'No significant precipitation.',
    recommendation: 'No special precautions.',
  };
};

//  Main aggregator -
export const interpretWeather = (weatherData, vehicleType = 'car', vehicleHeight = 'medium') => {
  const { temperature, humidity, windSpeed, visibility, precipitation, condition, description } = weatherData;

  const tempResult = translateTemperature(temperature, vehicleType);
  const humidResult = translateHumidity(humidity);
  const windResult = translateWind(windSpeed, vehicleType, vehicleHeight);
  const visResult = translateVisibility(visibility);
  const precipResult = translatePrecipitation(precipitation);

  // Collect all interpretations and recommendations
  const details = [
    { param: 'Temperature', ...tempResult },
    { param: 'Humidity', ...humidResult },
    { param: 'Wind', ...windResult },
    { param: 'Visibility', ...visResult },
    { param: 'Precipitation', ...precipResult },
  ];

  // Determine overall risk level (highest among params)
  const levels = ['low', 'medium', 'high', 'critical'];
  const maxLevel = details.reduce((max, d) => {
    const idx = levels.indexOf(d.level);
    return idx > max ? idx : max;
  }, 0);
  const overallRisk = levels[maxLevel];

  // Build a human‑readable summary
  const summary = `Condition: ${description || condition}. ${tempResult.interpretation} ${windResult.interpretation}`;

  // Build a concise overall recommendation based on the highest risk parameter
  const highest = details.find(d => d.level === levels[maxLevel]);
  const recommendation = highest ? highest.recommendation : 'Drive normally.';

  return {
    overallRisk,
    summary,
    details,
    recommendation,
  };
};