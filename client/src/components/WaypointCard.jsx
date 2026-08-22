import { useState } from 'react';
import { getRiskColor, getRiskLabel } from '../utils/riskColors';
import { interpretWeather } from '../utils/riskTranslator';

const WaypointCard = ({ waypoint, index, isFirst, isLast, segmentInfo, vehicleType = 'car', vehicleHeight = 'medium' }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const color = getRiskColor(waypoint.weather.riskLevel);
    const label = getRiskLabel(waypoint.weather.riskLevel);
    const time = new Date(waypoint.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const interpretation = interpretWeather(waypoint.weather, vehicleType, vehicleHeight);
    const { summary, recommendation, details } = interpretation;

    const conditionIcons = {
        clear: '☀️', rain: '🌧️', fog: '🌫️', sandstorm: '💨', snow: '❄️',
        partly_cloudy: '⛅', thunderstorm: '⛈️', heavy_rain: '🌊', drizzle: '🌦️',
    };

    const toggleExpand = () => setIsExpanded(!isExpanded);

    // Score color based on risk level (blue for display, but tinted by risk)
    const getScoreColor = (score) => {
        if (score >= 65) return { bg: 'rgba(239,68,68,0.15)', border: '#EF4444', text: '#EF4444' };
        if (score >= 35) return { bg: 'rgba(245,158,11,0.15)', border: '#F59E0B', text: '#F59E0B' };
        return { bg: 'rgba(16,185,129,0.15)', border: '#10B981', text: '#10B981' };
    };

    const rawDetails = [
        { label: 'Temperature', value: `${waypoint.weather.temperature}°C` },
        { label: 'Feels Like', value: `${waypoint.weather.feelsLike}°C` },
        { label: 'Wind Speed', value: `${waypoint.weather.windSpeed} km/h` },
        { label: 'Wind Direction', value: `${waypoint.weather.windDirection}°` },
        { label: 'Wind Gust', value: `${waypoint.weather.windGust} km/h` },
        { label: 'Precipitation', value: `${waypoint.weather.precipitation} mm` },
        { label: 'Precipitation Prob.', value: `${waypoint.weather.pop}%` },
        { label: 'Humidity', value: `${waypoint.weather.humidity}%` },
        { label: 'Pressure', value: `${waypoint.weather.pressure} hPa` },
        { label: 'Visibility', value: `${waypoint.weather.visibility} km` },
        { label: 'Cloud Cover', value: `${waypoint.weather.clouds}%` },
        { label: 'UV Index', value: waypoint.weather.uvIndex },
        { label: 'Dew Point', value: `${waypoint.weather.dewPoint}°C` },
        { label: 'Condition', value: waypoint.weather.description },
    ];

    return (
        <div style={{
            ...styles.card,
            borderLeft: `4px solid ${color}`,
            boxShadow: isFirst || isLast ? `0 0 20px ${color}44` : '0 2px 8px rgba(0,0,0,0.2)',
            cursor: 'pointer',
        }} onClick={toggleExpand}>
            {/* Header – always visible */}
            <div style={styles.header}>
                <div style={styles.left}>
                    <span style={styles.km}>KM {Math.round(waypoint.distanceFromStart * 10) / 10}</span>
                    <span style={styles.time}>{isFirst ? 'NOW' : `ETA ${time}`}</span>
                </div>
                <div style={styles.icon}>{conditionIcons[waypoint.weather.condition] || '🌤️'}</div>
                <div style={styles.middle}>
                    <p style={styles.condition}>{waypoint.weather.condition}</p>
                    <p style={styles.summary}>{summary}</p>
                </div>

                {/* Risk Level Badge */}
                <div style={{ ...styles.badge, color, borderColor: color, background: `${color}15` }}>
                    {label}
                </div>

                {/* Composite Score Badge (Unit D) */}
                {waypoint.riskScore != null && (() => {
                    const scoreColors = getScoreColor(waypoint.riskScore);
                    return (
                        <div style={{
                            ...styles.scoreBadge,
                            background: scoreColors.bg,
                            borderColor: scoreColors.border,
                            color: scoreColors.text,
                        }}>
                            <span style={styles.scoreNumber}>{waypoint.riskScore}</span>
                            <span style={styles.scoreMax}>/100</span>
                        </div>
                    );
                })()}

                <span style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</span>
            </div>

            {/* Expanded section */}
            {isExpanded && (
                <div style={styles.details}>
                    {/* Fuel Impact Banner (Unit D) — prominent when present */}
                    {waypoint.fuelImpact?.extraFuelPer100km != null && waypoint.fuelImpact.extraFuelPer100km > 0 && (
                        <div style={styles.fuelBanner}>
                            <span style={styles.fuelIcon}>⛽</span>
                            <div style={styles.fuelContent}>
                                <span style={styles.fuelLabel}>Extra Fuel Consumption</span>
                                <span style={styles.fuelValue}>+{waypoint.fuelImpact.extraFuelPer100km} L/100km</span>
                            </div>
                        </div>
                    )}

                    {/* Interpretation summary */}
                    <div style={styles.interpretationBlock}>
                        <div style={styles.interpretationTitle}>📋 Assessment</div>
                        <p style={styles.interpretationText}>{summary}</p>
                        <div style={styles.recommendationBlock}>
                            <span style={styles.recommendationLabel}>✅ Recommendation:</span>
                            <span style={styles.recommendationText}>{recommendation}</span>
                        </div>
                    </div>

                    {/* Detailed breakdown per parameter */}
                    <div style={styles.detailsGrid}>
                        {details.map((item, i) => (
                            <div key={i} style={styles.detailItem}>
                                <span style={styles.detailLabel}>{item.param}</span>
                                <span style={styles.detailValue}>{item.interpretation}</span>
                                <span style={styles.detailAction}>→ {item.recommendation}</span>
                            </div>
                        ))}
                    </div>

                    {/* Raw data */}
                    <div style={styles.rawDataBlock}>
                        <span style={styles.rawDataTitle}>📊 Raw Data</span>
                        <div style={styles.rawDataGrid}>
                            {rawDetails.map((item, i) => (
                                <div key={i} style={styles.rawDataItem}>
                                    <span style={styles.rawDataLabel}>{item.label}</span>
                                    <span style={styles.rawDataValue}>{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={styles.vehicleInfo}>
                        <span>🚗 Vehicle: {vehicleType?.toUpperCase()}</span>
                        <span style={{ color }}>⚡ Risk: {waypoint.weather.riskLevel.toUpperCase()}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    card: {
        background: '#11151c',
        borderRadius: '12px',
        borderLeft: '4px solid',
        marginBottom: '8px',
        transition: 'all 0.3s ease',
        overflow: 'hidden',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 16px',
    },
    left: { display: 'flex', flexDirection: 'column', minWidth: '80px' },
    km: { color: '#fff', fontSize: '0.85rem', fontWeight: '700' },
    time: { color: '#8a93a3', fontSize: '0.65rem', textTransform: 'uppercase', marginTop: '2px' },
    icon: { fontSize: '1.8rem' },
    middle: { flex: 1 },
    condition: { color: '#fff', fontSize: '0.9rem', fontWeight: '600', margin: 0, textTransform: 'capitalize' },
    summary: { color: '#94a3b8', fontSize: '0.75rem', margin: '3px 0 0 0', lineHeight: '1.4' },
    badge: {
        fontSize: '0.65rem',
        fontWeight: '700',
        padding: '5px 10px',
        borderRadius: '6px',
        border: '1px solid',
        letterSpacing: '0.5px',
    },
    scoreBadge: {
        display: 'flex',
        alignItems: 'baseline',
        padding: '5px 10px',
        borderRadius: '6px',
        border: '1px solid',
        fontWeight: '800',
        letterSpacing: '0.5px',
    },
    scoreNumber: {
        fontSize: '0.85rem',
        fontWeight: '800',
    },
    scoreMax: {
        fontSize: '0.6rem',
        fontWeight: '600',
        opacity: 0.7,
        marginLeft: '1px',
    },
    expandIcon: { color: '#8a93a3', fontSize: '0.8rem', padding: '4px' },
    details: {
        padding: '16px',
        borderTop: '1px solid #2a2f3a',
        background: 'rgba(255,255,255,0.02)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
    },
    // Unit D: Fuel impact banner
    fuelBanner: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.06) 100%)',
        border: '1px solid rgba(245,158,11,0.4)',
        borderRadius: '10px',
        padding: '12px 16px',
    },
    fuelIcon: {
        fontSize: '1.4rem',
    },
    fuelContent: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
    },
    fuelLabel: {
        color: '#F59E0B',
        fontSize: '0.7rem',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },
    fuelValue: {
        color: '#fff',
        fontSize: '1rem',
        fontWeight: '700',
    },
    interpretationBlock: {
        background: 'rgba(59,130,246,0.08)',
        padding: '12px 16px',
        borderRadius: '10px',
        borderLeft: '4px solid #3b82f6',
    },
    interpretationTitle: { color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' },
    interpretationText: { color: '#fff', fontSize: '0.85rem', margin: 0, lineHeight: '1.5' },
    recommendationBlock: { display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' },
    recommendationLabel: { color: '#10b981', fontSize: '0.75rem', fontWeight: '700' },
    recommendationText: { color: '#cbd5e1', fontSize: '0.75rem', lineHeight: '1.4' },
    detailsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '8px',
    },
    detailItem: {
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(255,255,255,0.04)',
        padding: '8px 12px',
        borderRadius: '8px',
        borderLeft: '3px solid #2a2f3a',
    },
    detailLabel: { color: '#8a93a3', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px' },
    detailValue: { color: '#fff', fontSize: '0.8rem', fontWeight: '500', margin: '2px 0' },
    detailAction: { color: '#f59e0b', fontSize: '0.7rem', marginTop: '3px' },
    rawDataBlock: {
        marginTop: '4px',
        borderTop: '1px solid #1a1f2a',
        paddingTop: '12px',
    },
    rawDataTitle: { color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' },
    rawDataGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: '6px',
    },
    rawDataItem: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '4px 8px',
        borderBottom: '1px solid #1a1f2a',
    },
    rawDataLabel: { color: '#64748b', fontSize: '0.65rem' },
    rawDataValue: { color: '#94a3b8', fontSize: '0.65rem', fontWeight: '500' },
    vehicleInfo: {
        marginTop: '8px',
        paddingTop: '12px',
        borderTop: '1px solid #2a2f3a',
        display: 'flex',
        justifyContent: 'space-between',
        color: '#8a93a3',
        fontSize: '0.8rem',
        fontWeight: '500',
    },
};

export default WaypointCard;