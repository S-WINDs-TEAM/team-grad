import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { getRiskColor } from '../utils/riskColors';
import { interpretWeather } from '../utils/riskTranslator';

// Fix Leaflet default icon bug
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapView = ({
  routePolyline,
  waypoints,
  detailedWaypoints,
  origin,
  destination,
  vehicleType = 'car',
  vehicleHeight = 'medium',
  alternateRoute,      // 🆕 NEW: المسار البديل من الـ API
}) => {
  const [showDetailed, setShowDetailed] = useState(false);

  const displayWaypoints = showDetailed && detailedWaypoints ? detailedWaypoints : waypoints;
  const isDetailed = showDetailed && detailedWaypoints;
  const pointsCount = displayWaypoints?.length || 0;

  if (!routePolyline || routePolyline.length === 0) {
    return <div style={styles.placeholder}>Map data not available for this trip.</div>;
  }

  const centerIndex = Math.floor(routePolyline.length / 2);
  const center = routePolyline[centerIndex];

  const createMarkerIcon = (color, label) =>
    L.divIcon({
      className: 'custom-marker',
      html: `<div style="background:${color};width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;font-size:12px;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,0.3);">${label}</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });

  const startIcon = createMarkerIcon('#22c55e', 'S');
  const endIcon = createMarkerIcon('#ef4444', 'E');

  const getWaypointIcon = (riskLevel, index) => {
    const color = getRiskColor(riskLevel);
    return L.divIcon({
      className: 'waypoint-marker',
      html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;font-size:11px;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.25);">${index + 1}</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  };

  return (
    <div style={styles.mapWrapper}>
      <MapContainer center={center} zoom={8} style={styles.map} scrollWheelZoom zoomControl>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Main route (blue solid) */}
        <Polyline
          positions={routePolyline}
          pathOptions={{ color: '#2563eb', weight: 5, opacity: 0.9, lineJoin: 'round' }}
        />

        {/* 🆕 NEW: Alternate route (orange dashed) */}
        {alternateRoute && alternateRoute.polyline && alternateRoute.polyline.length > 0 && (
          <Polyline
            positions={alternateRoute.polyline}
            pathOptions={{
              color: '#f59e0b',
              weight: 4,
              opacity: 0.8,
              dashArray: '10, 10',  // خط متقطع
              lineJoin: 'round',
            }}
          >
            <Popup>
              <strong>🔄 Alternate Route</strong>
              <br />
              Distance: {alternateRoute.totalDistanceKm?.toFixed(1)} km
              <br />
              Duration: {Math.round(alternateRoute.totalDurationMin)} min
              <br />
              Risk: {alternateRoute.overallRiskLevel?.toUpperCase()}
            </Popup>
          </Polyline>
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
              {destination.address || 'End'}
            </Popup>
          </Marker>
        )}

        {/* Waypoints */}
        {displayWaypoints?.map((wp, i) => {
          const icon = getWaypointIcon(wp.weather.riskLevel, i);
          const { summary, recommendation } = interpretWeather(
            wp.weather,
            vehicleType || 'car',
            vehicleHeight || 'medium'
          );

          const popupContent = `
            <div style="min-width:220px;">
              <strong>📍 KM ${Math.round(wp.distanceFromStart)}</strong><br />
              <strong>ETA:</strong> ${new Date(wp.eta).toLocaleTimeString()}
              <hr />
              <p style="font-size:13px; color:#e5e7eb;"><strong>${summary}</strong></p>
              <p style="font-size:12px; color:#10b981;"><strong>✅ Recommendation:</strong> ${recommendation}</p>
              <hr />
              <div style="font-size:11px; color:#9ca3af;">
                <strong>Weather:</strong> ${wp.weather.condition} (${wp.weather.description || ''})<br />
                <strong>Temp:</strong> ${wp.weather.temperature}°C &nbsp;|&nbsp; <strong>Wind:</strong> ${wp.weather.windSpeed} km/h<br />
                <strong>Precip:</strong> ${wp.weather.precipitation} mm &nbsp;|&nbsp; <strong>Visibility:</strong> ${wp.weather.visibility} km
              </div>
              <hr />
              <strong>⚡ Max Safe Speed:</strong> ${wp.maxSafeSpeed} km/h
              <br />
              <span style="color:${getRiskColor(wp.weather.riskLevel)};font-weight:bold;">
                Risk: ${wp.weather.riskLevel.toUpperCase()}
              </span>
            </div>
          `;

          return (
            <Marker key={i} position={[wp.location.lat, wp.location.lng]} icon={icon}>
              <Popup>
                <div dangerouslySetInnerHTML={{ __html: popupContent }} />
              </Popup>
            </Marker>
          );
        })}

        {/* Toggle button */}
        <div style={styles.buttonOverlay}>
          <button
            onClick={() => setShowDetailed(!showDetailed)}
            style={{
              ...styles.toggleButton,
              background: isDetailed
                ? 'rgba(37, 99, 235, 0.9)'
                : 'rgba(13, 19, 33, 0.85)',
              borderColor: isDetailed ? '#3b82f6' : '#2a2f3a',
            }}
            title={
              isDetailed
                ? 'Switch to summary view (30km)'
                : 'Switch to detailed view (5km)'
            }
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
};

export default MapView;