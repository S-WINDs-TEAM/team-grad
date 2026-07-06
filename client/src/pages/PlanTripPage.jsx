import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { planRouteApi } from '../api/routeApi';
import LocationAutocomplete from '../components/LocationAutocomplete';
import RouteLoadingSkeleton from '../components/routeLoadingSkeleton';
import MapView from '../components/MapView';
import WaypointCard from '../components/WaypointCard';
import { setCurrentTrip, setLoading, setError, clearCurrentTrip } from '../store/tripSlice';

const TripPlannerPage = () => {
    const { handleSubmit, formState: { isSubmitting }, watch, setValue } = useForm({
        defaultValues: { vehicleType: 'car' },
    });
    const [origin, setOrigin] = useState(null);
    const [destination, setDestination] = useState(null);
    const [localError, setLocalError] = useState(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState('car');

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { currentTrip, loading } = useSelector((state) => state.trip);
    const vehicleType = watch('vehicleType');

    // لما يتغير نوع العربية، نحدث الـ selectedVehicle
    useEffect(() => {
        setSelectedVehicle(vehicleType);
    }, [vehicleType]);

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

    const handleNewTrip = () => {
        dispatch(clearCurrentTrip());
        setOrigin(null);
        setDestination(null);
        // مش بنمسح الـ vehicleType عشان المستخدم يحتفظ باختياره
    };

    // استخراج البيانات من الـ trip الحالي
    const trip = currentTrip;
    const originFromTrip = trip?.origin || null;
    const destinationFromTrip = trip?.destination || null;
    const tripVehicleType = trip?.vehicleType || 'car';

    // دالة لحساب السرعة والمخاطر حسب النوع المختار
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
                {/* البانل الأيسر: الفورم */}
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
                        <button 
                            onClick={handleNewTrip} 
                            style={styles.newTripBtn}
                        >
                            + New Trip
                        </button>
                    )}
                </div>

                {/* البانل الأيمن: الخريطة والنتائج */}
                <div style={styles.resultsPanel}>
                    {isCalculating && (
                        <>
                            <h2 style={styles.panelTitle}>Calculating route weather...</h2>
                            <RouteLoadingSkeleton />
                        </>
                    )}

                    {!isCalculating && trip && (
                        <>
                            {/* الخريطة */}
                            <div style={styles.mapSection}>
                                <MapView
                                    routePolyline={trip.routePolyline}
                                    waypoints={trip.waypoints}
                                    origin={originFromTrip}
                                    destination={destinationFromTrip}
                                    vehicleType={selectedVehicle}
                                />
                            </div>

                            {/* الملخص */}
                            <div style={styles.summaryRow}>
                                <span style={styles.summaryItem}>📏 {trip.totalDistanceKm.toFixed(0)} km</span>
                                <span style={styles.summaryItem}>⏱ {Math.round(trip.totalDurationMin)} min</span>
                                <span style={{
                                    ...styles.summaryItem,
                                    color: trip.overallRiskLevel === 'high' ? '#ff4d4d' : trip.overallRiskLevel === 'medium' ? '#f5a623' : '#d4ff00',
                                }}>
                                    Risk: {trip.overallRiskLevel.toUpperCase()}
                                </span>
                            </div>

                            {/* الكروت القابلة للتمدد */}
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
                                    // إضافة معلومات القطعة (من كيلو لكيلو)
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
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

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
};

export default TripPlannerPage;