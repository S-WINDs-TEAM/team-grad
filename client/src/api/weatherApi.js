import axiosInstance from './axiosInstance';

// NEW: Fetches current weather for a location (lat/lng)
const getCurrentWeatherApi = (lat, lng) =>
    axiosInstance.get('/weather/current', { params: { lat, lng } });

export { getCurrentWeatherApi };