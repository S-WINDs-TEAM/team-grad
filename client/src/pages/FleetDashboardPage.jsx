import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import toast from 'react-hot-toast';
import useAuth from '../hooks/useAuth';
import useSocket from '../hooks/useSocket';
import { getFleetStatusApi, getDriversApi, addVehicleApi, inviteDriverApi, sendAlertApi, uploadVehiclePhotoApi } from '../api/fleetApi';
import { setVehicles, upsertVehicle } from '../store/fleetSlice';
import { getFleetStatusColor, getFleetStatusLabel } from '../utils/fleetColors';
import { theme } from '../styles/theme';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const vehicleIcon = (status) => L.divIcon({
  className: 'fleet-marker',
  html: `<div style="
      background-color:${getFleetStatusColor(status)};
      width:30px;height:30px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.35);
      font-size:15px;">🚚</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
});

// company_admin only. company_driver / individual get redirected to /home in the effect below.
const FleetDashboardPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, logout } = useAuth();
  useSocket(); // connects + feeds fleet:update / fleet:alert into the store as a side effect

  const { vehicles, alerts, connected } = useSelector((state) => state.fleet);

  const [search, setSearch] = useState('');
  const [selectedVehicleIds, setSelectedVehicleIds] = useState([]);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('weather');
  const [sending, setSending] = useState(false);

  const [showAddForms, setShowAddForms] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [newVehicle, setNewVehicle] = useState({ plateNumber: '', vehicleType: 'truck', driverId: '' });
  const [newDriver, setNewDriver] = useState({ name: '', email: '' });

  // vehicle photo upload — one shared hidden <input>, we just track which vehicle it's for
  const vehiclePhotoInputRef = useRef(null);
  const [photoTargetVehicleId, setPhotoTargetVehicleId] = useState(null);

  useEffect(() => {
    if (user && user.role !== 'company_admin') {
      navigate('/home');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await getFleetStatusApi();
        dispatch(setVehicles(response.data.vehicles));
      } catch (err) {
        toast.error(err.response?.data?.msg || 'could not load fleet status');
      }
    };
    fetchStatus();
    fetchDrivers();
  }, [dispatch]);

  const fetchDrivers = async () => {
    try {
      const response = await getDriversApi();
      setDrivers(response.data.drivers);
    } catch (err) {
      // non-critical for the page to render, the dropdown just stays empty
    }
  };

  const stats = useMemo(() => {
    const total = vehicles.length;
    const active = vehicles.filter((v) => v.status === 'active').length;
    const idle = vehicles.filter((v) => v.status === 'idle').length;
    const offline = vehicles.filter((v) => v.status === 'offline').length;
    return { total, active, idle, offline };
  }, [vehicles]);

  const filteredVehicles = useMemo(() => {
    if (!search.trim()) return vehicles;
    const q = search.toLowerCase();
    return vehicles.filter((v) =>
      v.plateNumber?.toLowerCase().includes(q) || v.driverId?.name?.toLowerCase().includes(q)
    );
  }, [vehicles, search]);

  const vehiclesWithLocation = useMemo(
    () => vehicles.filter((v) => v.currentLocation?.coordinates?.some((c) => c !== 0)),
    [vehicles]
  );

  const toggleVehicleSelection = (id) => {
    setSelectedVehicleIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const handleSendAlert = async (e) => {
    e.preventDefault();
    if (selectedVehicleIds.length === 0) return toast.error('select at least one vehicle');
    if (!alertMessage.trim()) return toast.error('write a message first');

    setSending(true);
    try {
      await sendAlertApi({ vehicleIds: selectedVehicleIds, message: alertMessage, alertType });
      toast.success(`alert sent to ${selectedVehicleIds.length} vehicle(s)`);
      setAlertMessage('');
      setSelectedVehicleIds([]);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'could not send alert');
    } finally {
      setSending(false);
    }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    if (!newVehicle.plateNumber.trim()) return toast.error('plate number is required');
    try {
      const payload = { plateNumber: newVehicle.plateNumber, vehicleType: newVehicle.vehicleType };
      if (newVehicle.driverId) payload.driverId = newVehicle.driverId; // omit entirely if "no driver yet"
      const response = await addVehicleApi(payload);
      dispatch(setVehicles([...vehicles, response.data.vehicle]));
      toast.success('vehicle added');
      setNewVehicle({ plateNumber: '', vehicleType: 'truck', driverId: '' });
    } catch (err) {
      toast.error(err.response?.data?.msg || 'could not add vehicle');
    }
  };

  const handleInviteDriver = async (e) => {
    e.preventDefault();
    if (!newDriver.name.trim() || !newDriver.email.trim()) return toast.error('name and email are required');
    try {
      const response = await inviteDriverApi(newDriver);
      toast.success(`invite sent to ${newDriver.email}`);
      console.log('invite link (dev mode):', response.data.inviteLink);
      setNewDriver({ name: '', email: '' });
      fetchDrivers(); // so the new (still 'invited') driver shows up in the Add Vehicle dropdown right away
    } catch (err) {
      toast.error(err.response?.data?.msg || 'could not invite driver');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleVehiclePhotoClick = (vehicleId) => {
    setPhotoTargetVehicleId(vehicleId);
    vehiclePhotoInputRef.current?.click();
  };

  const handleVehiclePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !photoTargetVehicleId) return;
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const response = await uploadVehiclePhotoApi(photoTargetVehicleId, formData);
      dispatch(upsertVehicle(response.data.vehicle));
      toast.success('vehicle photo updated');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'could not upload vehicle photo');
    } finally {
      e.target.value = '';
      setPhotoTargetVehicleId(null);
    }
  };

  const mapCenter = vehiclesWithLocation.length > 0
    ? [vehiclesWithLocation[0].currentLocation.coordinates[1], vehiclesWithLocation[0].currentLocation.coordinates[0]]
    : [30.0444, 31.2357]; // Cairo fallback

  return (
    <div style={styles.page}>

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>◈</span>
          <span style={styles.logoText}>S-WINDs</span>
          <span style={styles.logoSubtext}>Fleet Management</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.userName}>{user?.name} · Admin</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* Stats bar */}
      <div style={styles.statsBar}>
        <StatCard label="Total Vehicles" value={stats.total} icon="🚚" />
        <StatCard label="On the Move" value={stats.active} icon="🟢" color={theme.accentGreen} />
        <StatCard label="Idle" value={stats.idle} icon="🟡" color={theme.accentOrange} />
        <StatCard label="Offline" value={stats.offline} icon="🔴" color={theme.accentRed} />
        <div style={styles.connectionDot}>
          <span style={{
            ...styles.dot,
            background: connected ? theme.accentGreen : theme.accentRed,
          }} />
          {connected ? 'Real-time Tracking' : 'Connecting…'}
        </div>
      </div>

      <div style={styles.body}>

        {/* Sidebar: vehicle list */}
        <div style={styles.sidebar}>
          <input
            style={styles.searchInput}
            placeholder="Search vehicles or drivers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            ref={vehiclePhotoInputRef}
            onChange={handleVehiclePhotoChange}
            style={{ display: 'none' }}
          />

          <div style={styles.vehicleList}>
            {filteredVehicles.length === 0 && (
              <p style={styles.emptyText}>No vehicles yet — add one below.</p>
            )}
            {filteredVehicles.map((v) => (
              <div key={v._id} style={styles.vehicleItem}>
                <input
                  type="checkbox"
                  checked={selectedVehicleIds.includes(v._id)}
                  onChange={() => toggleVehicleSelection(v._id)}
                  style={styles.checkbox}
                />
                <div
                  style={styles.vehicleThumbWrap}
                  onClick={() => handleVehiclePhotoClick(v._id)}
                  title="Click to change vehicle photo"
                >
                  {v.photoUrl ? (
                    <img src={`http://localhost:5000${v.photoUrl}`} alt={v.plateNumber} style={styles.vehicleThumbImg} />
                  ) : (
                    <span style={styles.vehicleThumbPlaceholder}>📷</span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={styles.vehiclePlate}>{v.plateNumber}</div>
                  <div style={styles.vehicleDriver}>{v.driverId?.name || 'No driver assigned'}</div>
                </div>
                <span style={{ ...styles.statusBadge, color: getFleetStatusColor(v.status) }}>
                  {getFleetStatusLabel(v.status)}
                </span>
              </div>
            ))}
          </div>

          <button style={styles.toggleFormsBtn} onClick={() => setShowAddForms((s) => !s)}>
            {showAddForms ? '− Hide forms' : '+ Add vehicle / invite driver'}
          </button>

          {showAddForms && (
            <div style={styles.formsBlock}>
              <form onSubmit={handleAddVehicle} style={styles.miniForm}>
                <span style={styles.miniFormTitle}>Add Vehicle</span>
                <input
                  style={styles.miniInput}
                  placeholder="Plate number"
                  value={newVehicle.plateNumber}
                  onChange={(e) => setNewVehicle({ ...newVehicle, plateNumber: e.target.value })}
                />
                <select
                  style={styles.miniInput}
                  value={newVehicle.vehicleType}
                  onChange={(e) => setNewVehicle({ ...newVehicle, vehicleType: e.target.value })}
                >
                  <option value="truck">🚛 Truck</option>
                  <option value="car">🚗 Car</option>
                  <option value="motorcycle">🏍️ Motorcycle</option>
                </select>
                <select
                  style={styles.miniInput}
                  value={newVehicle.driverId}
                  onChange={(e) => setNewVehicle({ ...newVehicle, driverId: e.target.value })}
                >
                  <option value="">No driver yet (assign later)</option>
                  {drivers.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} {d.accountStatus === 'invited' ? '(invite pending)' : ''}
                    </option>
                  ))}
                </select>
                <button type="submit" style={styles.miniBtn}>Add</button>
              </form>

              <form onSubmit={handleInviteDriver} style={styles.miniForm}>
                <span style={styles.miniFormTitle}>Invite Driver</span>
                <input
                  style={styles.miniInput}
                  placeholder="Driver name"
                  value={newDriver.name}
                  onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })}
                />
                <input
                  style={styles.miniInput}
                  placeholder="Driver email"
                  value={newDriver.email}
                  onChange={(e) => setNewDriver({ ...newDriver, email: e.target.value })}
                />
                <button type="submit" style={{ ...styles.miniBtn, background: theme.accentGreen }}>Invite</button>
              </form>
            </div>
          )}
        </div>

        {/* Live Map */}
        <div style={styles.mapContainer}>
          <MapContainer center={mapCenter} zoom={7} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; OpenStreetMap &copy; CARTO'
            />
            {vehiclesWithLocation.map((v) => (
              <Marker
                key={v._id}
                position={[v.currentLocation.coordinates[1], v.currentLocation.coordinates[0]]}
                icon={vehicleIcon(v.status)}
              >
                <Popup>
                  {v.photoUrl && (
                    <img
                      src={`http://localhost:5000${v.photoUrl}`}
                      alt={v.plateNumber}
                      style={{ width: '100%', maxWidth: '160px', borderRadius: '6px', marginBottom: '6px' }}
                    />
                  )}
                  <strong>{v.plateNumber}</strong><br />
                  {v.driverId?.name || 'No driver'}<br />
                  Status: {getFleetStatusLabel(v.status)}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Alerts panel */}
        <div style={styles.alertsPanel}>
          <h3 style={styles.panelTitle}>⚠ Dispatch Alert</h3>
          <form onSubmit={handleSendAlert} style={styles.alertForm}>
            <label style={styles.alertLabel}>
              Type
              <select style={styles.miniInput} value={alertType} onChange={(e) => setAlertType(e.target.value)}>
                <option value="weather">Weather Warning</option>
                <option value="safety">Safety Instruction</option>
                <option value="general">General Message</option>
              </select>
            </label>
            <label style={styles.alertLabel}>
              Message
              <textarea
                style={{ ...styles.miniInput, minHeight: '70px', resize: 'vertical' }}
                maxLength={200}
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                placeholder="Severe thunderstorm ahead, reduce speed…"
              />
            </label>
            <span style={styles.charCount}>{alertMessage.length} / 200 · {selectedVehicleIds.length} vehicle(s) selected</span>
            <button type="submit" disabled={sending} style={styles.sendAlertBtn}>
              {sending ? 'Sending…' : '📨 Send Now'}
            </button>
          </form>

          <h3 style={{ ...styles.panelTitle, marginTop: '24px' }}>Recent Alerts</h3>
          <div style={styles.alertHistory}>
            {alerts.length === 0 && <p style={styles.emptyText}>No alerts sent yet.</p>}
            {alerts.map((a, i) => (
              <div key={i} style={styles.alertHistoryItem}>
                <div style={styles.alertHistoryMsg}>{a.message}</div>
                <div style={styles.alertHistoryMeta}>
                  {a.alertType} · {a.targetDriverIds?.length || 0} driver(s) · {new Date(a.sentAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }) => (
  <div style={styles.statCard}>
    <span style={styles.statIcon}>{icon}</span>
    <div>
      <div style={{ ...styles.statValue, color: color || theme.textPrimary }}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  </div>
);

const styles = {
  page: { minHeight: '100vh', background: theme.bgPrimary, display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif' },

  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 24px', borderBottom: `1px solid ${theme.borderDefault}`,
  },
  logo: { display: 'flex', alignItems: 'center', gap: '10px' },
  logoIcon: { fontSize: '20px', color: theme.accentBlue },
  logoText: { fontSize: '18px', fontWeight: '700', color: theme.textPrimary },
  logoSubtext: { fontSize: '12px', color: theme.textMuted, marginLeft: '4px' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '16px' },
  userName: { fontSize: '13px', color: theme.textSecondary },
  logoutBtn: {
    padding: '8px 14px', background: 'transparent', border: `1px solid ${theme.borderDefault}`,
    borderRadius: '8px', color: theme.textSecondary, fontSize: '13px', cursor: 'pointer',
  },

  statsBar: {
    display: 'flex', gap: '16px', padding: '16px 24px',
    borderBottom: `1px solid ${theme.borderDefault}`, alignItems: 'center', flexWrap: 'wrap',
  },
  statCard: {
    display: 'flex', alignItems: 'center', gap: '10px',
    background: theme.bgSecondary, border: `1px solid ${theme.borderDefault}`,
    borderRadius: '12px', padding: '10px 16px',
  },
  statIcon: { fontSize: '18px' },
  statValue: { fontSize: '18px', fontWeight: '700' },
  statLabel: { fontSize: '11px', color: theme.textMuted },
  connectionDot: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: theme.textSecondary },
  dot: { width: '8px', height: '8px', borderRadius: '50%' },

  body: { flex: 1, display: 'grid', gridTemplateColumns: '280px 1fr 320px', minHeight: 0 },

  sidebar: { borderRight: `1px solid ${theme.borderDefault}`, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' },
  searchInput: {
    width: '100%', padding: '10px 12px', background: theme.bgTertiary,
    border: `1px solid ${theme.borderDefault}`, borderRadius: '10px', color: theme.textPrimary,
    fontSize: '13px', outline: 'none', boxSizing: 'border-box',
  },
  vehicleList: { display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 },
  vehicleItem: {
    display: 'flex', alignItems: 'center', gap: '10px', padding: '10px',
    background: theme.bgSecondary, border: `1px solid ${theme.borderDefault}`,
    borderRadius: '10px', cursor: 'pointer',
  },
  checkbox: { accentColor: theme.accentBlue },
  vehicleThumbWrap: {
    width: '28px', height: '28px', borderRadius: '6px', overflow: 'hidden',
    background: theme.bgTertiary, border: `1px solid ${theme.borderDefault}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
  },
  vehicleThumbImg: { width: '100%', height: '100%', objectFit: 'cover' },
  vehicleThumbPlaceholder: { fontSize: '13px' },
  vehiclePlate: { fontSize: '13px', fontWeight: '600', color: theme.textPrimary },
  vehicleDriver: { fontSize: '11px', color: theme.textMuted },
  statusBadge: { fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' },
  emptyText: { fontSize: '12px', color: theme.textMuted, textAlign: 'center', padding: '12px' },

  toggleFormsBtn: {
    padding: '10px', background: 'transparent', border: `1px dashed ${theme.borderDefault}`,
    borderRadius: '10px', color: theme.accentBlue, fontSize: '12px', cursor: 'pointer',
  },
  formsBlock: { display: 'flex', flexDirection: 'column', gap: '12px' },
  miniForm: {
    display: 'flex', flexDirection: 'column', gap: '8px',
    background: theme.bgTertiary, border: `1px solid ${theme.borderDefault}`,
    borderRadius: '10px', padding: '12px',
  },
  miniFormTitle: { fontSize: '11px', fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase' },
  miniInput: {
    width: '100%', padding: '8px 10px', background: theme.bgPrimary,
    border: `1px solid ${theme.borderDefault}`, borderRadius: '8px', color: theme.textPrimary,
    fontSize: '12px', outline: 'none', boxSizing: 'border-box',
  },
  miniBtn: {
    padding: '9px', background: theme.accentBlue, color: '#fff', border: 'none',
    borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
  },

  mapContainer: { position: 'relative', minHeight: '300px' },

  alertsPanel: { borderLeft: `1px solid ${theme.borderDefault}`, padding: '16px', overflowY: 'auto' },
  panelTitle: { fontSize: '14px', fontWeight: '700', color: theme.textPrimary, margin: '0 0 12px' },
  alertForm: { display: 'flex', flexDirection: 'column', gap: '10px' },
  alertLabel: { display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: theme.textSecondary },
  charCount: { fontSize: '11px', color: theme.textMuted },
  sendAlertBtn: {
    padding: '12px', background: theme.accentRed, color: '#fff', border: 'none',
    borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
  },
  alertHistory: { display: 'flex', flexDirection: 'column', gap: '8px' },
  alertHistoryItem: {
    background: theme.bgSecondary, border: `1px solid ${theme.borderDefault}`,
    borderRadius: '10px', padding: '10px',
  },
  alertHistoryMsg: { fontSize: '12px', color: theme.textPrimary, marginBottom: '4px' },
  alertHistoryMeta: { fontSize: '10px', color: theme.textMuted },
};

export default FleetDashboardPage;