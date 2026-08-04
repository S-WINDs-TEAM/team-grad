import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// import { useDispatch } from 'react-redux';
import toast from "react-hot-toast";
import useAuth from "../hooks/useAuth";
import { getHistoryApi } from "../api/routeApi";
import { getRiskPathColor } from "../utils/riskColors";
import { theme } from "../styles/theme";

const TripHistoryPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await getHistoryApi();
        setTrips(response.data.trips);
      } catch (err) {
        toast.error("Could not load trip history");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>◈</span>
          <span style={styles.logoText}>S-WINDs</span>
          <span style={styles.logoSubtext}>Trip History</span>
        </div>
        <div style={styles.headerRight}>
          <button style={styles.backBtn} onClick={() => navigate(-1)}>
            ← Back
          </button>
          <span style={styles.userName}>{user?.name}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Content */}
      <div style={styles.content}>
        <h1 style={styles.title}>📜 Trip History</h1>
        <p style={styles.subtitle}>All your planned trips, sorted by date.</p>

        {loading ? (
          <div style={styles.loading}>Loading trips...</div>
        ) : trips.length === 0 ? (
          <div style={styles.empty}>
            <span style={styles.emptyIcon}>🗺️</span>
            <p>No trips planned yet.</p>
            <button style={styles.planBtn} onClick={() => navigate("/plan")}>
              Plan your first trip →
            </button>
          </div>
        ) : (
          <div style={styles.tripList}>
            {trips.map((trip, index) => (
              <div key={trip._id || index} style={styles.tripCard}>
                <div style={styles.tripHeader}>
                  <div style={styles.tripRoute}>
                    <span style={styles.tripOrigin}>
                      {trip.origin?.address || "Start"}
                    </span>
                    <span style={styles.tripArrow}>→</span>
                    <span style={styles.tripDestination}>
                      {trip.destination?.address || "End"}
                    </span>
                  </div>
                  <span
                    style={{
                      ...styles.riskBadge,
                      color: getRiskPathColor(trip.overallRiskLevel),
                      borderColor: getRiskPathColor(trip.overallRiskLevel),
                    }}
                  >
                    {trip.overallRiskLevel?.toUpperCase() || "N/A"}
                  </span>
                </div>

                <div style={styles.tripDetails}>
                  <span>
                    📅 {formatDate(trip.departureTime || trip.createdAt)}
                  </span>
                  <span>📏 {trip.totalDistanceKm?.toFixed(1) || "N/A"} km</span>
                  <span>⏱️ {Math.round(trip.totalDurationMin || 0)} min</span>
                  <span>🚗 {trip.vehicleType || "N/A"}</span>
                </div>

                <button
                  style={styles.viewBtn}
                  onClick={() => navigate(`/plan?tripId=${trip._id}`)}
                >
                  View Details →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    background: theme.bgPrimary,
    display: "flex",
    flexDirection: "column",
    fontFamily: "system-ui, sans-serif",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
    borderBottom: `1px solid ${theme.borderDefault}`,
  },
  logo: { display: "flex", alignItems: "center", gap: "10px" },
  logoIcon: { fontSize: "20px", color: theme.accentBlue },
  logoText: { fontSize: "18px", fontWeight: "700", color: theme.textPrimary },
  logoSubtext: { fontSize: "12px", color: theme.textMuted, marginLeft: "4px" },
  headerRight: { display: "flex", alignItems: "center", gap: "16px" },
  userName: { fontSize: "13px", color: theme.textSecondary },
  backBtn: {
    padding: "6px 14px",
    background: "transparent",
    border: `1px solid ${theme.borderDefault}`,
    borderRadius: "8px",
    color: theme.textSecondary,
    fontSize: "13px",
    cursor: "pointer",
  },
  logoutBtn: {
    padding: "8px 14px",
    background: "transparent",
    border: `1px solid ${theme.borderDefault}`,
    borderRadius: "8px",
    color: theme.textSecondary,
    fontSize: "13px",
    cursor: "pointer",
  },

  content: {
    flex: 1,
    padding: "32px 24px",
    maxWidth: "900px",
    margin: "0 auto",
    width: "100%",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: theme.textPrimary,
    margin: "0 0 8px",
  },
  subtitle: { fontSize: "15px", color: theme.textMuted, margin: "0 0 32px" },

  loading: {
    color: theme.textSecondary,
    fontSize: "16px",
    textAlign: "center",
    padding: "60px 0",
  },

  empty: {
    textAlign: "center",
    padding: "60px 0",
    color: theme.textMuted,
  },
  emptyIcon: { fontSize: "48px", display: "block", marginBottom: "16px" },
  planBtn: {
    marginTop: "16px",
    padding: "12px 24px",
    background: theme.accentBlue,
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },

  tripList: { display: "flex", flexDirection: "column", gap: "16px" },
  tripCard: {
    background: theme.bgSecondary,
    border: `1px solid ${theme.borderDefault}`,
    borderRadius: "12px",
    padding: "18px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  tripHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "8px",
  },
  tripRoute: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: theme.textPrimary,
    fontSize: "15px",
    fontWeight: "600",
  },
  tripOrigin: { color: theme.textPrimary },
  tripArrow: { color: theme.textMuted },
  tripDestination: { color: theme.textPrimary },
  riskBadge: {
    fontSize: "11px",
    fontWeight: "700",
    padding: "4px 12px",
    borderRadius: "6px",
    border: "1px solid",
    background: "transparent",
    textTransform: "uppercase",
  },
  tripDetails: {
    display: "flex",
    flexWrap: "wrap",
    gap: "16px",
    color: theme.textSecondary,
    fontSize: "13px",
  },
  viewBtn: {
    alignSelf: "flex-start",
    padding: "6px 16px",
    background: "transparent",
    border: `1px solid ${theme.borderDefault}`,
    borderRadius: "8px",
    color: theme.accentBlue,
    fontSize: "13px",
    cursor: "pointer",
    ":hover": { background: "rgba(37, 99, 235, 0.1)" },
  },
};

export default TripHistoryPage;
