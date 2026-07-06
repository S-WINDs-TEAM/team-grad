
import { MapContainer, TileLayer, Polyline, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getRiskColor } from '../utils/riskColors';

// leaflet bundling icons disapear bug fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})






const MapView = ({ routePolyline, waypoints, origin, destination }) => {
  if (!routePolyline || routePolyline.length === 0) {
    return (
      <div style={styles.placeholder}>
        Map data not available for this trip.
      </div>
    );
  }

// fouce view map point in the middel of the map for the first time
  const centerIndex = Math.floor(routePolyline.length / 2);
  const center = routePolyline[centerIndex];

  const createMarkerIcon = (color, label)=> {
    return L.divIcon({
      className: 'custom-marker',
      html: `
         <div style="
                    background-color: ${color};
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: 12px;
                    border: 3px solid white;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                ">
                    ${label}
                </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16,16],
      popupAnchor: [0, -16],
    });
  };
    const startIcon = createMarkerIcon('#22c55e', 'S');
    const endIcon = createMarkerIcon('#ef4444', 'E');
  
  
     const getWaypointIcon = (riskLevel, index) => {
        const color = getRiskColor(riskLevel);
        return L.divIcon({
            className: 'waypoint-marker',
            html: `
                <div style="
                    background-color: ${color};
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: 11px;
                    border: 2px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.25);
                ">
                    ${index + 1}
                </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
        });

  }
  return (
    <div style={styles.mapWrapper}>
      <MapContainer
        center={center}
        zoom={8}
        style={styles.map}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/*   full course */}
         <Polyline
                    positions={routePolyline}
                    pathOptions={{ 
                        color: '#2563eb', 
                        weight: 5, 
                        opacity: 0.9,
                        lineJoin: 'round',
                    }}
                />

        {/*  start point */}
         {origin && (
                    <Marker 
                        position={[origin.lat, origin.lng]} 
                        icon={startIcon}
                    >
                        <Popup>
                            <strong>🟢 Starting Point</strong><br />
                            {origin.address || 'Origin'}
                        </Popup>
                    </Marker>
                )}

        {/*  end point */}
        {destination && (
                    <Marker 
                        position={[destination.lat, destination.lng]} 
                        icon={endIcon}
                    >
                        <Popup>
                            <strong>🔴 Destination</strong><br />
                            {destination.address || 'Destination'}
                        </Popup>
                    </Marker>
                )}

        {/*     waypoint circle colored by risklevel value color   */}
           {waypoints && waypoints.map((wp, i) => {
                    const icon = getWaypointIcon(wp.weather.riskLevel, i);
                    return (
                        <Marker
                            key={i}
                            position={[wp.location.lat, wp.location.lng]}
                            icon={icon}
                        >
                            <Popup>
                                <div style={{ minWidth: '200px' }}>
                                    <strong>📍 KM {Math.round(wp.distanceFromStart)}</strong><br />
                                    <strong>ETA:</strong> {new Date(wp.eta).toLocaleTimeString()}<br />
                                    <hr style={{ margin: '6px 0' }} />
                                    <strong>Weather:</strong> {wp.weather.condition} ({wp.weather.description})<br />
                                    <strong>Temperature:</strong> {wp.weather.temperature}°C<br />
                                    <strong>Feels like:</strong> {wp.weather.feelsLike}°C<br />
                                    <strong>Wind:</strong> {wp.weather.windSpeed} km/h<br />
                                    <strong>Precipitation:</strong> {wp.weather.precipitation} mm<br />
                                    <strong>Visibility:</strong> {wp.weather.visibility} km<br />
                                    <hr style={{ margin: '6px 0' }} />
                                    <strong>⚡ Max Safe Speed:</strong> {wp.maxSafeSpeed} km/h<br />
                                    <span style={{ color: getRiskColor(wp.weather.riskLevel), fontWeight: 'bold' }}>
                                        Risk: {wp.weather.riskLevel.toUpperCase()}
                                    </span>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
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
    },
    map: { 
        width: '100%', 
        height: '100%' 
    },
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
};

export default MapView;