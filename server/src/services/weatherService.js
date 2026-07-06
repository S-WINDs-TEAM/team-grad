const axios = require('axios');
const weatherCache = require('../models/WeatherCache');
const { encodeGeohash, roundToNearest30Min } = require('../utils/geoUtils');

// Open-Meteo for developement stage cause tommorw is 25req/h limitation

const fetchWeatherFromOpenMeteo = async (lat, lng, targetTime) => {
    const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
        params: {
            latitude: lat,
            longitude: lng,
            // hourly: 'temperature_2m,relative_humidity_2m,precipitation,weather_code,visibility,wind_speed_10m,wind_direction_10m',
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
            timezone: 'UTC' //    time zone
        }
    });

    const hourly = response.data.hourly;
    
    // (ETA)
    const targetHour = targetTime.toISOString().substring(0, 13) + ":00";
     //  "2026-06-21  fromat T15:00
    let index = hourly.time.findIndex(t => t === targetHour);
    if(!hourly || !hourly.time || hourly.time.length ===0) throw new Error('no weather data returned from open-mateo');
    if (index === -1) {
    console.warn(`no exact match for ${targetHour}, falling back to index 0`);
        index = 0; // first value for just check
    }
    // (WMO) convert code nums to words

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

    return {
        temperature: hourly.temperature_2m[index],
        feelsLike: hourly.apparent_temperature[index],
        windSpeed: hourly.wind_speed_10m[index],
        windDirection: hourly.wind_direction_10m[index],
        windGust: hourly.wind_gusts_10m[index],
        precipitation: hourly.precipitation[index],
        pop: hourly.precipitation_probability[index],
        humidity: hourly.relative_humidity_2m[index],
        pressure: hourly.surface_pressure[index],
        visibility: hourly.visibility[index] / 1000, //  make it by meter good for humans  
        clouds: hourly.cloud_cover[index],
        uvIndex: hourly.uv_index[index],
        dewPoint: hourly.dew_point_2m[index],
        condition: weatherInfo.condition,
        description: weatherInfo.description,
        icon: getIconCode(weatherInfo.condition),
    };
};





//     const getConditionFromWMO = (code) => {
//         if (code === 0) return 'clear';
//         if ([1, 2, 3].includes(code)) return 'partly_cloudy';
//         if ([45, 48].includes(code)) return 'fog';
//         if ([51, 53, 55, 56, 57].includes(code)) return 'drizzle';
//         if ([61, 63, 65, 66, 67].includes(code)) return 'rain';
//         if ([71, 73, 75, 77].includes(code)) return 'snow';
//         if ([80, 81, 82].includes(code)) return 'heavy_rain';
//         if ([95, 96, 99].includes(code)) return 'thunderstorm';
//         return 'unknown';
//     };

//     return {
//         temperature: hourly.temperature_2m[index],
//         windSpeed: hourly.wind_speed_10m[index],
//         windDirection: hourly.wind_direction_10m[index],
//         precipitation: hourly.precipitation[index],
//         visibility: hourly.visibility[index] / 1000, // 1000 = 1 km
//         humidity: hourly.relative_humidity_2m[index],
//         condition: getConditionFromWMO(hourly.weather_code[index]),
//     };
// };

/* 
//  Tomorrow.io code for production

const fetchWeatherFromTomorrowIO = async (lat, lng, targetTime) => {
    const response = await axios.get('https://api.tomorrow.io/v4/timelines', {
        params: {
            location: `${lat},${lng}`,
            apikey: process.env.TOMORROW_API_KEY,
            timesteps: '1h',
            startTime: targetTime.toISOString(),
            endTime: new Date(targetTime.getTime() + 60 * 60 * 1000).toISOString(),
            fields: 'temperature,windSpeed,windDirection,precipitationIntensity,visibility,humidity,weatherCode'
        },
    });

    const interval = response.data?.data?.timelines?.[0]?.intervals?.[0]?.values;
    if (!interval) throw new Error('no weather data returned from API');

    // ...    getCondition    ...

    return {
        temperature: interval.temperature,
        // ...  
    };
};
*/

const getWeatherForLocationAndTime = async (lat, lng, targetTime) => {
    const geohash = encodeGeohash(lat, lng);
    const roundedTime = roundToNearest30Min(targetTime);

    // search in cach first
    const cached = await weatherCache.findOne({ geohash, forecastTime: roundedTime });
    if (cached) {
        console.log(` Cache HIT: ${geohash} @ ${roundedTime}`);
        return cached.weatherData;
    }

    // if cach is empyt then Open-Meteo
    console.log(` API Call (Open-Meteo): ${geohash} @ ${roundedTime}`);
    const weatherData = await fetchWeatherFromOpenMeteo(lat, lng, roundedTime);

    // save data in cach
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