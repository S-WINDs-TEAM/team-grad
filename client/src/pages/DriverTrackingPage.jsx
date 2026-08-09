import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import useAuth from '../hooks/useAuth';
import useSocket from '../hooks/useSocket';
import { getMyVehicleApi } from '../api/fleetApi';
import { getFleetStatusColor, getFleetStatusLabel } from '../utils/fleetColors';
import { theme } from '../styles/theme';

// company_driver only. individual / company_admin get redirected to /home below.
// simple screen: toggle location sharing on/off, watchPosition streams updates over the socket.
const DriverTrackingPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { sendLocation } = useSocket();
  const { connected, alerts } = useSelector((state) => state.fleet);

  const [vehicle, setVehicle] = useState(null);
  const [sharing, setSharing] = useState(false);
  const [lastPosition, setLastPosition] = useState(null);
  const watchIdRef = useRef(null);

  // the socket broadcasts every alert to the whole company room, so filter down to
  // only the ones that actually targeted THIS driver (admin picks specific vehicles).
  const myAlerts = alerts.filter((a) => a.targetDriverIds?.includes(user?.id));

  // toast a popup the moment a new alert arrives, in addition to the persistent banner below
  useEffect(() => {
    if (myAlerts.length === 0) return;
    const latest = myAlerts[0];
    toast(latest.message, { icon: '⚠️', duration: 6000 });
  }, [myAlerts.length]);

  useEffect(() => {
    if (user && user.role !== 'company_driver') {
      navigate('/home');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const response = await getMyVehicleApi();
        setVehicle(response.data.vehicle);
      } catch (err) {
        // 404 just means no vehicle assigned yet — not a real error for this screen
      }
    };
    fetchVehicle();
  }, []);

  const startSharing = () => {
    if (!navigator.geolocation) {
      return toast.error('geolocation is not supported on this device');
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLastPosition({ lat: latitude, lng: longitude });
        sendLocation(latitude, longitude);
      },
      () => toast.error('could not get your location — check permissions'),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
    setSharing(true);
    toast.success('sharing your location with the dispatcher');
  };

  const stopSharing = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setSharing(false);
  };

  useEffect(() => () => stopSharing(), []); // cleanup on unmount

  const handleLogout = async () => {
    stopSharing();
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div style={styles.page}>
      <div style={styles.bgGlow} />

      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>◈</span>
          <span style={styles.logoText}>S-WINDs</span>
        </div>
        <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
      </header>

      <div style={styles.content}>
        <h1 style={styles.title}>Hey {user?.name} 👋</h1>
        <p style={styles.subtitle}>
          {sharing ? 'Your location is being shared live.' : 'Start sharing to let dispatch track you.'}
        </p>

        {myAlerts.length > 0 && (
          <div style={styles.alertBanner}>
            <span style={styles.alertBannerIcon}>⚠️</span>
            <div>
              <div style={styles.alertBannerType}>{myAlerts[0].alertType}</div>
              <div style={styles.alertBannerMsg}>{myAlerts[0].message}</div>
            </div>
          </div>
        )}

        {vehicle && (
          <div style={styles.vehicleCard}>
            <div style={styles.vehicleCardHeader}>
              <span style={styles.vehiclePlate}>{vehicle.plateNumber}</span>
              <span style={{ ...styles.statusBadge, color: getFleetStatusColor(vehicle.status) }}>
                {getFleetStatusLabel(vehicle.status)}
              </span>
            </div>
            <span style={styles.vehicleType}>{vehicle.vehicleType}</span>
          </div>
        )}

        {!vehicle && (
          <p style={styles.noVehicleText}>No vehicle assigned to you yet — contact your fleet admin.</p>
        )}

        <div style={styles.connectionRow}>
          <span style={{ ...styles.dot, background: connected ? theme.accentGreen : theme.accentRed }} />
          {connected ? 'Connected' : 'Connecting…'}
        </div>

        <button
          style={sharing ? styles.stopBtn : styles.startBtn}
          onClick={sharing ? stopSharing : startSharing}
          disabled={!vehicle}
        >
          {sharing ? '⏹ Stop Sharing' : '▶ Start Sharing Location'}
        </button>

        {lastPosition && (
          <p style={styles.coords}>
            Last sent: {lastPosition.lat.toFixed(5)}, {lastPosition.lng.toFixed(5)}
          </p>
        )}
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh', background: theme.bgPrimary, fontFamily: 'system-ui, sans-serif',
    position: 'relative', overflow: 'hidden',
  },
  bgGlow: {
    position: 'absolute', top: '-10%', left: '30%', width: '50%', height: '60%',
    background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  header: {
    position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', padding: '16px 24px', borderBottom: `1px solid ${theme.borderDefault}`,
  },
  logo: { display: 'flex', alignItems: 'center', gap: '10px' },
  logoIcon: { fontSize: '20px', color: theme.accentBlue },
  logoText: { fontSize: '18px', fontWeight: '700', color: theme.textPrimary },
  logoutBtn: {
    padding: '8px 14px', background: 'transparent', border: `1px solid ${theme.borderDefault}`,
    borderRadius: '8px', color: theme.textSecondary, fontSize: '13px', cursor: 'pointer',
  },
  content: {
    position: 'relative', zIndex: 1, maxWidth: '420px', margin: '60px auto', padding: '0 24px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px',
  },
  title: { fontSize: '26px', fontWeight: '800', color: theme.textPrimary, margin: 0 },
  subtitle: { fontSize: '14px', color: theme.textMuted, margin: 0 },
  vehicleCard: {
    width: '100%', background: theme.bgSecondary, border: `1px solid ${theme.borderDefault}`,
    borderRadius: '14px', padding: '16px', textAlign: 'left',
  },
  vehicleCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  vehiclePlate: { fontSize: '16px', fontWeight: '700', color: theme.textPrimary },
  statusBadge: { fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' },
  vehicleType: { fontSize: '12px', color: theme.textMuted, textTransform: 'capitalize' },
  noVehicleText: { fontSize: '13px', color: theme.textMuted },
  alertBanner: {
    width: '100%', display: 'flex', gap: '10px', textAlign: 'left',
    background: 'rgba(239,68,68,0.1)', border: `1px solid ${theme.accentRed}`,
    borderRadius: '12px', padding: '14px',
  },
  alertBannerIcon: { fontSize: '18px' },
  alertBannerType: { fontSize: '11px', fontWeight: '700', color: theme.accentRed, textTransform: 'uppercase' },
  alertBannerMsg: { fontSize: '13px', color: theme.textPrimary, marginTop: '2px' },
  connectionRow: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: theme.textSecondary },
  dot: { width: '8px', height: '8px', borderRadius: '50%' },
  startBtn: {
    width: '100%', padding: '16px', background: theme.accentGreen, color: '#fff', border: 'none',
    borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer',
  },
  stopBtn: {
    width: '100%', padding: '16px', background: theme.accentRed, color: '#fff', border: 'none',
    borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer',
  },
  coords: { fontSize: '11px', color: theme.textMuted },
};

export default DriverTrackingPage;