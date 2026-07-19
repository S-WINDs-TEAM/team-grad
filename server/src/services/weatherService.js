const axios = require('axios');
const weatherCache = require('../models/WeatherCache');
const { encodeGeohash, roundToNearest30Min } = require('../utils/geoUtils');

// Open-Meteo for development stage (free tier: 25 req/h limitation)

const fetchWeatherFromOpenMeteo = async (lat, lng, targetTime) => {
    const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
        params: {
            latitude: lat,
            longitude: lng,
            hourly: [
                'temperature_2m',
                'apparent_temperature',
                'relative_humidity_2m',
                'precipitation',
                'precipitation_probability',
                'weather_code',
                'visibility',
                'wind_speed_10m',
                'wind_direction_10m',
                'wind_gusts_10m',
                'surface_pressure',
                'cloud_cover',
                'uv_index',
                'dew_point_2m',
            ].join(','),
            timezone: 'UTC'
        }
    });

    const hourly = response.data.hourly;
    if (!hourly || !hourly.time || hourly.time.length === 0) {
        throw new Error('no weather data returned from Open-Meteo');
    }

    // Find the index for the target hour
    const targetHour = targetTime.toISOString().substring(0, 13) + ":00";
    let index = hourly.time.findIndex(t => t === targetHour);
    if (index === -1) {
        console.warn(`no exact match for ${targetHour}, falling back to index 0`);
        index = 0;
    }

    // WMO code mapping
    const wmoMap = {
        0: { condition: 'clear', description: 'Clear sky' },
        1: { condition: 'partly_cloudy', description: 'Mainly clear' },
        2: { condition: 'partly_cloudy', description: 'Partly cloudy' },
        3: { condition: 'partly_cloudy', description: 'Overcast' },
        45: { condition: 'fog', description: 'Fog' },
        48: { condition: 'fog', description: 'Depositing rime fog' },
        51: { condition: 'drizzle', description: 'Light drizzle' },
        53: { condition: 'drizzle', description: 'Moderate drizzle' },
        55: { condition: 'drizzle', description: 'Dense drizzle' },
        56: { condition: 'drizzle', description: 'Light freezing drizzle' },
        57: { condition: 'drizzle', description: 'Dense freezing drizzle' },
        61: { condition: 'rain', description: 'Slight rain' },
        63: { condition: 'rain', description: 'Moderate rain' },
        65: { condition: 'rain', description: 'Heavy rain' },
        66: { condition: 'rain', description: 'Light freezing rain' },
        67: { condition: 'rain', description: 'Heavy freezing rain' },
        71: { condition: 'snow', description: 'Slight snow fall' },
        73: { condition: 'snow', description: 'Moderate snow fall' },
        75: { condition: 'snow', description: 'Heavy snow fall' },
        77: { condition: 'snow', description: 'Snow grains' },
        80: { condition: 'heavy_rain', description: 'Slight rain showers' },
        81: { condition: 'heavy_rain', description: 'Moderate rain showers' },
        82: { condition: 'heavy_rain', description: 'Violent rain showers' },
        95: { condition: 'thunderstorm', description: 'Thunderstorm' },
        96: { condition: 'thunderstorm', description: 'Thunderstorm with slight hail' },
        99: { condition: 'thunderstorm', description: 'Thunderstorm with heavy hail' },
    };

    const getWeatherInfo = (code) => wmoMap[code] || { condition: 'unknown', description: 'Unknown conditions' };
    const weatherInfo = getWeatherInfo(hourly.weather_code[index]);

    const getIconCode = (condition) => {
        const icons = {
            clear: 'clear-day',
            partly_cloudy: 'cloudy',
            fog: 'fog',
            drizzle: 'drizzle',
            rain: 'rain',
            heavy_rain: 'heavy-rain',
            snow: 'snow',
            thunderstorm: 'thunderstorm',
            unknown: 'unknown',
        };
        return icons[condition] || 'unknown';
    };

    // Build weather data object
    let weatherData = {
        temperature: hourly.temperature_2m[index],
        feelsLike: hourly.apparent_temperature[index],
        windSpeed: hourly.wind_speed_10m[index],
        windDirection: hourly.wind_direction_10m[index],
        windGust: hourly.wind_gusts_10m[index],
        precipitation: hourly.precipitation[index],
        pop: hourly.precipitation_probability[index],
        humidity: hourly.relative_humidity_2m[index],
        pressure: hourly.surface_pressure[index],
        visibility: hourly.visibility[index] / 1000,
        clouds: hourly.cloud_cover[index],
        uvIndex: hourly.uv_index[index],
        dewPoint: hourly.dew_point_2m[index],
        condition: weatherInfo.condition,
        description: weatherInfo.description,
        icon: getIconCode(weatherInfo.condition),
    };

    // ================================================================
    // 🧪 TESTING: Force dangerous weather on a specific zone (KM 45–48)
    // ================================================================
    // This block overrides weather data for coordinates within the danger zone.
    // After testing, remove or comment out this block to restore normal behavior.
    const isDangerZone = (lat, lng) => {
        // Cairo-Alexandria road: KM 45–48 roughly at lat 30.22–30.30, lng 30.48–30.58
        const latMin = 30.22;
        const latMax = 30.30;
        const lngMin = 30.48;
        const lngMax = 30.58;
        return lat >= latMin && lat <= latMax && lng >= lngMin && lng <= lngMax;
    };

    if (isDangerZone(lat, lng)) {
        // Override weather to simulate a sandstorm
        weatherData.condition = 'sandstorm';
        weatherData.description = 'Severe sandstorm with near-zero visibility';
        weatherData.visibility = 0.15; // 150 meters → very low visibility
        weatherData.windSpeed = 80;     // 80 km/h → very high wind
        weatherData.windGust = 120;     // Gusts up to 120 km/h
        weatherData.precipitation = 0;
        weatherData.humidity = 20;
        weatherData.temperature = 32;
        weatherData.feelsLike = 28;
        // This will trigger `riskLevel = 'high'` in geoUtils.js
        console.log(`🧪 DANGER ZONE: ${lat}, ${lng} → Forcing sandstorm`);
    }
    // ================================================================
    // End of testing block
    // ================================================================

    return weatherData;
};

const getWeatherForLocationAndTime = async (lat, lng, targetTime) => {
    const geohash = encodeGeohash(lat, lng);
    const roundedTime = roundToNearest30Min(targetTime);

    // Check cache first
    const cached = await weatherCache.findOne({ geohash, forecastTime: roundedTime });
    if (cached) {
        console.log(`✅ Cache HIT: ${geohash} @ ${roundedTime}`);
        return cached.weatherData;
    }

    // Cache miss → fetch from Open-Meteo
    console.log(`🌤️ API Call (Open-Meteo): ${geohash} @ ${roundedTime}`);
    const weatherData = await fetchWeatherFromOpenMeteo(lat, lng, roundedTime);

    // Save to cache
    try {
        await weatherCache.findOneAndUpdate(
            { geohash, forecastTime: roundedTime },
            { geohash, forecastTime: roundedTime, weatherData },
            { upsert: true, new: true }
        );
    } catch (err) {
        if (err.code !== 11000) throw err;
    }

    return weatherData;
};

module.exports = { getWeatherForLocationAndTime };