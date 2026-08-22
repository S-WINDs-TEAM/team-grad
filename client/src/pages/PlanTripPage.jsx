import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import useAuth from '../hooks/useAuth';
import { setCurrentTrip } from '../store/tripSlice';
import { planRouteApi, getTripByIdApi, smartDepartureApi } from '../api/routeApi';
import { getAdsRecommendationsApi } from '../api/adsApi';
import LocationAutocomplete from '../components/LocationAutocomplete';
import MapView from '../components/MapView';
import WaypointCard from '../components/WaypointCard';
import RouteLoadingSkeleton from '../components/routeLoadingSkeleton';
import { theme } from '../styles/theme';

const PlanTripPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const tripId = searchParams.get('tripId');

  const { currentTrip } = useSelector((state) => state.trip);

  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [vehicleType, setVehicleType] = useState('car');
  const [cargoType, setCargoType] = useState('general');  // 🆕 NEW
  const [loading, setLoading] = useState(false);
  const [alternateRoute, setAlternateRoute] = useState(null);  // 🆕 NEW
  const [smartDeparture, setSmartDeparture] = useState(null);
  const [nearbyAds, setNearbyAds] = useState([]);

  // Load trip from URL param
  useEffect(() => {
    if (tripId) {
      const loadTrip = async () => {
        try {
          const response = await getTripByIdApi(tripId);
          const trip = response.data.trip;
          dispatch(setCurrentTrip(trip));
          setOrigin(trip.origin);
          setDestination(trip.destination);
          setVehicleType(trip.vehicleType || 'car');
          if (trip.cargoType) setCargoType(trip.cargoType);  // 🆕 NEW
        } catch (err) {
          toast.error('Could not load trip');
        }
      };
      loadTrip();
    }
  }, [tripId, dispatch]);

  const handlePlanRoute = async () => {
    if (!origin || !destination) {
      return toast.error('Please select origin and destination');
    }

    setLoading(true);
    try {
      const response = await planRouteApi({
        origin,
        destination,
        vehicleType,
        departureTime: new Date().toISOString(),
        cargoType,  // 🆕 NEW: pass cargo type
      });

      const trip = response.data.trip;
      dispatch(setCurrentTrip(trip));

      // 🆕 NEW: Check if alternate route exists
      if (response.data.alternateRoute) {
        setAlternateRoute(response.data.alternateRoute);
        toast.success('Route planned! Alternate route available due to weather hazard.');
      } else {
        setAlternateRoute(null);
        toast.success('Route planned successfully!');
      }

      // Fetch nearby ads
      if (destination?.lat && destination?.lng) {
        try {
          const adsResponse = await getAdsRecommendationsApi(destination.lat, destination.lng);
          setNearbyAds(adsResponse.data.ads || []);
        } catch (err) {
          console.warn('Could not load nearby ads');
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to plan route');
    } finally {
      setLoading(false);
    }
  };

  const handleSmartDeparture = async () => {
    if (!origin || !destination) {
      return toast.error('Please select origin and destination first');
    }

    try {
      const response = await smartDepartureApi({
        origin,
        destination,
        vehicleType,
        windowHours: 6,
        intervalMinutes: 60,
      });
      setSmartDeparture(response.data.suggestions);
      toast.success('Smart departure suggestions ready!');
    } catch (err) {
      toast.error('Could not get smart departure suggestions');
    }
  };

  // 🆕 NEW: Accept alternate route
  const handleAcceptAlternate = () => {
    if (!alternateRoute) return;
    
    // Replace current route with alternate
    dispatch(setCurrentTrip({
      ...currentTrip,
      routePolyline: alternateRoute.polyline,
      waypoints: alternateRoute.waypoints,
      totalDistanceKm: alternateRoute.totalDistanceKm,
      totalDurationMin: alternateRoute.totalDurationMin,
      overallRiskLevel: alternateRoute.overallRiskLevel,
    }));
    
    setAlternateRoute(null);  // Clear alternate after accepting
    toast.success('Alternate route accepted!');
  };

  const handleNewTrip = () => {
    setOrigin(null);
    setDestination(null);
    setVehicleType('car');
    setCargoType('general');  // 🆕 NEW
    setAlternateRoute(null);  // 🆕 NEW
    setSmartDeparture(null);
    setNearbyAds([]);
    dispatch(setCurrentTrip(null));
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>◈</span>
          <span style={styles.logoText}>S-WINDs</span>
          <span style={styles.logoSubtext}>Plan Trip</span>
        </div>
        <button style={styles.backBtn} onClick={() => navigate(user?.role === 'company_admin' ? '/fleet' : '/home')}>
          ← Back
        </button>
      </header>

      <div style={styles.content}>
        <div style={styles.inputSection}>
          <LocationAutocomplete
            label="From"
            placeholder="Enter starting location..."
            onSelect={setOrigin}
            defaultValue={origin?.address}
          />

          <LocationAutocomplete
            label="To"
            placeholder="Enter destination..."
            onSelect={setDestination}
            defaultValue={destination?.address}
          />

          <div style={styles.optionsRow}>
            <div style={styles.field}>
              <label style={styles.label}>Vehicle Type</label>
              <select
                style={styles.select}
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
              >
                <option value="car">Car</option>
                <option value="truck">Truck</option>
                <option value="motorcycle">Motorcycle</option>
              </select>
            </div>

            {/* 🆕 NEW: Cargo Type Selector */}
            <div style={styles.field}>
              <label style={styles.label}>Cargo Type</label>
              <select
                style={styles.select}
                value={cargoType}
                onChange={(e) => setCargoType(e.target.value)}
              >
                <option value="general">General</option>
                <option value="perishable">Perishable</option>
                <option value="pharmaceutical">Pharmaceutical</option>
                <option value="electronics">Electronics</option>
                <option value="chemicals">Chemicals</option>
                <option value="fragile">Fragile</option>
              </select>
            </div>
          </div>

          <div style={styles.buttonRow}>
            <button
              style={styles.planBtn}
              onClick={handlePlanRoute}
              disabled={loading || !origin || !destination}
            >
              {loading ? 'Planning...' : '🗺️ Plan My Route'}
            </button>

            <button
              style={styles.smartBtn}
              onClick={handleSmartDeparture}
              disabled={!origin || !destination}
            >
              ⚡ Smart Departure
            </button>

            <button style={styles.newBtn} onClick={handleNewTrip}>
              🔄 New Trip
            </button>
          </div>
        </div>

        {loading && <RouteLoadingSkeleton />}

        {/* 🆕 NEW: Alternate Route Banner */}
        {alternateRoute && currentTrip && (
          <div style={styles.alternateBanner}>
            <div style={styles.alternateBannerContent}>
              <div style={styles.alternateBannerIcon}>🔄</div>
              <div style={styles.alternateBannerText}>
                <div style={styles.alternateBannerTitle}>
                  Alternate Route Available — Weather Hazard Detected
                </div>
                <div style={styles.alternateBannerComparison}>
                  <div style={styles.comparisonItem}>
                    <span style={styles.comparisonLabel}>Current Route:</span>
                    <span style={styles.comparisonValue}>
                      {currentTrip.totalDistanceKm?.toFixed(1)} km · {Math.round(currentTrip.totalDurationMin)} min
                    </span>
                    <span style={{ ...styles.comparisonRisk, color: theme.accentRed }}>
                      {currentTrip.overallRiskLevel?.toUpperCase()}
                    </span>
                  </div>
                  <div style={styles.comparisonItem}>
                    <span style={styles.comparisonLabel}>Alternate Route:</span>
                    <span style={styles.comparisonValue}>
                      {alternateRoute.totalDistanceKm?.toFixed(1)} km · {Math.round(alternateRoute.totalDurationMin)} min
                    </span>
                    <span style={{ ...styles.comparisonRisk, color: theme.accentGreen }}>
                      {alternateRoute.overallRiskLevel?.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
              <button style={styles.acceptAlternateBtn} onClick={handleAcceptAlternate}>
                ✅ Accept Alternate
              </button>
            </div>
          </div>
        )}

        {currentTrip && !loading && (
          <>
            <MapView
              routePolyline={currentTrip.routePolyline}
              waypoints={currentTrip.waypoints}
              detailedWaypoints={currentTrip.detailedWaypoints}
              origin={origin}
              destination={destination}
              vehicleType={vehicleType}
              alternateRoute={alternateRoute}  // 🆕 NEW
            />

            {/* Cargo + Fatigue Warnings Box */}
            {(currentTrip.cargoAlerts?.length > 0 || currentTrip.fatigueInfo?.level === 'warn' || currentTrip.fatigueInfo?.level === 'critical') && (
              <div style={styles.warningsBox}>
                <div style={styles.warningsTitle}>⚠️ Important Warnings</div>
                {currentTrip.cargoAlerts?.map((alert, i) => (
                  <div key={i} style={styles.warningItem}>
                    <span style={styles.warningIcon}>📦</span>
                    <span style={styles.warningText}>{alert.message}</span>
                  </div>
                ))}
                {(currentTrip.fatigueInfo?.level === 'warn' || currentTrip.fatigueInfo?.level === 'critical') && (
                  <div style={styles.warningItem}>
                    <span style={styles.warningIcon}>😴</span>
                    <span style={styles.warningText}>{currentTrip.fatigueInfo.message}</span>
                  </div>
                )}
              </div>
            )}

            <div style={styles.summaryBox}>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>Distance:</span>
                <span style={styles.summaryValue}>{currentTrip.totalDistanceKm?.toFixed(1)} km</span>
              </div>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>Duration:</span>
                <span style={styles.summaryValue}>{Math.round(currentTrip.totalDurationMin)} min</span>
              </div>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>Overall Risk:</span>
                <span style={{ ...styles.summaryValue, color: currentTrip.overallRiskLevel === 'high' ? theme.accentRed : currentTrip.overallRiskLevel === 'medium' ? theme.accentOrange : theme.accentGreen }}>
                  {currentTrip.overallRiskLevel?.toUpperCase()}
                </span>
              </div>
            </div>

            <div style={styles.waypointsSection}>
              <h3 style={styles.sectionTitle}>Route Waypoints</h3>
              {currentTrip.waypoints?.map((wp, i) => (
                <WaypointCard
                  key={i}
                  waypoint={wp}
                  index={i}
                  isFirst={i === 0}
                  isLast={i === currentTrip.waypoints.length - 1}
                  vehicleType={vehicleType}
                />
              ))}
            </div>

            {/* Smart Departure Section */}
            {smartDeparture && (
              <div style={styles.smartDepartureSection}>
                <h3 style={styles.sectionTitle}>⚡ Smart Departure Suggestions</h3>
                {smartDeparture.map((suggestion, i) => (
                  <div
                    key={i}
                    style={{
                      ...styles.suggestionCard,
                      borderColor: suggestion.isBest ? theme.accentGreen : theme.borderDefault,
                    }}
                  >
                    <div style={styles.suggestionHeader}>
                      <span style={styles.suggestionTime}>
                        {new Date(suggestion.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {suggestion.isBest && (
                        <span style={styles.bestBadge}>BEST</span>
                      )}
                      <span style={{
                        ...styles.suggestionRisk,
                        color: suggestion.overallRisk === 'high' ? theme.accentRed : suggestion.overallRisk === 'medium' ? theme.accentOrange : theme.accentGreen,
                      }}>
                        {suggestion.overallRisk?.toUpperCase()}
                      </span>
                    </div>
                    <div style={styles.suggestionDetails}>
                      <span>⏱️ {Math.round(suggestion.totalDurationMin)} min</span>
                      <span>📊 Risk Score: {suggestion.avgRiskScore?.toFixed(0)}/100</span>
                    </div>
                    <div style={styles.suggestionSummary}>{suggestion.summary}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Nearby Ads Section */}
            {nearbyAds.length > 0 && (
              <div style={styles.adsSection}>
                <h3 style={styles.sectionTitle}>🛣️ Nearby Stops</h3>
                {nearbyAds.map((ad, i) => (
                  <div key={i} style={styles.adCard}>
                    <div style={styles.adName}>{ad.name}</div>
                    <div style={styles.adType}>{ad.type}</div>
                    <div style={styles.adDistance}>{ad.distanceKm?.toFixed(1)} km from destination</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const styles = {
  page: { minHeight: '100vh', background: theme.bgPrimary, fontFamily: 'system-ui, sans-serif' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 24px', borderBottom: `1px solid ${theme.borderDefault}`,
  },
  logo: { display: 'flex', alignItems: 'center', gap: '10px' },
  logoIcon: { fontSize: '20px', color: theme.accentBlue },
  logoText: { fontSize: '18px', fontWeight: '700', color: theme.textPrimary },
  logoSubtext: { fontSize: '12px', color: theme.textMuted, marginLeft: '4px' },
  backBtn: {
    padding: '6px 14px', background: 'transparent', border: `1px solid ${theme.borderDefault}`,
    borderRadius: '8px', color: theme.textSecondary, fontSize: '13px', cursor: 'pointer',
  },
  content: { maxWidth: '900px', margin: '0 auto', padding: '24px' },
  inputSection: {
    background: theme.bgSecondary, border: `1px solid ${theme.borderDefault}`,
    borderRadius: '12px', padding: '20px', marginBottom: '24px',
  },
  optionsRow: { display: 'flex', gap: '16px', marginBottom: '16px' },
  field: { flex: 1 },
  label: { display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '6px' },
  select: {
    width: '100%', padding: '10px 12px', background: theme.bgPrimary,
    border: `1px solid ${theme.borderDefault}`, borderRadius: '8px',
    color: theme.textPrimary, fontSize: '14px',
  },
  buttonRow: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  planBtn: {
    flex: 1, padding: '12px 20px', background: theme.accentBlue, color: '#fff',
    border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
  },
  smartBtn: {
    flex: 1, padding: '12px 20px', background: 'transparent',
    border: `1px solid ${theme.accentBlue}`, borderRadius: '10px',
    color: theme.accentBlue, fontSize: '14px', fontWeight: '600', cursor: 'pointer',
  },
  newBtn: {
    padding: '12px 20px', background: 'transparent',
    border: `1px solid ${theme.borderDefault}`, borderRadius: '10px',
    color: theme.textSecondary, fontSize: '14px', cursor: 'pointer',
  },
  // 🆕 NEW: Alternate Route Banner
  alternateBanner: {
    background: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.06) 100%)',
    border: `2px solid ${theme.accentOrange}`,
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '24px',
  },
  alternateBannerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  alternateBannerIcon: {
    fontSize: '32px',
  },
  alternateBannerText: {
    flex: 1,
  },
  alternateBannerTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: theme.accentOrange,
    marginBottom: '12px',
  },
  alternateBannerComparison: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  comparisonItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '13px',
  },
  comparisonLabel: {
    color: theme.textMuted,
    fontWeight: '600',
    minWidth: '120px',
  },
  comparisonValue: {
    color: theme.textPrimary,
    fontWeight: '500',
  },
  comparisonRisk: {
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginLeft: 'auto',
  },
  acceptAlternateBtn: {
    padding: '10px 20px',
    background: theme.accentGreen,
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  warningsBox: {
    background: 'rgba(245,158,11,0.08)',
    border: `1px solid ${theme.accentOrange}`,
    borderRadius: '10px',
    padding: '14px',
    marginBottom: '20px',
  },
  warningsTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: theme.accentOrange,
    marginBottom: '10px',
  },
  warningItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '6px 0',
  },
  warningIcon: {
    fontSize: '16px',
  },
  warningText: {
    fontSize: '13px',
    color: theme.textPrimary,
  },
  summaryBox: {
    display: 'flex',
    gap: '20px',
    background: theme.bgSecondary,
    border: `1px solid ${theme.borderDefault}`,
    borderRadius: '10px',
    padding: '14px 18px',
    marginBottom: '24px',
  },
  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  summaryLabel: {
    fontSize: '11px',
    color: theme.textMuted,
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: '16px',
    fontWeight: '700',
    color: theme.textPrimary,
  },
  waypointsSection: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: '16px',
  },
  smartDepartureSection: {
    marginBottom: '32px',
  },
  suggestionCard: {
    background: theme.bgSecondary,
    border: `2px solid ${theme.borderDefault}`,
    borderRadius: '10px',
    padding: '14px',
    marginBottom: '10px',
  },
  suggestionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px',
  },
  suggestionTime: {
    fontSize: '16px',
    fontWeight: '700',
    color: theme.textPrimary,
  },
  bestBadge: {
    padding: '2px 8px',
    background: theme.accentGreen,
    color: '#fff',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: '700',
  },
  suggestionRisk: {
    fontSize: '11px',
    fontWeight: '700',
    marginLeft: 'auto',
  },
  suggestionDetails: {
    display: 'flex',
    gap: '16px',
    fontSize: '12px',
    color: theme.textSecondary,
    marginBottom: '6px',
  },
  suggestionSummary: {
    fontSize: '13px',
    color: theme.textMuted,
    lineHeight: '1.4',
  },
  adsSection: {
    marginBottom: '32px',
  },
  adCard: {
    background: theme.bgSecondary,
    border: `1px solid ${theme.borderDefault}`,
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '8px',
  },
  adName: {
    fontSize: '14px',
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: '4px',
  },
  adType: {
    fontSize: '12px',
    color: theme.textMuted,
    marginBottom: '4px',
  },
  adDistance: {
    fontSize: '11px',
    color: theme.accentBlue,
  },
};

export default PlanTripPage;