import { useState, useEffect } from 'react';
import { getCurrentWeatherApi } from '../api/weatherApi';
import useGeolocation from './useGeolocation';

// NEW: Custom hook that combines geolocation and weather fetching.
const useLocalWeather = () => {
    const { location, loading: locLoading, error: locError } = useGeolocation();
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (locLoading) return;

        if (locError) {
            setError(locError);
            setLoading(false);
            return;
        }

        if (!location) {
            setError('No location available.');
            setLoading(false);
            return;
        }

        const fetchWeather = async () => {
            setLoading(true);
            try {
                const response = await getCurrentWeatherApi(location.lat, location.lng);
                setWeather(response.data.weather);
                setError(null);
            } catch (err) {
                console.error('Weather fetch error:', err);
                setError(err.response?.data?.msg || 'Failed to fetch local weather.');
            } finally {
                setLoading(false);
            }
        };

        fetchWeather();
    }, [location, locLoading, locError]);

    return { weather, loading, error, location };
};

export default useLocalWeather;