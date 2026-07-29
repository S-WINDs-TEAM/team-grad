import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom'; // NEW: for reading tripId from URL
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { planRouteApi, smartDepartureApi, getTripByIdApi } from '../api/routeApi'; // NEW: added getTripByIdApi
import { getAdsRecommendationsApi } from '../api/adsApi';
import LocationAutocomplete from '../components/LocationAutocomplete';
import RouteLoadingSkeleton from '../components/routeLoadingSkeleton';
import MapView from '../components/MapView';
import WaypointCard from '../components/WaypointCard';
import { setCurrentTrip, setLoading, setError, clearCurrentTrip } from '../store/tripSlice';

// weather condition strings that come back from the backend (see server weatherService.js)
const RAIN_CONDITIONS = ['rain', 'drizzle', 'heavy_rain', 'thunderstorm'];

const TripPlannerPage = () => {
    const { handleSubmit, formState: { isSubmitting }, watch, setValue } = useForm({
        defaultValues: { vehicleType: 'car' },
    });
    const [origin, setOrigin] = useState(null);
    const [destination, setDestination] = useState(null);
    const [localError, setLocalError] = useState(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState('car');

    // Smart Departure
    const [showSmartDeparture, setShowSmartDeparture] = useState(false);
    const [smartDepartureLoading, setSmartDepartureLoading] = useState(false);
    const [smartDepartureSuggestions, setSmartDepartureSuggestions] = useState(null);

    // Ads / Nearby Stops
    const [nearbyAds, setNearbyAds] = useState([]);

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { currentTrip, loading } = useSelector((state) => state.trip);
    const vehicleType = watch('vehicleType');

    // ================================================================
    // NEW: Load trip from URL if ?tripId is present
    // ================================================================
    const [searchParams] = useSearchParams();
    const tripId = searchParams.get('tripId');

    useEffect(() => {
        if (tripId) {
            const loadTrip = async () => {
                try {
                    const response = await getTripByIdApi(tripId);
                    const tripData = response.data.trip;

                    // tripData.waypoints is the full 5km array stored in the database
                    const fullWaypoints = tripData.waypoints || [];

                    // Compute a 30‑km sample from the full waypoints
                    let sampledWaypoints = [];
                    if (fullWaypoints.length > 0) {
                        const totalDistance = fullWaypoints[fullWaypoints.length - 1]?.distanceFromStart || 0;
                        const targetCount = Math.max(2, Math.ceil(totalDistance / 30));
                        const step = Math.max(1, Math.floor(fullWaypoints.length / targetCount));
                        for (let i = 0; i < fullWaypoints.length; i += step) {
                            sampledWaypoints.push(fullWaypoints[i]);
                        }
                        // Ensure the last point is always included
                        const last = fullWaypoints[fullWaypoints.length - 1];
                        if (sampledWaypoints[sampledWaypoints.length - 1] !== last) {
                            sampledWaypoints.push(last);
                        }
                    }

                    // Set the trip in Redux with both summary (30km) and detailed (5km) waypoints
                    dispatch(setCurrentTrip({
                        ...tripData,
                        waypoints: sampledWaypoints,          // 30km summary
                        detailedWaypoints: fullWaypoints,     // 5km full details
                    }));

                    // Fill the form fields so the user sees the route data
                    setOrigin(tripData.origin);
                    setDestination(tripData.destination);
                    setSelectedVehicle(tripData.vehicleType || 'car');
                    setValue('vehicleType', tripData.vehicleType || 'car');

                } catch (err) {
                    toast.error('Could not load trip details');
                }
            };
            loadTrip();
        }
    }, [tripId, dispatch, setValue]);

    // === handle vehicle type change ===
    useEffect(() => {
        setSelectedVehicle(vehicleType);
    }, [vehicleType]);

    // === onSubmit: plan a new route ===
    const onSubmit = async () => {
        if (!origin || !destination) {
            setLocalError('Please select both departure and destination locations');
            return;
        }

        setLocalError(null);
        setIsCalculating(true);
        dispatch(setLoading(true));

        try {
            const payload = { origin, destination, vehicleType };
            const response = await planRouteApi(payload);
            dispatch(setCurrentTrip(response.data.trip));
        } catch (err) {
            const msg = err.response?.data?.msg || 'Failed to plan route';
            setLocalError(msg);
            dispatch(setError(msg));
        } finally {
            setIsCalculating(false);
            dispatch(setLoading(false));
        }
    };

    // === clear current trip ===
    const handleNewTrip = () => {
        dispatch(clearCurrentTrip());
        setOrigin(null);
        setDestination(null);
        setShowSmartDeparture(false);
        setSmartDepartureSuggestions(null);
        setNearbyAds([]);
    };

    // === Smart Departure ===
    const handleSmartDeparture = async () => {
        if (!origin || !destination) return;
        setShowSmartDeparture(true);
        setSmartDepartureLoading(true);
        try {
            const response = await smartDepartureApi({
                origin,
                destination,
                vehicleType: selectedVehicle,
                windowHours: 6,
                intervalMinutes: 60,
            });
            setSmartDepartureSuggestions(response.data.suggestions);
        } catch (err) {
            setLocalError(err.response?.data?.msg || 'Failed to get smart departure suggestions');
        } finally {
            setSmartDepartureLoading(false);
        }
    };

    // === Nearby Stops (ads) ===
    useEffect(() => {
        if (!currentTrip || !destination) {
            setNearbyAds([]);
            return;
        }

        const fetchAds = async () => {
            try {
                const lastWaypoint = currentTrip.waypoints[currentTrip.waypoints.length - 1];
                const w = lastWaypoint?.weather;

                let condition;
                if (w) {
                    if (RAIN_CONDITIONS.includes(w.condition)) condition = 'rain';
                    else if (w.temperature >= 35) condition = 'heat';
                    else if (w.visibility < 2) condition = 'dust';
                }

                const response = await getAdsRecommendationsApi({
                    lat: destination.lat,
                    lng: destination.lng,
                    condition,
                });
                setNearbyAds(response.data.ads);
            } catch (err) {
                setNearbyAds([]);
            }
        };
        fetchAds();
    }, [currentTrip, destination]);

    // === Helpers for display ===
    const trip = currentTrip;
    const originFromTrip = trip?.origin || null;
    const destinationFromTrip = trip?.destination || null;
    const tripVehicleType = trip?.vehicleType || 'car';

    const getDisplayData = (waypoint) => {
        if (!waypoint.speeds || !waypoint.risks) {
            return {
                maxSafeSpeed: waypoint.maxSafeSpeed,
                riskLevel: waypoint.weather.riskLevel
            };
        }
        return {
            maxSafeSpeed: waypoint.speeds[selectedVehicle] || waypoint.maxSafeSpeed,
            riskLevel: waypoint.risks[selectedVehicle] || waypoint.weather.riskLevel
        };
    };

    const riskColor = (risk) => (risk === 'high' ? '#ff4d4d' : risk === 'medium' ? '#f5a623' : '#d4ff00');
    const adIcon = (type) => (type === 'rest' ? '🛌' : type === 'wash' ? '🚿' : '⛽');

    // ================================================================
    // Render
    // ================================================================
    return (
        <div style={styles.page}>
            <header style={styles.header}>
                <span 
                    style={styles.logo} 
                    onClick={() => navigate('/')}
                >
                    ⚡ S-WINDS
                </span>
                <span style={styles.status}>● SYSTEM ONLINE</span>
            </header>

            <div style={styles.grid}>
                {/* Left Panel: Form */}
                <div style={styles.panel}>
                    <h2 style={styles.panelTitle}>Route Configuration</h2>

                    <form onSubmit={handleSubmit(onSubmit)} style={styles.form}>
                        <LocationAutocomplete
                            label="Departure Station"
                            placeholder="Type a city or address..."
                            onSelect={setOrigin}
                            defaultValue={originFromTrip?.address || ''}
                        />

                        <LocationAutocomplete
                            label="Destination Station"
                            placeholder="Type a city or address..."
                            onSelect={setDestination}
                            defaultValue={destinationFromTrip?.address || ''}
                        />

                        <label style={styles.label}>Vehicle Class</label>
                        <div style={styles.vehicleRow}>
                            {['car', 'truck', 'motorcycle'].map((v) => (
                                <div
                                    key={v}
                                    style={{
                                        ...styles.vehicleOption,
                                        ...(selectedVehicle === v ? styles.vehicleOptionActive : {}),
                                    }}
                                    onClick={() => {
                                        setValue('vehicleType', v);
                                        setSelectedVehicle(v);
                                    }}
                                >
                                    {v === 'car' && '🚗 CAR'}
                                    {v === 'truck' && '🚛 TRUCK'}
                                    {v === 'motorcycle' && '🏍️ MOTORCYCLE'}
                                </div>
                            ))}
                        </div>

                        <button 
                            type="submit" 
                            disabled={isSubmitting || isCalculating} 
                            style={styles.button}
                        >
                            {isCalculating ? 'Calculating Route...' : '▶ Plan My Route'}
                        </button>

                        {localError && <p style={styles.error}>{localError}</p>}
                    </form>

                    {trip && (
                        <>
                            <button
                                onClick={handleSmartDeparture}
                                disabled={smartDepartureLoading}
                                style={styles.smartDepartureBtn}
                            >
                                {smartDepartureLoading ? 'Comparing departure times...' : '⚡ Smart Departure'}
                            </button>
                            <button 
                                onClick={handleNewTrip} 
                                style={styles.newTripBtn}
                            >
                                + New Trip
                            </button>
                        </>
                    )}

                    {/* Smart Departure panel */}
                    {showSmartDeparture && (
                        <div style={styles.smartDeparturePanel}>
                            <div style={styles.smartDepartureHeader}>
                                <span style={styles.smartDepartureTitle}>Smart Departure</span>
                                <span
                                    style={styles.smartDepartureClose}
                                    onClick={() => setShowSmartDeparture(false)}
                                >
                                    ✕
                                </span>
                            </div>
                            <p style={styles.smartDepartureSub}>
                                Comparing departure times over the next 6 hours
                            </p>

                            {smartDepartureLoading && (
                                <p style={styles.smartDepartureSub}>Loading suggestions…</p>
                            )}

                            {!smartDepartureLoading && smartDepartureSuggestions?.map((s, i) => (
                                <div
                                    key={i}
                                    style={{
                                        ...styles.suggestionRow,
                                        ...(s.isBest ? styles.suggestionRowBest : {}),
                                    }}
                                >
                                    <div>
                                        <div style={styles.suggestionTime}>
                                            {new Date(s.departureTime).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                                            {s.isBest && <span style={styles.bestBadge}>BEST</span>}
                                        </div>
                                        <div style={styles.suggestionSub}>{s.summary}</div>
                                    </div>
                                    <div style={styles.suggestionRight}>
                                        <div style={{ color: riskColor(s.overallRisk), fontSize: '0.75rem', fontWeight: '700' }}>
                                            {s.overallRisk.toUpperCase()}
                                        </div>
                                        <div style={styles.suggestionDuration}>
                                            {Math.round(s.totalDurationMin / 60)}h {Math.round(s.totalDurationMin % 60)}m
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Panel: Map & Results */}
                <div style={styles.resultsPanel}>
                    {isCalculating && (
                        <>
                            <h2 style={styles.panelTitle}>Calculating route weather...</h2>
                            <RouteLoadingSkeleton />
                        </>
                    )}

                    {!isCalculating && trip && (
                        <>
                            {/* Map */}
                            <div style={styles.mapSection}>
                                <MapView
                                    routePolyline={trip.routePolyline}
                                    waypoints={trip.waypoints}           // 30km summary
                                    detailedWaypoints={trip.detailedWaypoints} // 5km details
                                    origin={originFromTrip}
                                    destination={destinationFromTrip}
                                    vehicleType={selectedVehicle}
                                />
                            </div>

                            {/* Summary */}
                            <div style={styles.summaryRow}>
                                <span style={styles.summaryItem}>📏 {trip.totalDistanceKm.toFixed(0)} km</span>
                                <span style={styles.summaryItem}>⏱ {Math.round(trip.totalDurationMin)} min</span>
                                <span style={{
                                    ...styles.summaryItem,
                                    color: riskColor(trip.overallRiskLevel),
                                }}>
                                    Risk: {trip.overallRiskLevel.toUpperCase()}
                                </span>
                            </div>

                            {/* Waypoint Cards */}
                            <div style={styles.cardsContainer}>
                                {trip.waypoints.map((wp, i) => {
                                    const displayData = getDisplayData(wp);
                                    const enhancedWp = {
                                        ...wp,
                                        maxSafeSpeed: displayData.maxSafeSpeed,
                                        weather: {
                                            ...wp.weather,
                                            riskLevel: displayData.riskLevel,
                                        }
                                    };
                                    const prevDistance = i > 0 ? trip.waypoints[i-1].distanceFromStart : 0;
                                    const segmentInfo = {
                                        from: Math.round(prevDistance),
                                        to: Math.round(wp.distanceFromStart),
                                    };
                                    return (
                                        <WaypointCard
                                            key={i}
                                            waypoint={enhancedWp}
                                            index={i}
                                            isFirst={i === 0}
                                            isLast={i === trip.waypoints.length - 1}
                                            segmentInfo={segmentInfo}
                                            vehicleType={selectedVehicle}
                                        />
                                    );
                                })}
                            </div>

                            {/* Nearby Stops */}
                            {nearbyAds.length > 0 && (
                                <div style={styles.adsSection}>
                                    <h3 style={styles.adsTitle}>📍 Nearby Stops</h3>
                                    <div style={styles.adsList}>
                                        {nearbyAds.map((ad) => (
                                            <div key={ad.id} style={styles.adCard}>
                                                <span style={styles.adIcon}>{adIcon(ad.type)}</span>
                                                <div style={{ flex: 1 }}>
                                                    <div style={styles.adName}>{ad.name}</div>
                                                    <div style={styles.adOffer}>{ad.offerText}</div>
                                                </div>
                                                <span style={styles.adDistance}>{ad.distanceKm} km</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// ================================================================
// Styles
// ================================================================
const styles = {
    page: { minHeight: '100vh', background: '#0a0e14', padding: '24px', fontFamily: 'system-ui, sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    logo: { color: '#d4ff00', fontWeight: '700', fontSize: '1.1rem', letterSpacing: '1px', cursor: 'pointer' },
    status: { color: '#00e5cc', fontSize: '0.8rem' },
    grid: { display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px' },
    panel: {
        background: '#11151c', borderRadius: '14px', padding: '24px',
        border: '1px solid rgba(212,255,0,0.1)',
    },
    resultsPanel: {
        background: '#11151c', borderRadius: '14px', padding: '24px',
        border: '1px solid rgba(212,255,0,0.1)',
        maxHeight: '80vh',
        overflowY: 'auto',
    },
    panelTitle: { color: '#fff', fontSize: '1.1rem', marginBottom: '20px' },
    form: { display: 'flex', flexDirection: 'column', gap: '14px' },
    label: { color: '#8a93a3', fontSize: '0.75rem', marginTop: '8px', textTransform: 'uppercase' },
    vehicleRow: { display: 'flex', gap: '8px' },
    vehicleOption: {
        flex: 1, textAlign: 'center', padding: '10px', borderRadius: '8px',
        border: '1px solid #2a2f3a', color: '#8a93a3', fontSize: '0.8rem', cursor: 'pointer',
        transition: 'all 0.2s',
    },
    vehicleOptionActive: {
        border: '1px solid #d4ff00', color: '#d4ff00', boxShadow: '0 0 8px rgba(212,255,0,0.3)',
    },
    button: {
        marginTop: '10px', background: '#d4ff00', color: '#0a0e14', border: 'none',
        borderRadius: '10px', padding: '14px', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer',
    },
    smartDepartureBtn: {
        marginTop: '16px', background: 'transparent', border: '1px solid #00e5cc',
        color: '#00e5cc', borderRadius: '8px', padding: '10px', width: '100%',
        cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600',
    },
    newTripBtn: {
        marginTop: '12px', background: 'transparent', border: '1px solid #d4ff00', 
        color: '#d4ff00', borderRadius: '8px', padding: '10px', width: '100%',
        cursor: 'pointer', fontSize: '0.9rem',
    },
    error: { color: '#ff4d4d', fontSize: '0.8rem', marginTop: '8px' },
    mapSection: { marginBottom: '16px' },
    summaryRow: { display: 'flex', gap: '16px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #2a2f3a' },
    summaryItem: { color: '#fff', fontSize: '0.85rem' },
    cardsContainer: { display: 'flex', flexDirection: 'column', gap: '8px' },

    smartDeparturePanel: {
        marginTop: '16px', background: '#0d1119', border: '1px solid rgba(0,229,204,0.25)',
        borderRadius: '12px', padding: '16px',
    },
    smartDepartureHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    smartDepartureTitle: { color: '#00e5cc', fontSize: '0.9rem', fontWeight: '700' },
    smartDepartureClose: { color: '#8a93a3', cursor: 'pointer', fontSize: '0.9rem' },
    smartDepartureSub: { color: '#8a93a3', fontSize: '0.75rem', margin: '4px 0 12px' },
    suggestionRow: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px', borderRadius: '8px', marginBottom: '6px',
        border: '1px solid #2a2f3a',
    },
    suggestionRowBest: {
        border: '1px solid #00e5cc', background: 'rgba(0,229,204,0.06)',
    },
    suggestionTime: { color: '#fff', fontSize: '0.8rem', fontWeight: '600' },
    suggestionSub: { color: '#8a93a3', fontSize: '0.7rem', marginTop: '2px' },
    suggestionRight: { textAlign: 'right' },
    suggestionDuration: { color: '#8a93a3', fontSize: '0.7rem', marginTop: '2px' },
    bestBadge: {
        marginLeft: '8px', background: '#00e5cc', color: '#0a0e14', fontSize: '0.6rem',
        fontWeight: '800', padding: '2px 6px', borderRadius: '4px',
    },

    adsSection: { marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #2a2f3a' },
    adsTitle: { color: '#fff', fontSize: '0.95rem', marginBottom: '10px' },
    adsList: { display: 'flex', flexDirection: 'column', gap: '8px' },
    adCard: {
        display: 'flex', alignItems: 'center', gap: '10px', padding: '10px',
        background: '#161b24', borderRadius: '8px', border: '1px solid #2a2f3a',
    },
    adIcon: { fontSize: '1.1rem' },
    adName: { color: '#fff', fontSize: '0.8rem', fontWeight: '600' },
    adOffer: { color: '#8a93a3', fontSize: '0.7rem', marginTop: '2px' },
    adDistance: { color: '#d4ff00', fontSize: '0.75rem', fontWeight: '700' },
};

export default TripPlannerPage;