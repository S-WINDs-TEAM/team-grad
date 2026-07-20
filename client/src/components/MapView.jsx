import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useState, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';
import { getRiskColor } from '../utils/riskColors';

// Fix Leaflet default icon bug
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ============================================================
// 🎯 Professional Icons
// ============================================================

// Start marker – green pin with flag icon
const startIcon = L.divIcon({
  className: 'custom-marker',
  html: `
    <div style="
      background: linear-gradient(135deg, #22c55e, #15803d);
      width: 44px;
      height: 44px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 4px 15px rgba(34, 197, 94, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
    ">
      <span style="transform: rotate(45deg); color: white; font-size: 20px; font-weight: bold;">🚀</span>
    </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 44],
  popupAnchor: [0, -44],
});

// End marker – red pin with checkered flag
const endIcon = L.divIcon({
  className: 'custom-marker',
  html: `
    <div style="
      background: linear-gradient(135deg, #ef4444, #b91c1c);
      width: 44px;
      height: 44px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 4px 15px rgba(239, 68, 68, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
    ">
      <span style="transform: rotate(45deg); color: white; font-size: 20px; font-weight: bold;">🏁</span>
    </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 44],
  popupAnchor: [0, -44],
});

// Waypoint icon – small dot, with optional pulse for danger
const getWaypointIcon = (riskLevel, isDanger = false) => {
  const color = isDanger ? '#ef4444' : getRiskColor(riskLevel);
  const size = isDanger ? 16 : 12;
  const pulse = isDanger ? `
    animation: pulse-danger 1.5s ease-in-out infinite;
    @keyframes pulse-danger {
      0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
      50% { box-shadow: 0 0 0 12px rgba(239, 68, 68, 0); }
    }
  ` : '';

  return L.divIcon({
    className: 'waypoint-marker',
    html: `
      <div style="
        background: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ${pulse}
      ">
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

// ============================================================
// 📍 Main Component
// ============================================================
const MapView = ({
  routePolyline,
  waypoints,          // 30km (summary)
  detailedWaypoints,  // 5km (detailed)
  origin,
  destination,
  alternateRoute,
  vehicleType,
}) => {
  const [showDetailed, setShowDetailed] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState('primary');

  const displayWaypoints = showDetailed && detailedWaypoints ? detailedWaypoints : waypoints;
  const isDetailed = showDetailed && detailedWaypoints;
  const pointsCount = displayWaypoints?.length || 0;

  // Find the first high-risk waypoint (for danger icon)
  const dangerWaypoint = displayWaypoints?.find(wp => wp.weather.riskLevel === 'high');

  // Memoized center
  const center = useMemo(() => {
    if (!routePolyline || routePolyline.length === 0) return [30.0444, 31.2357];
    const centerIndex = Math.floor(routePolyline.length / 2);
    return routePolyline[centerIndex];
  }, [routePolyline]);

  if (!routePolyline || routePolyline.length === 0) {
    return <div style={styles.placeholder}>Map data not available for this trip.</div>;
  }

  // Map key for remount
  const mapKey = `${center[0]}-${center[1]}-${isDetailed}-${routePolyline.length}`;

  // Route selection handlers
  const handleRouteSelect = (route) => setSelectedRoute(route);

  const primaryStyle = {
    color: selectedRoute === 'primary' ? '#2563eb' : '#94a3b8',
    weight: selectedRoute === 'primary' ? 5 : 3,
    opacity: selectedRoute === 'primary' ? 0.9 : 0.4,
    lineJoin: 'round',
  };

  const alternateStyle = {
    color: selectedRoute === 'alternate' ? '#ef4444' : '#94a3b8',
    weight: selectedRoute === 'alternate' ? 5 : 3,
    opacity: selectedRoute === 'alternate' ? 0.9 : 0.4,
    lineJoin: 'round',
    dashArray: selectedRoute === 'alternate' ? undefined : '6, 6',
  };

  return (
    <div style={styles.mapWrapper}>
      <MapContainer key={mapKey} center={center} zoom={8} style={styles.map} scrollWheelZoom zoomControl>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Primary route */}
        <Polyline positions={routePolyline} pathOptions={primaryStyle} />

        {/* Alternate route (if exists) */}
        {alternateRoute && (
          <Polyline positions={alternateRoute.polyline} pathOptions={alternateStyle} />
        )}

        {/* Start marker */}
        {origin && (
          <Marker position={[origin.lat, origin.lng]} icon={startIcon}>
            <Popup>
              <strong>🟢 Starting Point</strong>
              <br />
              {origin.address || 'Origin'}
            </Popup>
          </Marker>
        )}

        {/* End marker */}
        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={endIcon}>
            <Popup>
              <strong>🔴 Destination</strong>
              <br />
              {destination.address || 'Destination'}
            </Popup>
          </Marker>
        )}

        {/* Waypoints (dots with color coding) */}
        {displayWaypoints?.map((wp, i) => {
          // Skip the first and last (they have dedicated markers)
          if (i === 0 || i === displayWaypoints.length - 1) return null;

          const isDanger = wp === dangerWaypoint;
          const icon = getWaypointIcon(wp.weather.riskLevel, isDanger);
          const markerKey = `wp-${wp.distanceFromStart}-${isDetailed}-${i}`;

          return (
            <Marker key={markerKey} position={[wp.location.lat, wp.location.lng]} icon={icon}>
              <Popup>
                <div style={{ minWidth: '200px' }}>
                  <strong>📍 KM {Math.round(wp.distanceFromStart)}</strong>
                  <br />
                  <strong>ETA:</strong> {new Date(wp.eta).toLocaleTimeString()}
                  <hr />
                  <strong>Weather:</strong> {wp.weather.condition} ({wp.weather.description})<br />
                  <strong>Temp:</strong> {wp.weather.temperature}°C<br />
                  <strong>Wind:</strong> {wp.weather.windSpeed} km/h<br />
                  <strong>Precip:</strong> {wp.weather.precipitation} mm<br />
                  <strong>Visibility:</strong> {wp.weather.visibility} km
                  <hr />
                  <strong>⚡ Max Safe Speed:</strong> {wp.maxSafeSpeed} km/h
                  <br />
                  <span style={{ color: getRiskColor(wp.weather.riskLevel), fontWeight: 'bold' }}>
                    Risk: {wp.weather.riskLevel.toUpperCase()}
                  </span>
                  {isDanger && <div style={{ color: '#ef4444', marginTop: '4px', fontWeight: 'bold' }}>⚠️ Hazard detected</div>}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Route selection overlay */}
        <div style={styles.summaryOverlay}>
          <div style={styles.summaryBox}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 'bold', color: '#94a3b8', fontSize: '11px' }}>Route:</span>
              <button
                onClick={() => handleRouteSelect('primary')}
                style={{
                  ...styles.routeBtn,
                  background: selectedRoute === 'primary' ? 'rgba(37,99,235,0.2)' : 'transparent',
                  borderColor: selectedRoute === 'primary' ? '#2563eb' : '#2a2f3a',
                  color: selectedRoute === 'primary' ? '#60a5fa' : '#94a3b8',
                }}
              >
                Main
              </button>
              {alternateRoute && (
                <button
                  onClick={() => handleRouteSelect('alternate')}
                  style={{
                    ...styles.routeBtn,
                    background: selectedRoute === 'alternate' ? 'rgba(239,68,68,0.2)' : 'transparent',
                    borderColor: selectedRoute === 'alternate' ? '#ef4444' : '#2a2f3a',
                    color: selectedRoute === 'alternate' ? '#f87171' : '#94a3b8',
                  }}
                >
                  Alternate ({Math.round(alternateRoute.totalDistanceKm)} km)
                </button>
              )}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              {selectedRoute === 'primary' ? (
                <>Distance: ~{Math.round(routePolyline?.length ? 0 : 0)} km</>
              ) : (
                <>Distance: {Math.round(alternateRoute?.totalDistanceKm || 0)} km · Duration: {Math.round(alternateRoute?.totalDurationMin || 0)} min</>
              )}
            </div>
          </div>
        </div>

        {/* Details toggle button (top-right) */}
        <div style={styles.buttonOverlay}>
          <button
            onClick={() => setShowDetailed(!showDetailed)}
            style={{
              ...styles.toggleButton,
              background: isDetailed ? 'rgba(37, 99, 235, 0.9)' : 'rgba(13, 19, 33, 0.85)',
              borderColor: isDetailed ? '#3b82f6' : '#2a2f3a',
            }}
            title={isDetailed ? 'Switch to summary view (30km)' : 'Switch to detailed view (5km)'}
          >
            <span>{isDetailed ? '📊 Summary' : '🔍 Details'}</span>
            <span style={styles.badge}>{pointsCount} pts</span>
          </button>
        </div>
      </MapContainer>
    </div>
  );
};

const styles = {
  mapWrapper: {
    width: '100%',
    height: '450px',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #2a2f3a',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
    position: 'relative',
  },
  map: { width: '100%', height: '100%' },
  placeholder: {
    width: '100%',
    height: '450px',
    borderRadius: '12px',
    background: '#11151c',
    border: '1px solid #2a2f3a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#8a93a3',
    fontSize: '0.9rem',
  },
  buttonOverlay: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    zIndex: 1000,
    pointerEvents: 'none',
  },
  toggleButton: {
    pointerEvents: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 14px',
    borderRadius: '10px',
    border: '1px solid',
    color: '#fff',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
    fontFamily: 'system-ui, sans-serif',
  },
  badge: {
    background: 'rgba(255,255,255,0.15)',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: '700',
    color: '#94a3b8',
  },
  summaryOverlay: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    zIndex: 1000,
    pointerEvents: 'none',
  },
  summaryBox: {
    pointerEvents: 'auto',
    background: 'rgba(13, 19, 33, 0.85)',
    backdropFilter: 'blur(8px)',
    border: '1px solid #2a2f3a',
    borderRadius: '10px',
    padding: '8px 14px',
    color: '#fff',
    fontSize: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
  },
  routeBtn: {
    padding: '4px 10px',
    borderRadius: '6px',
    border: '1px solid',
    background: 'transparent',
    color: '#94a3b8',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

export default MapView;