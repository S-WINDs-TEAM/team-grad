
const { getWeatherForLocationAndTime } = require('../services/weatherService');

// GET /api/weather/current?lat=30.0444&lng=31.2357
// Fetches current weather for a given location without planning a full trip.
const getCurrentWeather = async (req, res, next) => {
    try {
        const { lat, lng } = req.query;

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);

        if (isNaN(latitude) || isNaN(longitude)) {
            return res.status(400).json({
                success: false,
                msg: 'lat and lng query params are required and must be numbers',
            });
        }

        // Use the current time rounded to the nearest hour for weather data.
        const currentTime = new Date();
        const weatherData = await getWeatherForLocationAndTime(latitude, longitude, currentTime);

        res.status(200).json({
            success: true,
            weather: weatherData,
            location: { lat: latitude, lng: longitude },
        });
    } catch (err) {
        console.error('Weather Controller Error:', err.message);
        next(err);
    }
};

module.exports = { getCurrentWeather };