import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import useAuth from "../hooks/useAuth";
import { uploadProfilePhotoApi } from "../api/authApi";
import { setUser } from "../store/authSlice";
import useLocalWeather from "../hooks/useLocalWeather";

const HomePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, logout } = useAuth();
  const {
    weather: localWeather,
    loading: weatherLoading,
    error: weatherError,
  } = useLocalWeather();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  // company_admin and company_driver have their own landing pages — this page is
  // for individual drivers only. Guards against stale bookmarks / back-button navigation.
  useEffect(() => {
    if (user?.role === "company_admin") navigate("/fleet", { replace: true });
    else if (user?.role === "company_driver")
      navigate("/fleet-driver", { replace: true });
  }, [user, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const response = await uploadProfilePhotoApi(formData);
      dispatch(setUser({ ...user, profilePhoto: response.data.profilePhoto }));
      toast.success("profile photo updated");
    } catch (err) {
      toast.error(err.response?.data?.msg || "could not upload photo");
    } finally {
      setUploading(false);
      e.target.value = ""; // allows re-selecting the same file again later
    }
  };

  // Helper: get weather icon emoji
  const getWeatherIcon = (condition) => {
    if (!condition) return "🌤️";
    const map = {
      clear: "☀️",
      partly_cloudy: "⛅",
      cloudy: "☁️",
      rain: "🌧️",
      heavy_rain: "🌊",
      thunderstorm: "⛈️",
      snow: "❄️",
      fog: "🌫️",
      sandstorm: "💨",
    };
    return map[condition] || "🌤️";
  };

  const cards = [
    {
      title: "Trip Planner",
      desc: "Plan a new route with weather forecasting",
      icon: "🗺️",
      path: "/plan",
    },
    {
      title: "Live Drive Mode",
      desc: "Start a live trip with real-time alerts",
      icon: "🚗",
      path: "/drive",
      disabled: true,
    },
    {
      title: "Saved Routes",
      desc: "View your trip history",
      icon: "📍",
      path: "/history",
      disabled: false,
    },
    {
      title: "Fleet Hub",
      desc: "Register or manage a company fleet",
      icon: "🚛",
      path: "/register?type=fleet",
    },
  ];

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <span style={styles.logo}>⚡ S-WINDS</span>
        <div style={styles.headerRight}>
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            ref={fileInputRef}
            onChange={handlePhotoChange}
            style={{ display: "none" }}
          />
          <div
            style={styles.avatarWrap}
            onClick={handlePhotoClick}
            title="Click to change your photo"
          >
            {user?.profilePhoto ? (
              <img
                src={`http://localhost:5000${user.profilePhoto}`}
                alt="profile"
                style={styles.avatarImg}
              />
            ) : (
              <span style={styles.avatarPlaceholder}>👤</span>
            )}
            {uploading && <span style={styles.avatarUploading}>…</span>}
          </div>
          <span style={styles.userName}>{user?.name}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div style={styles.welcome}>
        <h1 style={styles.welcomeTitle}>
          Welcome back, {user?.name?.split(" ")[0]}
        </h1>
        <p style={styles.welcomeSubtitle}>Where are we heading today?</p>
      </div>

      {/* NEW: Local Weather Widget */}
      <div style={styles.weatherWidget}>
        <div style={styles.weatherWidgetInner}>
          <div style={styles.weatherIcon}>
            {weatherLoading
              ? "⏳"
              : localWeather
                ? getWeatherIcon(localWeather.condition)
                : "🌍"}
          </div>
          <div style={styles.weatherInfo}>
            <div style={styles.weatherLabel}>
              {weatherLoading
                ? "Detecting your location..."
                : weatherError
                  ? "⚠️ Weather unavailable"
                  : "Local Weather"}
            </div>
            <div style={styles.weatherTemp}>
              {localWeather
                ? `${Math.round(localWeather.temperature)}°C`
                : "--"}
            </div>
          </div>
          {localWeather && (
            <div style={styles.weatherDetails}>
              <span>💨 {Math.round(localWeather.windSpeed)} km/h</span>
              <span>💧 {localWeather.humidity}%</span>
              <span>👁️ {localWeather.visibility} km</span>
              <span style={styles.weatherCondition}>
                {localWeather.description ||
                  localWeather.condition ||
                  "Unknown"}
              </span>
            </div>
          )}
          {weatherError && !weatherLoading && (
            <span style={styles.weatherError}>⚠️ Could not fetch weather</span>
          )}
        </div>
      </div>

      <div style={styles.grid}>
        {cards.map((card) => (
          <div
            key={card.title}
            style={{
              ...styles.card,
              ...(card.disabled ? styles.cardDisabled : {}),
            }}
            onClick={() => !card.disabled && navigate(card.path)}
          >
            <span style={styles.cardIcon}>{card.icon}</span>
            <h3 style={styles.cardTitle}>{card.title}</h3>
            <p style={styles.cardDesc}>{card.desc}</p>
            {card.disabled && (
              <span style={styles.comingSoon}>Coming Soon</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0a0e14",
    padding: "24px",
    fontFamily: "system-ui, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "40px",
  },
  logo: {
    color: "#d4ff00",
    fontWeight: "700",
    fontSize: "1.1rem",
    letterSpacing: "1px",
  },
  headerRight: { display: "flex", alignItems: "center", gap: "16px" },
  avatarWrap: {
    position: "relative",
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "#161b24",
    border: "1px solid #2a2f3a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  avatarPlaceholder: { fontSize: "0.9rem" },
  avatarUploading: {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    color: "#d4ff00",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.8rem",
  },
  userName: { color: "#8a93a3", fontSize: "0.85rem" },
  logoutBtn: {
    background: "transparent",
    border: "1px solid #2a2f3a",
    color: "#8a93a3",
    padding: "6px 14px",
    borderRadius: "6px",
    fontSize: "0.8rem",
    cursor: "pointer",
  },
  welcome: { marginBottom: "32px" },
  welcomeTitle: { color: "#fff", fontSize: "1.8rem", margin: 0 },
  welcomeSubtitle: { color: "#8a93a3", fontSize: "0.95rem", marginTop: "6px" },
  // NEW: Weather widget styles
  weatherWidget: {
    background: "#11151c",
    border: "1px solid rgba(212,255,0,0.1)",
    borderRadius: "14px",
    padding: "16px 20px",
    marginBottom: "32px",
  },
  weatherWidgetInner: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
  },
  weatherIcon: {
    fontSize: "2.5rem",
    lineHeight: 1,
  },
  weatherInfo: {
    flex: 1,
  },
  weatherLabel: {
    color: "#8a93a3",
    fontSize: "0.75rem",
    textTransform: "uppercase",
  },
  weatherTemp: {
    color: "#fff",
    fontSize: "1.8rem",
    fontWeight: "700",
    lineHeight: 1.2,
  },
  weatherDetails: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    fontSize: "0.85rem",
    color: "#8a93a3",
    alignItems: "center",
  },
  weatherCondition: {
    background: "#1a1f2a",
    padding: "4px 12px",
    borderRadius: "20px",
    border: "1px solid #2a2f3a",
    fontSize: "0.7rem",
    textTransform: "capitalize",
  },
  weatherError: {
    color: "#ff4d4d",
    fontSize: "0.8rem",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
  },
  card: {
    background: "#11151c",
    border: "1px solid rgba(212,255,0,0.1)",
    borderRadius: "14px",
    padding: "24px",
    cursor: "pointer",
    transition: "all 0.2s",
    position: "relative",
  },
  cardDisabled: { opacity: 0.4, cursor: "not-allowed" },
  cardIcon: { fontSize: "2rem" },
  cardTitle: { color: "#fff", fontSize: "1.1rem", margin: "12px 0 6px 0" },
  cardDesc: { color: "#8a93a3", fontSize: "0.8rem", margin: 0 },
  comingSoon: {
    position: "absolute",
    top: "16px",
    right: "16px",
    fontSize: "0.65rem",
    color: "#f5a623",
    border: "1px solid #f5a623",
    borderRadius: "4px",
    padding: "2px 8px",
  },
};

export default HomePage;
