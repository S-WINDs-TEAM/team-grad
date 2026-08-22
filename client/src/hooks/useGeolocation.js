import { useState, useEffect } from 'react';

// NEW: Custom hook to get user's location via GPS or fallback to IP.
const useGeolocation = () => {
    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if Geolocation API is supported
        if (!navigator.geolocation) {
            // Fallback: Fetch location via IP (ip-api.com is free)
            fetch('http://ip-api.com/json/')
                .then((res) => res.json())
                .then((data) => {
                    if (data.status === 'success') {
                        setLocation({
                            lat: data.lat,
                            lng: data.lon,
                            source: 'IP',
                            city: data.city,
                            country: data.country,
                        });
                    } else {
                        setError('Could not determine location via IP.');
                    }
                    setLoading(false);
                })
                .catch(() => {
                    setError('Network error while fetching IP location.');
                    setLoading(false);
                });
            return;
        }

        // Try GPS first (high accuracy)
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    source: 'GPS',
                    accuracy: position.coords.accuracy,
                });
                setLoading(false);
            },
            (err) => {
                // If GPS fails, fallback to IP
                console.warn('GPS failed, falling back to IP:', err.message);
                fetch('http://ip-api.com/json/')
                    .then((res) => res.json())
                    .then((data) => {
                        if (data.status === 'success') {
                            setLocation({
                                lat: data.lat,
                                lng: data.lon,
                                source: 'IP',
                                city: data.city,
                                country: data.country,
                            });
                        } else {
                            setError('Could not determine location.');
                        }
                        setLoading(false);
                    })
                    .catch(() => {
                        setError('Network error while fetching IP location.');
                        setLoading(false);
                    });
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000,
            }
        );
    }, []);

    return { location, error, loading };
};

export default useGeolocation;