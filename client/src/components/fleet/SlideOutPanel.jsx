import { useState } from 'react';
import { interpretWeather } from '../../utils/riskTranslator';
import { getRiskPathColor } from '../../utils/riskColors';
import { styles } from './FleetDashboard.styles';

const SlideOutPanel = ({ trip, vehicle, onClose, selectedWaypointIndex, onWaypointSelect }) => {
    const [expandedIndex, setExpandedIndex] = useState(null);

    const handleWaypointClick = (index) => {
        if (expandedIndex === index) {
            setExpandedIndex(null);
        } else {
            setExpandedIndex(index);
            onWaypointSelect(index);
        }
    };

    if (!trip) return null;

    const waypoints = trip.waypoints || [];

    return (
        <div style={styles.slideOutPanel}>
            <div style={styles.slideOutHeader}>
                <div style={styles.slideOutHeaderLeft}>
                    <div style={styles.slideOutTitle}>{vehicle?.plateNumber || 'Vehicle'}</div>
                    <div style={styles.slideOutRoute}>
                        {trip.origin?.address || 'Start'} → {trip.destination?.address || 'End'}
                    </div>
                    <div style={styles.slideOutMeta}>
                        <span>📏 {trip.totalDistanceKm?.toFixed(1) || 'N/A'} km</span>
                        <span>⏱️ {Math.round(trip.totalDurationMin || 0)} min</span>
                        <span style={{ color: getRiskPathColor(trip.overallRiskLevel) }}>
                            Risk: {trip.overallRiskLevel?.toUpperCase() || 'N/A'}
                        </span>
                    </div>
                </div>
                <button style={styles.slideOutClose} onClick={onClose}>✕</button>
            </div>

            <div style={styles.slideOutBody}>
                {waypoints.length === 0 ? (
                    <div style={styles.slideOutEmpty}>No waypoints to display.</div>
                ) : (
                    <div style={styles.waypointsList}>
                        {waypoints.map((wp, index) => {
                            const isExpanded = expandedIndex === index;
                            const isHighlighted = selectedWaypointIndex === index;
                            const riskColor = getRiskPathColor(wp.weather?.riskLevel);

                            let interpretation = null;
                            if (wp.weather) {
                                interpretation = interpretWeather(
                                    wp.weather,
                                    vehicle?.vehicleType || 'car',
                                    'medium'
                                );
                            }

                            return (
                                <div
                                    key={index}
                                    style={{
                                        ...styles.waypointItem,
                                        borderLeft: `4px solid ${riskColor}`,
                                        background: isHighlighted ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
                                    }}
                                    onClick={() => handleWaypointClick(index)}
                                >
                                    <div style={styles.waypointHeader}>
                                        <span style={styles.waypointKm}>KM {Math.round(wp.distanceFromStart || 0)}</span>
                                        <span style={{ ...styles.waypointRisk, color: riskColor }}>
                                            {wp.weather?.riskLevel?.toUpperCase() || 'N/A'}
                                        </span>
                                        <span style={styles.waypointExpand}>{isExpanded ? '▲' : '▼'}</span>
                                    </div>

                                    {isExpanded && interpretation && (
                                        <div style={styles.waypointDetails}>
                                            <div style={styles.waypointSummary}>{interpretation.summary}</div>
                                            <div style={styles.waypointRecommendation}>✅ {interpretation.recommendation}</div>
                                            <div style={styles.waypointRaw}>
                                                <span>🌡️ {wp.weather?.temperature}°C</span>
                                                <span>💨 {wp.weather?.windSpeed} km/h</span>
                                                <span>👁️ {wp.weather?.visibility} km</span>
                                                <span>🌧️ {wp.weather?.precipitation} mm</span>
                                            </div>
                                            <div style={styles.waypointSpeed}>⚡ Max Safe Speed: {wp.maxSafeSpeed || 'N/A'} km/h</div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SlideOutPanel;