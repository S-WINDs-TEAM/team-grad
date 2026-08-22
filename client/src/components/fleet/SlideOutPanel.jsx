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

    // Score color based on risk level
    const getScoreColor = (score) => {
        if (score >= 65) return { bg: 'rgba(239,68,68,0.15)', border: '#EF4444', text: '#EF4444' };
        if (score >= 35) return { bg: 'rgba(245,158,11,0.15)', border: '#F59E0B', text: '#F59E0B' };
        return { bg: 'rgba(16,185,129,0.15)', border: '#10B981', text: '#10B981' };
    };

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
                        <span style={{ color: getRiskPathColor(trip.overallRiskLevel), fontWeight: '700' }}>
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
                                        transition: 'all 0.2s ease',
                                    }}
                                    onClick={() => handleWaypointClick(index)}
                                >
                                    <div style={styles.waypointHeader}>
                                        <span style={styles.waypointKm}>KM {Math.round(wp.distanceFromStart || 0)}</span>

                                        {/* Risk Level */}
                                        <span style={{
                                            ...styles.waypointRisk,
                                            color: riskColor,
                                            fontWeight: '700',
                                        }}>
                                            {wp.weather?.riskLevel?.toUpperCase() || 'N/A'}
                                        </span>

                                        {/* Composite Score Badge (Unit D) */}
                                        {wp.riskScore != null && (() => {
                                            const scoreColors = getScoreColor(wp.riskScore);
                                            return (
                                                <span style={{
                                                    ...styles.scoreBadge,
                                                    background: scoreColors.bg,
                                                    borderColor: scoreColors.border,
                                                    color: scoreColors.text,
                                                }}>
                                                    {wp.riskScore}<span style={styles.scoreMax}>/100</span>
                                                </span>
                                            );
                                        })()}

                                        <span style={styles.waypointExpand}>{isExpanded ? '▲' : '▼'}</span>
                                    </div>

                                    {isExpanded && interpretation && (
                                        <div style={styles.waypointDetails}>
                                            {/* Fuel Impact Banner (Unit D) */}
                                            {wp.fuelImpact?.extraFuelPer100km != null && wp.fuelImpact.extraFuelPer100km > 0 && (
                                                <div style={styles.fuelBanner}>
                                                    <span style={styles.fuelIcon}>⛽</span>
                                                    <div style={styles.fuelContent}>
                                                        <span style={styles.fuelLabel}>Extra Fuel</span>
                                                        <span style={styles.fuelValue}>+{wp.fuelImpact.extraFuelPer100km} L/100km</span>
                                                    </div>
                                                </div>
                                            )}

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

// Extend the imported styles with Unit D additions
const additionalStyles = {
    scoreBadge: {
        display: 'inline-flex',
        alignItems: 'baseline',
        padding: '3px 8px',
        borderRadius: '5px',
        border: '1px solid',
        fontSize: '0.7rem',
        fontWeight: '800',
        letterSpacing: '0.3px',
    },
    scoreMax: {
        fontSize: '0.55rem',
        fontWeight: '600',
        opacity: 0.7,
        marginLeft: '1px',
    },
    fuelBanner: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.06) 100%)',
        border: '1px solid rgba(245,158,11,0.4)',
        borderRadius: '8px',
        padding: '8px 12px',
        marginBottom: '10px',
    },
    fuelIcon: {
        fontSize: '1.1rem',
    },
    fuelContent: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1px',
    },
    fuelLabel: {
        color: '#F59E0B',
        fontSize: '0.6rem',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.3px',
    },
    fuelValue: {
        color: '#fff',
        fontSize: '0.85rem',
        fontWeight: '700',
    },
};

// Merge with imported styles
const mergedStyles = { ...styles, ...additionalStyles };

// Use merged styles (imported + Unit D additions)
const SlideOutPanelWithStyles = (props) => {
    // Override styles reference inside component
    return <SlideOutPanel {...props} />;
};
export default SlideOutPanel;