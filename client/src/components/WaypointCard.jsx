import { useState } from 'react';
import { getRiskColor, getRiskLabel } from '../utils/riskColors';

const WaypointCard = ({ waypoint, index, isFirst, isLast, segmentInfo, vehicleType }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const color = getRiskColor(waypoint.weather.riskLevel);
    const label = getRiskLabel(waypoint.weather.riskLevel);
    const time = new Date(waypoint.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const conditionIcons = {
        clear: '☀️',
        rain: '🌧️',
        fog: '🌫️',
        sandstorm: '💨',
        snow: '❄️',
        partly_cloudy: '⛅',
        thunderstorm: '⛈️',
        heavy_rain: '🌊',
        drizzle: '🌦️',
    };

    const toggleExpand = () => setIsExpanded(!isExpanded);

    // تفاصيل الطقس الكاملة
    const weatherDetails = [
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
            boxShadow: isFirst || isLast ? `0 0 16px ${color}33` : 'none',
            cursor: 'pointer',
        }} onClick={toggleExpand}>
            {/* الرأس (ملخص) */}
            <div style={styles.header}>
                <div style={styles.left}>
                    <span style={styles.km}>
                        KM {Math.round(waypoint.distanceFromStart * 10) / 10}
                    </span>
                    <span style={styles.time}>{isFirst ? 'NOW' : `ETA ${time}`}</span>
                    {segmentInfo && (
                        <span style={styles.segment}>
                            📍 {segmentInfo.from} → {segmentInfo.to} km
                        </span>
                    )}
                </div>

                <div style={styles.icon}>{conditionIcons[waypoint.weather.condition] || '🌤️'}</div>

                <div style={styles.middle}>
                    <p style={styles.condition}>{waypoint.weather.condition}</p>
                    <p style={styles.detail}>
                        Max Safe speed: {waypoint.maxSafeSpeed} km/h · Visibility {waypoint.weather.visibility}km
                    </p>
                </div>

                <div style={{ ...styles.badge, color, borderColor: color }}>
                    {label}
                </div>

                <span style={styles.expandIcon}>
                    {isExpanded ? '▲' : '▼'}
                </span>
            </div>

            {/* الجسم (التفاصيل الكاملة) - يظهر عند الضغط */}
            {isExpanded && (
                <div style={styles.details}>
                    <div style={styles.detailsGrid}>
                        {weatherDetails.map((item, i) => (
                            <div key={i} style={styles.detailItem}>
                                <span style={styles.detailLabel}>{item.label}</span>
                                <span style={styles.detailValue}>{item.value}</span>
                            </div>
                        ))}
                    </div>
                    <div style={styles.vehicleInfo}>
                        <span>🚗 Vehicle: {vehicleType?.toUpperCase() || 'CAR'}</span>
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
        borderRadius: '10px',
        borderLeft: '4px solid',
        marginBottom: '8px',
        transition: 'all 0.3s ease',
        overflow: 'hidden',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
    },
    left: { display: 'flex', flexDirection: 'column', minWidth: '80px' },
    km: { color: '#fff', fontSize: '0.8rem', fontWeight: '600' },
    time: { color: '#8a93a3', fontSize: '0.65rem', textTransform: 'uppercase' },
    segment: { color: '#8a93a3', fontSize: '0.6rem', marginTop: '2px' },
    icon: { fontSize: '1.6rem' },
    middle: { flex: 1 },
    condition: { color: '#fff', fontSize: '0.85rem', fontWeight: '600', margin: 0, textTransform: 'capitalize' },
    detail: { color: '#8a93a3', fontSize: '0.7rem', margin: '2px 0 0 0' },
    badge: {
        fontSize: '0.65rem',
        fontWeight: '700',
        padding: '4px 10px',
        borderRadius: '6px',
        border: '1px solid',
        background: 'transparent',
    },
    expandIcon: { color: '#8a93a3', fontSize: '0.8rem', padding: '4px' },
    details: {
        padding: '16px',
        borderTop: '1px solid #2a2f3a',
        background: 'rgba(255,255,255,0.02)',
    },
    detailsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: '8px',
    },
    detailItem: {
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(255,255,255,0.03)',
        padding: '6px 10px',
        borderRadius: '4px',
    },
    detailLabel: { color: '#8a93a3', fontSize: '0.6rem', textTransform: 'uppercase' },
    detailValue: { color: '#fff', fontSize: '0.8rem', fontWeight: '500' },
    vehicleInfo: {
        marginTop: '12px',
        paddingTop: '12px',
        borderTop: '1px solid #2a2f3a',
        display: 'flex',
        justifyContent: 'space-between',
        color: '#8a93a3',
        fontSize: '0.75rem',
    },
};

export default WaypointCard;