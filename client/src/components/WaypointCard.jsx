import { useState } from "react";
import { getRiskColor, getRiskLabel } from "../utils/riskColors";
import { interpretWeather } from "../utils/riskTranslator"; // NEW

const WaypointCard = ({
  waypoint,
  index,
  isFirst,
  isLast,
  segmentInfo,
  vehicleType = "car",
  vehicleHeight = "medium",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const color = getRiskColor(waypoint.weather.riskLevel);
  const label = getRiskLabel(waypoint.weather.riskLevel);
  const time = new Date(waypoint.eta).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // NEW: Get interpreted insights
  const interpretation = interpretWeather(
    waypoint.weather,
    vehicleType,
    vehicleHeight,
  );
  const { summary, recommendation, details } = interpretation;

  const conditionIcons = {
    clear: "☀️",
    rain: "🌧️",
    fog: "🌫️",
    sandstorm: "💨",
    snow: "❄️",
    partly_cloudy: "⛅",
    thunderstorm: "⛈️",
    heavy_rain: "🌊",
    drizzle: "🌦️",
  };

  const toggleExpand = () => setIsExpanded(!isExpanded);

  // We'll still keep the raw weather details for the expandable section, but we'll show them in a more readable format.
  const rawDetails = [
    { label: "Temperature", value: `${waypoint.weather.temperature}°C` },
    { label: "Feels Like", value: `${waypoint.weather.feelsLike}°C` },
    { label: "Wind Speed", value: `${waypoint.weather.windSpeed} km/h` },
    { label: "Wind Direction", value: `${waypoint.weather.windDirection}°` },
    { label: "Wind Gust", value: `${waypoint.weather.windGust} km/h` },
    { label: "Precipitation", value: `${waypoint.weather.precipitation} mm` },
    { label: "Precipitation Prob.", value: `${waypoint.weather.pop}%` },
    { label: "Humidity", value: `${waypoint.weather.humidity}%` },
    { label: "Pressure", value: `${waypoint.weather.pressure} hPa` },
    { label: "Visibility", value: `${waypoint.weather.visibility} km` },
    { label: "Cloud Cover", value: `${waypoint.weather.clouds}%` },
    { label: "UV Index", value: waypoint.weather.uvIndex },
    { label: "Dew Point", value: `${waypoint.weather.dewPoint}°C` },
    { label: "Condition", value: waypoint.weather.description },
  ];

  return (
    <div
      style={{
        ...styles.card,
        borderLeft: `4px solid ${color}`,
        boxShadow: isFirst || isLast ? `0 0 16px ${color}33` : "none",
        cursor: "pointer",
      }}
      onClick={toggleExpand}
    >
      {/* Header – always visible */}
      <div style={styles.header}>
        <div style={styles.left}>
          <span style={styles.km}>
            KM {Math.round(waypoint.distanceFromStart * 10) / 10}
          </span>
          <span style={styles.time}>{isFirst ? "NOW" : `ETA ${time}`}</span>
        </div>
        <div style={styles.icon}>
          {conditionIcons[waypoint.weather.condition] || "🌤️"}
        </div>
        <div style={styles.middle}>
          <p style={styles.condition}>{waypoint.weather.condition}</p>
          <p style={styles.summary}>{summary}</p> {/* NEW: show summary */}
        </div>
        <div style={{ ...styles.badge, color, borderColor: color }}>
          {label}
        </div>
        <span style={styles.expandIcon}>{isExpanded ? "▲" : "▼"}</span>
      </div>

      {/* Expanded section – shows detailed interpretation and raw data */}
      {isExpanded && (
        <div style={styles.details}>
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

          {/* Raw data (optional, collapsed) */}
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
            <span style={{ color }}>
              ⚡ Risk: {waypoint.weather.riskLevel.toUpperCase()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Styles – add new styles for the interpretation parts
const styles = {
  card: {
    background: "#11151c",
    borderRadius: "10px",
    borderLeft: "4px solid",
    marginBottom: "8px",
    transition: "all 0.3s ease",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
  },
  left: { display: "flex", flexDirection: "column", minWidth: "80px" },
  km: { color: "#fff", fontSize: "0.8rem", fontWeight: "600" },
  time: { color: "#8a93a3", fontSize: "0.65rem", textTransform: "uppercase" },
  icon: { fontSize: "1.6rem" },
  middle: { flex: 1 },
  condition: {
    color: "#fff",
    fontSize: "0.85rem",
    fontWeight: "600",
    margin: 0,
    textTransform: "capitalize",
  },
  summary: { color: "#94a3b8", fontSize: "0.75rem", margin: "2px 0 0 0" },
  badge: {
    fontSize: "0.65rem",
    fontWeight: "700",
    padding: "4px 10px",
    borderRadius: "6px",
    border: "1px solid",
    background: "transparent",
  },
  expandIcon: { color: "#8a93a3", fontSize: "0.8rem", padding: "4px" },
  details: {
    padding: "16px",
    borderTop: "1px solid #2a2f3a",
    background: "rgba(255,255,255,0.02)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  interpretationBlock: {
    background: "rgba(255,255,255,0.04)",
    padding: "10px 14px",
    borderRadius: "8px",
    borderLeft: "3px solid #3b82f6",
  },
  interpretationTitle: {
    color: "#94a3b8",
    fontSize: "0.7rem",
    textTransform: "uppercase",
    marginBottom: "4px",
  },
  interpretationText: { color: "#fff", fontSize: "0.85rem", margin: 0 },
  recommendationBlock: {
    display: "flex",
    gap: "6px",
    marginTop: "6px",
    flexWrap: "wrap",
  },
  recommendationLabel: {
    color: "#10b981",
    fontSize: "0.75rem",
    fontWeight: "600",
  },
  recommendationText: { color: "#94a3b8", fontSize: "0.75rem" },
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "8px",
  },
  detailItem: {
    display: "flex",
    flexDirection: "column",
    background: "rgba(255,255,255,0.03)",
    padding: "6px 10px",
    borderRadius: "4px",
    borderLeft: "2px solid #2a2f3a",
  },
  detailLabel: {
    color: "#8a93a3",
    fontSize: "0.6rem",
    textTransform: "uppercase",
  },
  detailValue: { color: "#fff", fontSize: "0.75rem", fontWeight: "500" },
  detailAction: { color: "#f59e0b", fontSize: "0.65rem", marginTop: "2px" },
  rawDataBlock: {
    marginTop: "8px",
    borderTop: "1px solid #1a1f2a",
    paddingTop: "10px",
  },
  rawDataTitle: {
    color: "#64748b",
    fontSize: "0.65rem",
    textTransform: "uppercase",
    display: "block",
    marginBottom: "6px",
  },
  rawDataGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: "4px",
  },
  rawDataItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "2px 0",
    borderBottom: "1px solid #1a1f2a",
  },
  rawDataLabel: { color: "#64748b", fontSize: "0.6rem" },
  rawDataValue: { color: "#94a3b8", fontSize: "0.6rem" },
  vehicleInfo: {
    marginTop: "12px",
    paddingTop: "12px",
    borderTop: "1px solid #2a2f3a",
    display: "flex",
    justifyContent: "space-between",
    color: "#8a93a3",
    fontSize: "0.75rem",
  },
};

export default WaypointCard;
