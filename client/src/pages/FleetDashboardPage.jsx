import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { MapContainer, TileLayer } from 'react-leaflet';

import toast from 'react-hot-toast';
import useAuth from '../hooks/useAuth';
import useSocket from '../hooks/useSocket';
import {
    getFleetDashboardApi,
    getDriversApi,
    addVehicleApi,
    inviteDriverApi,
    sendAlertApi,
    uploadVehiclePhotoApi,
    getFleetStatusApi,
    assignDriverApi,
} from '../api/fleetApi';
import { planRouteApi, getTripByIdApi } from '../api/routeApi';
import { startMockTrackingApi, stopMockTrackingApi } from '../api/mockTrackingApi';
import { setVehicles, upsertVehicle } from '../store/fleetSlice';
import { theme } from '../styles/theme';
import NotificationCenter from '../components/fleet/NotificationCenter';
import ChatPanel from '../components/fleet/ChatPanel';
import FleetSidebar from '../components/fleet/FleetSidebar';
import FleetMapController from '../components/fleet/FleetMapController';
import SlideOutPanel from '../components/fleet/SlideOutPanel';
import PlanRouteModal from '../components/fleet/PlanRouteModal';
import { styles } from '../components/fleet/FleetDashboard.styles';

const StatCard = ({ label, value, icon, color }) => (
    <div style={styles.statCard}>
        <span style={styles.statIcon}>{icon}</span>
        <div>
            <div style={{ ...styles.statValue, color: color || theme.textPrimary }}>{value}</div>
            <div style={styles.statLabel}>{label}</div>
        </div>
    </div>
);

const FleetDashboardPage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user, logout } = useAuth();
    useSocket();

    const { vehicles, alerts, connected } = useSelector((state) => state.fleet);

    // Data states
    const [fleetWithTrips, setFleetWithTrips] = useState([]);
    const [loadingDashboard, setLoadingDashboard] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedVehicleIds, setSelectedVehicleIds] = useState([]);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('weather');
    const [sending, setSending] = useState(false);
    const [showAddForms, setShowAddForms] = useState(false);
    const [drivers, setDrivers] = useState([]);
    const [newVehicle, setNewVehicle] = useState({ plateNumber: '', vehicleType: 'truck', driverId: '' });
    const [newDriver, setNewDriver] = useState({ name: '', email: '' });
    const [mockRunning, setMockRunning] = useState(false);
    const [topPanel, setTopPanel] = useState(null); // 'notifications' | 'chat' | null
    // Invite link modal state
    const [inviteLink, setInviteLink] = useState(null);
    
    // Layer controls
    const [showRoutes, setShowRoutes] = useState(true);
    const [showLive, setShowLive] = useState(true);
    const [showWaypoints, setShowWaypoints] = useState(false);

    // Selection & Waypoints — FIXED: separate selection from panel open state
    const [selectedVehicleId, setSelectedVehicleId] = useState(null);
    const [selectedTripDetails, setSelectedTripDetails] = useState(null);
    const [showSlideOutPanel, setShowSlideOutPanel] = useState(false);
    const [selectedWaypointIndex, setSelectedWaypointIndex] = useState(null);

    // Plan Route Modal
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [planVehicleId, setPlanVehicleId] = useState(null);
    const [planVehiclePlate, setPlanVehiclePlate] = useState('');
    const [planOrigin, setPlanOrigin] = useState(null);
    const [planDestination, setPlanDestination] = useState(null);
    const [planDepartureTime, setPlanDepartureTime] = useState('');
    const [planning, setPlanning] = useState(false);
    const [planCargoType, setPlanCargoType] = useState('general');
    const [planVehicleType, setPlanVehicleType] = useState('car');
    const vehiclePhotoInputRef = useRef(null);
    const [photoTargetVehicleId, setPhotoTargetVehicleId] = useState(null);

    // Effects
    useEffect(() => {
        if (user && user.role !== 'company_admin') navigate('/home');
    }, [user, navigate]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoadingDashboard(true);
                const dashboardRes = await getFleetDashboardApi();
                setFleetWithTrips(dashboardRes.data.fleet);
                const statusRes = await getFleetStatusApi();
                dispatch(setVehicles(statusRes.data.vehicles));
            } catch (err) {
                toast.error('Could not load fleet data');
            } finally {
                setLoadingDashboard(false);
            }
        };
        if (user?.role === 'company_admin') {
            fetchData();
            fetchDrivers();
        }
    }, [dispatch, user]);

    const fetchDrivers = async () => {
        try {
            const response = await getDriversApi();
            setDrivers(response.data.drivers);
        } catch (err) {}
    };

    // Computed data
    const mergedFleetData = useMemo(() => {
        return vehicles.map((vehicle) => {
            const fleetItem = fleetWithTrips.find(f => f.vehicle.id === vehicle._id);
            return { ...vehicle, todayTrip: fleetItem?.todayTrip || null };
        });
    }, [vehicles, fleetWithTrips]);

    const vehiclesWithLocation = useMemo(
        () => mergedFleetData.filter((v) => v.currentLocation?.coordinates?.some((c) => c !== 0)),
        [mergedFleetData]
    );

    const stats = useMemo(() => {
        const total = vehicles.length;
        const active = vehicles.filter((v) => v.status === 'active').length;
        const idle = vehicles.filter((v) => v.status === 'idle').length;
        const offline = vehicles.filter((v) => v.status === 'offline').length;
        return { total, active, idle, offline };
    }, [vehicles]);

    const filteredVehicles = useMemo(() => {
        if (!search.trim()) return mergedFleetData;
        const q = search.toLowerCase();
        return mergedFleetData.filter((v) =>
            v.plateNumber?.toLowerCase().includes(q) ||
            v.driverId?.name?.toLowerCase().includes(q)
        );
    }, [mergedFleetData, search]);

    const mapCenter = useMemo(() => {
        if (vehiclesWithLocation.length > 0) {
            const loc = vehiclesWithLocation[0].currentLocation.coordinates;
            return [loc[1], loc[0]];
        }
        const firstWithTrip = mergedFleetData.find(item => item.todayTrip !== null);
        if (firstWithTrip && firstWithTrip.todayTrip.routePolyline?.length > 0) {
            const mid = Math.floor(firstWithTrip.todayTrip.routePolyline.length / 2);
            const point = firstWithTrip.todayTrip.routePolyline[mid];
            return [point[0], point[1]];
        }
        return [30.0444, 31.2357];
    }, [vehiclesWithLocation, mergedFleetData]);

    const filteredWaypoints = useMemo(() => {
        if (!selectedTripDetails) return [];
        const allWaypoints = selectedTripDetails.waypoints || [];
        if (allWaypoints.length === 0) return [];
        if (showWaypoints) return allWaypoints;
        const totalDistance = allWaypoints[allWaypoints.length - 1]?.distanceFromStart || 0;
        const targetCount = Math.max(2, Math.ceil(totalDistance / 30));
        const step = Math.max(1, Math.floor(allWaypoints.length / targetCount));
        const sampled = [];
        for (let i = 0; i < allWaypoints.length; i += step) sampled.push(allWaypoints[i]);
        const last = allWaypoints[allWaypoints.length - 1];
        if (sampled[sampled.length - 1] !== last) sampled.push(last);
        return sampled;
    }, [selectedTripDetails, showWaypoints]);

    // Handlers
    const toggleVehicleSelection = (id) => {
        setSelectedVehicleIds((prev) =>
            prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
        );
    };

    const handleToggleMockTracking = async () => {
        try {
            if (mockRunning) {
                await stopMockTrackingApi();
                setMockRunning(false);
                toast.success('demo tracking stopped');
            } else {
                await startMockTrackingApi();
                setMockRunning(true);
                toast.success('demo tracking started — vehicles now move on the map');
            }
        } catch (err) {
            toast.error(err.response?.data?.msg || 'could not toggle demo tracking');
        }
    };

    // FIXED: Clicking a card only SELECTS the vehicle — does NOT open the panel
    const handleVehicleSelect = async (vehicleId) => {
        if (selectedVehicleId === vehicleId) {
            setSelectedVehicleId(null);
            setSelectedTripDetails(null);
            setShowSlideOutPanel(false);
            setSelectedWaypointIndex(null);
            return;
        }

        const vehicle = mergedFleetData.find(v => v._id === vehicleId);
        if (!vehicle) return;

        setSelectedVehicleId(vehicleId);
        setShowSlideOutPanel(false);
        setSelectedWaypointIndex(null);

        if (vehicle.todayTrip) {
            try {
                const response = await getTripByIdApi(vehicle.todayTrip.id);
                setSelectedTripDetails(response.data.trip);
            } catch (err) {
                toast.error('Could not load trip details');
                setSelectedTripDetails(null);
            }
        } else {
            setSelectedTripDetails(null);
        }
    };

    // NEW: Only the "Details" button opens the slide-out panel
    const handleOpenPanel = (vehicleId) => {
        if (!vehicleId) return;
        if (selectedVehicleId !== vehicleId) {
            handleVehicleSelect(vehicleId);
        }
        setShowSlideOutPanel(true);
    };

    // FIXED: Closing the panel does NOT clear the selection
    const handleClosePanel = () => {
        setShowSlideOutPanel(false);
    };

    const handleWaypointClick = (index) => setSelectedWaypointIndex(index);

    // NEW: Assign driver to vehicle from the sidebar dropdown
    const handleAssignDriver = async (vehicleId, driverId) => {
        try {
            const response = await assignDriverApi(vehicleId, driverId || null);
            const updatedVehicle = response.data.vehicle;
            dispatch(upsertVehicle({ ...updatedVehicle, _id: vehicleId }));
            setFleetWithTrips(prev => prev.map(item =>
                item.vehicle.id === vehicleId
                    ? { ...item, vehicle: { ...item.vehicle, driverId: updatedVehicle.driverId } }
                    : item
            ));
            fetchDrivers();
            toast.success(driverId ? 'Driver assigned successfully' : 'Driver unassigned');
        } catch (err) {
            toast.error(err.response?.data?.msg || 'could not assign driver');
        }
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
            // setSelectedVehicleIds([]);
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
            if (newVehicle.driverId) payload.driverId = newVehicle.driverId;
            const response = await addVehicleApi(payload);
            dispatch(setVehicles([...vehicles, response.data.vehicle]));
            toast.success('vehicle added');
            setNewVehicle({ plateNumber: '', vehicleType: 'truck', driverId: '' });
        } catch (err) {
            toast.error(err.response?.data?.msg || 'could not add vehicle');
        }
    };

    // NEW: Invite driver with modal
    const handleInviteDriver = async (e) => {
        e.preventDefault();
        if (!newDriver.name.trim() || !newDriver.email.trim()) return toast.error('name and email are required');
        try {
            const response = await inviteDriverApi(newDriver);
            setInviteLink({ email: newDriver.email, link: response.data.inviteLink });
            toast.success(`invite created for ${newDriver.email}`);
            setNewDriver({ name: '', email: '' });
            fetchDrivers();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'could not invite driver');
        }
    };

    // NEW: Copy invite link to clipboard
    const copyInviteLink = async () => {
        try {
            await navigator.clipboard.writeText(inviteLink.link);
            toast.success('invite link copied');
        } catch (err) {
            const ta = document.createElement('textarea');
            ta.value = inviteLink.link;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            toast.success('invite link copied');
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

    const openPlanModal = (vehicleId, plateNumber) => {
        setPlanVehicleId(vehicleId);
        setPlanVehiclePlate(plateNumber);
        setPlanOrigin(null);
        setPlanDestination(null);
        const now = new Date();
        now.setHours(now.getHours() + 2);
        setPlanDepartureTime(now.toISOString().slice(0, 16));
        const veh = mergedFleetData.find(v => v._id === vehicleId);
        setPlanVehicleType(veh?.vehicleType || 'car');
        setPlanCargoType('general');
        setShowPlanModal(true);
    };

    const closePlanModal = () => {
        setShowPlanModal(false);
        setPlanVehicleId(null);
        setPlanVehiclePlate('');
        setPlanOrigin(null);
        setPlanDestination(null);
        setPlanning(false);
    };

    const handlePlanRoute = async () => {
        if (!planOrigin || !planDestination) {
            toast.error('Please select both origin and destination');
            return;
        }
        if (!planDepartureTime) {
            toast.error('Please select a departure time');
            return;
        }
        setPlanning(true);
        try {
                const payload = {
                origin: planOrigin,
                destination: planDestination,
                vehicleType: planVehicleType,
                cargoType: planCargoType,
                departureTime: new Date(planDepartureTime).toISOString(),
                vehicleId: planVehicleId,
            };
            await planRouteApi(payload);
            toast.success(`Route planned for ${planVehiclePlate}!`);
            closePlanModal();
            const dashboardRes = await getFleetDashboardApi();
            setFleetWithTrips(dashboardRes.data.fleet);
            const statusRes = await getFleetStatusApi();
            dispatch(setVehicles(statusRes.data.vehicles));
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Failed to plan route');
        } finally {
            setPlanning(false);
        }
    };

    // Panel shows based on showSlideOutPanel, not on selection
    const showPanel = showSlideOutPanel && selectedTripDetails;

    const panelVehicle = selectedVehicleId
        ? mergedFleetData.find(v => v._id === selectedVehicleId)
        : null;

    return (
        <div style={styles.page}>
            <header style={styles.header}>
                <div style={styles.logo}>
                    <span style={styles.logoIcon}>◈</span>
                    <span style={styles.logoText}>S-WINDs</span>
                    <span style={styles.logoSubtext}>Fleet Management</span>
                </div>

                <nav style={styles.navLinks}>
                    <button style={{ ...styles.navBtn, ...styles.navBtnActive }} onClick={() => navigate('/fleet')} title="Fleet Dashboard">Dashboard</button>
                    <button style={styles.navBtn} onClick={() => navigate('/history')} title="Trip History">History</button>
                    <button style={styles.navBtn} onClick={() => navigate('/plan')} title="Plan a Trip">Plan Trip</button>
                    <button style={styles.navBtn} onClick={() => navigate('/analytics')} title="Analytics">Analytics</button>
                </nav>

                <div style={styles.headerRight}>
                    <NotificationCenter
                        open={topPanel === 'notifications'}
                        onOpenChange={(v) => setTopPanel(v ? 'notifications' : null)}
                    />
                    <ChatPanel
                        open={topPanel === 'chat'}
                        onOpenChange={(v) => setTopPanel(v ? 'chat' : null)}
                    />
                    <span style={styles.userName}>{user?.name} · Admin</span>
                    <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
                </div>
            </header>

            <div style={styles.statsBar}>
                <StatCard label="Total Vehicles" value={stats.total} icon="🚚" />
                <StatCard label="On the Move" value={stats.active} icon="🟢" color={theme.accentGreen} />
                <StatCard label="Idle" value={stats.idle} icon="🟡" color={theme.accentOrange} />
                <StatCard label="Offline" value={stats.offline} icon="🔴" color={theme.accentRed} />
                <button
                    style={{
                        padding: '10px 14px',
                        background: 'rgba(245,158,11,0.15)',
                        border: `1px solid ${theme.accentOrange}`,
                        borderRadius: '10px',
                        color: theme.accentOrange,
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                    }}
                    onClick={() => navigate('/briefing')}
                    title="Automatic morning summary"
                >
                    Daily Briefing
                </button>
                <button
                    style={{
                        padding: '10px 14px',
                        background: mockRunning ? 'rgba(239,68,68,0.15)' : 'rgba(37,99,235,0.15)',
                        border: `1px solid ${mockRunning ? theme.accentRed : theme.accentBlue}`,
                        borderRadius: '10px',
                        color: mockRunning ? theme.accentRed : theme.accentBlue,
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                    }}
                    onClick={handleToggleMockTracking}
                    title="Demo Mode: simulate live vehicle movement"
                >
                    {mockRunning ? 'Stop Demo Tracking' : 'Start Demo Tracking'}
                </button>
                <div style={styles.connectionDot}>
                    <span style={{ ...styles.dot, background: connected ? theme.accentGreen : theme.accentRed }} />
                    {connected ? 'Real-time Tracking' : 'Connecting…'}
                </div>
            </div>

            <div
                style={{
                    ...styles.body,
                    gridTemplateColumns: showPanel
                        ? '280px 1fr 340px 300px'
                        : '280px 1fr 300px',
                }}
            >
                <FleetSidebar
                    search={search}
                    setSearch={setSearch}
                    filteredVehicles={filteredVehicles}
                    selectedVehicleIds={selectedVehicleIds}
                    toggleVehicleSelection={toggleVehicleSelection}
                    selectedVehicleId={selectedVehicleId}
                    handleVehicleSelect={handleVehicleSelect}
                    handleOpenPanel={handleOpenPanel}
                    handleAssignDriver={handleAssignDriver}
                    handleVehiclePhotoClick={handleVehiclePhotoClick}
                    openPlanModal={openPlanModal}
                    showAddForms={showAddForms}
                    setShowAddForms={setShowAddForms}
                    newVehicle={newVehicle}
                    setNewVehicle={setNewVehicle}
                    handleAddVehicle={handleAddVehicle}
                    drivers={drivers}
                    newDriver={newDriver}
                    setNewDriver={setNewDriver}
                    handleInviteDriver={handleInviteDriver}
                    vehiclePhotoInputRef={vehiclePhotoInputRef}
                    handleVehiclePhotoChange={handleVehiclePhotoChange}
                />

                {showPanel && (
                    <SlideOutPanel
                        trip={{ ...selectedTripDetails, waypoints: filteredWaypoints }}
                        vehicle={panelVehicle}
                        onClose={handleClosePanel}
                        selectedWaypointIndex={selectedWaypointIndex}
                        onWaypointSelect={handleWaypointClick}
                    />
                )}

                <div style={styles.mapContainer}>
                    {loadingDashboard ? (
                        <div style={styles.placeholder}>Loading fleet routes & locations...</div>
                    ) : (
                        <MapContainer
                            key="fleet-map"
                            center={mapCenter}
                            zoom={7}
                            style={{ height: '100%', width: '100%', background: '#0a0e14' }}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />

                            <div style={styles.layersControl}>
                                <button
                                    onClick={() => setShowRoutes(!showRoutes)}
                                    style={{
                                        ...styles.layerButton,
                                        background: showRoutes ? 'rgba(16,185,129,0.9)' : 'rgba(30,41,59,0.8)',
                                        borderColor: showRoutes ? '#10B981' : '#475569',
                                    }}
                                >
                                    {showRoutes ? 'Hide Routes' : 'Show Routes'}
                                </button>
                                <button
                                    onClick={() => setShowLive(!showLive)}
                                    style={{
                                        ...styles.layerButton,
                                        background: showLive ? 'rgba(37,99,235,0.9)' : 'rgba(30,41,59,0.8)',
                                        borderColor: showLive ? '#3B82F6' : '#475569',
                                    }}
                                >
                                    {showLive ? 'Hide Live' : 'Show Live'}
                                </button>
                                <button
                                    onClick={() => setShowWaypoints(!showWaypoints)}
                                    style={{
                                        ...styles.layerButton,
                                        background: showWaypoints ? 'rgba(245,158,11,0.9)' : 'rgba(30,41,59,0.8)',
                                        borderColor: showWaypoints ? '#F59E0B' : '#475569',
                                    }}
                                    disabled={!selectedVehicleId}
                                >
                                    {showWaypoints ? 'Hide Details' : 'Show Details'}
                                    {selectedVehicleId ? '' : ' (select vehicle)'}
                                </button>
                            </div>

                            <FleetMapController
                                mergedFleetData={mergedFleetData}
                                vehiclesWithLocation={vehiclesWithLocation}
                                showRoutes={showRoutes}
                                showLive={showLive}
                                selectedTripDetails={selectedTripDetails}
                                showWaypoints={showWaypoints}
                                selectedVehicleId={selectedVehicleId}
                                selectedWaypointIndex={selectedWaypointIndex}
                                onWaypointClick={handleWaypointClick}
                            />
                        </MapContainer>
                    )}
                </div>

                <div style={styles.alertsPanel}>
                    <h3 style={styles.panelTitle}>Dispatch Alert</h3>
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
                            {sending ? 'Sending…' : 'Send Now'}
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

            <PlanRouteModal
                show={showPlanModal}
                onClose={closePlanModal}
                vehiclePlate={planVehiclePlate}
                cargoType={planCargoType}
                setCargoType={setPlanCargoType}
                origin={planOrigin}
                setOrigin={setPlanOrigin}
                destination={planDestination}
                setDestination={setPlanDestination}
                departureTime={planDepartureTime}
                setDepartureTime={setPlanDepartureTime}
                onPlan={handlePlanRoute}
                planning={planning}
            />

            {/* Invite Link Modal */}
            {inviteLink && (
                <div style={styles.modalOverlay} onClick={() => setInviteLink(null)}>
                    <div style={{ ...styles.modal, maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h3 style={styles.modalTitle}>Driver invite created</h3>
                            <button style={styles.modalClose} onClick={() => setInviteLink(null)}>✕</button>
                        </div>
                        <div style={styles.modalBody}>
                            <p style={{ fontSize: '13px', color: theme.textSecondary, lineHeight: 1.6, margin: '0 0 12px' }}>
                                Email sending is not connected yet — share this link with {inviteLink.email} directly. The link expires in 3 days.
                            </p>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    readOnly
                                    value={inviteLink.link}
                                    style={{ ...styles.miniInput, flex: 1 }}
                                    onFocus={(e) => e.target.select()}
                                />
                                <button style={{ ...styles.miniBtn, whiteSpace: 'nowrap' }} onClick={copyInviteLink}>
                                    Copy link
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FleetDashboardPage;