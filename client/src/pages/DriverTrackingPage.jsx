import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { Coffee, Route, MessageSquare, Send, Navigation, MapPin, X } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import useSocket from '../hooks/useSocket';
import { getMyVehicleApi, getMyTripApi } from '../api/fleetApi';
import { createBreakRequestApi, createTripRequestApi, createRouteRequestApi, getInboxApi } from '../api/requestApi';
import { sendChatApi, getMyThreadApi } from '../api/chatApi';
import { getFleetStatusColor, getFleetStatusLabel } from '../utils/fleetColors';
import { getRiskPathColor } from '../utils/riskColors';
import MapView from '../components/MapView';
import { theme } from '../styles/theme';

const DriverTrackingPage = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { sendLocation } = useSocket();
    const { connected, alerts } = useSelector((state) => state.fleet);

    const [vehicle, setVehicle] = useState(null);
    const [trip, setTrip] = useState(null);
    const [loading, setLoading] = useState(true);

    const [sharing, setSharing] = useState(false);
    const [lastPosition, setLastPosition] = useState(null);
    const watchIdRef = useRef(null);

    const [notifications, setNotifications] = useState([]);
    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [showChat, setShowChat] = useState(false);
    const [sendingChat, setSendingChat] = useState(false);
    const [busy, setBusy] = useState(null); // 'break' | 'trip' | 'alt'

    const chatEndRef = useRef(null);

    const myAlerts = alerts.filter((a) => a.targetDriverIds?.includes(user?.id));

    useEffect(() => {
        if (user && user.role !== 'company_driver') navigate('/home');
    }, [user, navigate]);

    // Load vehicle + today's trip
    useEffect(() => {
        const load = async () => {
            try {
                const vRes = await getMyVehicleApi();
                setVehicle(vRes.data.vehicle || null);
                if (vRes.data.vehicle) {
                    const tRes = await getMyTripApi();
                    setTrip(tRes.data.trip || null);
                }
            } catch (err) {
                // silent — page still renders
            } finally {
                setLoading(false);
            }
        };
        if (user?.role === 'company_driver') load();
    }, [user]);

    // Poll inbox + chat thread (socket push can replace this later)
    useEffect(() => {
        const load = async () => {
            try {
                const [inboxRes, threadRes] = await Promise.all([
                    getInboxApi({ limit: 8 }),
                    getMyThreadApi(),
                ]);
                setNotifications(inboxRes.data.notifications || []);
                setMessages(threadRes.data.messages || []);
            } catch (err) { /* silent */ }
        };
        if (user?.role === 'company_driver') {
            load();
            const t = setInterval(load, 8000);
            return () => clearInterval(t);
        }
    }, [user]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, showChat]);

    // 30km sample for the map display
    const sampledWaypoints = useMemo(() => {
        const all = trip?.waypoints || [];
        if (all.length === 0) return [];
        const total = all[all.length - 1]?.distanceFromStart || 0;
        const target = Math.max(2, Math.ceil(total / 30));
        const step = Math.max(1, Math.floor(all.length / target));
        const out = [];
        for (let i = 0; i < all.length; i += step) out.push(all[i]);
        if (out[out.length - 1] !== all[all.length - 1]) out.push(all[all.length - 1]);
        return out;
    }, [trip]);

    const hasHazard = useMemo(
        () => (trip?.waypoints || []).some((w) => w.weather?.riskLevel === 'high'),
        [trip]
    );

    const startSharing = () => {
        if (!navigator.geolocation) return toast.error('geolocation is not supported on this device');
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

    useEffect(() => () => stopSharing(), []);

    const handleBreak = async () => {
        setBusy('break');
        try {
            await createBreakRequestApi({ durationMin: 15 });
            toast.success('break request sent — auto-approves in 7 minutes if no response');
        } catch (err) {
            toast.error(err.response?.data?.msg || 'could not send break request');
        } finally {
            setBusy(null);
        }
    };

    const handleTripRequest = async () => {
        setBusy('trip');
        try {
            await createTripRequestApi({});
            toast.success('trip request sent to your manager');
        } catch (err) {
            toast.error(err.response?.data?.msg || 'could not send trip request');
        } finally {
            setBusy(null);
        }
    };

    const handleAltRequest = async () => {
        if (!trip) return;
        setBusy('alt');
        try {
            await createRouteRequestApi({ tripId: trip._id, reason: 'Hazard reported on the current route' });
            toast.success('alternate route request sent — waiting for manager decision');
        } catch (err) {
            toast.error(err.response?.data?.msg || 'could not send route request');
        } finally {
            setBusy(null);
        }
    };

    const handleSendChat = async (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;
        setSendingChat(true);
        try {
            const res = await sendChatApi({ message: chatInput.trim() });
            setMessages((prev) => [...prev, res.data.message]);
            setChatInput('');
        } catch (err) {
            toast.error('could not send message');
        } finally {
            setSendingChat(false);
        }
    };

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
                    <span style={styles.logoSubtext}>Driver</span>
                </div>
                <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
            </header>

            <div style={styles.content}>
                <div style={styles.greetRow}>
                    <h1 style={styles.title}>Hey {user?.name}</h1>
                    <span style={styles.connectionRow}>
                        <span style={{ ...styles.dot, background: connected ? theme.accentGreen : theme.accentRed }} />
                        {connected ? 'Connected' : 'Connecting…'}
                    </span>
                </div>

                {/* Dispatch alerts banner */}
                {myAlerts.length > 0 && (
                    <div style={styles.alertBanner}>
                        <MapPin size={18} color={theme.accentRed} />
                        <div>
                            <div style={styles.alertBannerType}>{myAlerts[0].alertType}</div>
                            <div style={styles.alertBannerMsg}>{myAlerts[0].message}</div>
                        </div>
                    </div>
                )}

                {/* Vehicle card */}
                {vehicle ? (
                    <div style={styles.vehicleCard}>
                        <div style={styles.vehicleCardHeader}>
                            <span style={styles.vehiclePlate}>{vehicle.plateNumber}</span>
                            <span style={{ ...styles.statusBadge, color: getFleetStatusColor(vehicle.status) }}>
                                {getFleetStatusLabel(vehicle.status)}
                            </span>
                        </div>
                        <span style={styles.vehicleType}>{vehicle.vehicleType}</span>
                    </div>
                ) : (
                    !loading && (
                        <div style={styles.noVehicleCard}>
                            <p style={styles.noVehicleText}>No vehicle assigned to you yet — contact your fleet admin.</p>
                            <button style={styles.actionBtn} onClick={handleTripRequest} disabled={busy === 'trip'}>
                                <Route size={16} /> {busy === 'trip' ? 'Sending…' : 'Request a Trip'}
                            </button>
                        </div>
                    )
                )}

                {/* Trip map */}
                {trip && (
                    <>
                        <div style={styles.tripSummary}>
                            <div style={styles.tripRouteLine}>
                                <span>{trip.origin?.address || 'Start'}</span>
                                <Navigation size={14} color={theme.textMuted} />
                                <span>{trip.destination?.address || 'End'}</span>
                            </div>
                            <div style={styles.tripMeta}>
                                <span>{trip.totalDistanceKm?.toFixed(1)} km</span>
                                <span>{Math.round(trip.totalDurationMin)} min</span>
                                <span style={{ color: getRiskPathColor(trip.overallRiskLevel), fontWeight: 700 }}>
                                    {trip.overallRiskLevel?.toUpperCase()}
                                </span>
                            </div>
                        </div>

                        <MapView
                            routePolyline={trip.routePolyline}
                            waypoints={sampledWaypoints}
                            detailedWaypoints={trip.waypoints}
                            origin={trip.origin}
                            destination={trip.destination}
                            vehicleType={trip.vehicleType || 'car'}
                        />

                        {hasHazard && (
                            <div style={styles.hazardNote}>
                                A high-risk weather point was detected on your route. You can request an alternate path.
                            </div>
                        )}
                    </>
                )}
                    {trip?.cargoAlerts?.length > 0 && (
                    <div style={styles.cargoBox}>
                        <div style={styles.cargoTitle}>Cargo advisories for this trip</div>
                        {trip.cargoAlerts.map((a, i) => (
                            <div key={i} style={styles.cargoItem}>{a.message}</div>
                        ))}
                    </div>
                    )}
                {vehicle && !trip && !loading && (
                    <div style={styles.noTripCard}>
                        <p style={styles.noVehicleText}>No trip assigned for today.</p>
                        <button style={styles.actionBtn} onClick={handleTripRequest} disabled={busy === 'trip'}>
                            <Route size={16} /> {busy === 'trip' ? 'Sending…' : 'Request a Trip'}
                        </button>
                    </div>
                )}

                {/* Actions */}
                {vehicle && (
                    <div style={styles.actionsRow}>
                        <button
                            style={sharing ? styles.stopBtn : styles.startBtn}
                            onClick={sharing ? stopSharing : startSharing}
                        >
                            {sharing ? 'Stop Sharing' : 'Start Sharing Location'}
                        </button>
                        <button style={styles.breakBtn} onClick={handleBreak} disabled={busy === 'break'}>
                            <Coffee size={16} /> {busy === 'break' ? 'Sending…' : 'Request Break (15 min)'}
                        </button>
                        {trip && hasHazard && (
                            <button style={styles.altBtn} onClick={handleAltRequest} disabled={busy === 'alt'}>
                                <Route size={16} /> {busy === 'alt' ? 'Sending…' : 'Request Alternate Route'}
                            </button>
                        )}
                    </div>
                )}

                {lastPosition && (
                    <p style={styles.coords}>Last sent: {lastPosition.lat.toFixed(5)}, {lastPosition.lng.toFixed(5)}</p>
                )}

                {/* Decisions / notifications */}
                {notifications.length > 0 && (
                    <div style={styles.section}>
                        <h3 style={styles.sectionTitle}>Updates from dispatch</h3>
                        {notifications.map((n) => (
                            <div key={n._id} style={styles.notifItem}>
                                <div style={styles.notifTitle}>{n.title}</div>
                                <div style={styles.notifMsg}>{n.message}</div>
                                <div style={styles.notifMeta}>
                                    {new Date(n.createdAt).toLocaleTimeString()} ·{' '}
                                    <span style={{ color: n.status === 'rejected' ? theme.accentRed : n.status === 'approved' || n.status === 'auto_approved' ? theme.accentGreen : theme.accentOrange }}>
                                        {n.status.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Chat */}
                <div style={styles.section}>
                    <button style={styles.chatToggle} onClick={() => setShowChat((s) => !s)}>
                        {showChat ? <X size={16} /> : <MessageSquare size={16} />}
                        {showChat ? 'Close Messages' : 'Messages with Dispatch'}
                    </button>

                    {showChat && (
                        <div style={styles.chatBox}>
                            <p style={styles.safetyNote}>For safety: reply only while stopped.</p>
                            <div style={styles.chatScroll}>
                                {messages.length === 0 && (
                                    <p style={styles.noVehicleText}>No messages yet.</p>
                                )}
                                {messages.map((m) => {
                                    const mine = m.senderId === user?.id;
                                    return (
                                        <div key={m._id} style={{ ...styles.bubbleWrap, justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                                            <div style={{ ...styles.bubble, background: mine ? 'rgba(37,99,235,0.2)' : 'rgba(255,255,255,0.06)' }}>
                                                {m.message}
                                                {m.tripId && <span style={styles.tripTag}>trip-linked</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={chatEndRef} />
                            </div>
                            <form onSubmit={handleSendChat} style={styles.chatForm}>
                                <input
                                    style={styles.chatInput}
                                    placeholder="Type a message…"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    maxLength={500}
                                />
                                <button style={styles.chatSend} type="submit" disabled={sendingChat}>
                                    <Send size={16} />
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const styles = {
    page: { minHeight: '100vh', background: theme.bgPrimary, fontFamily: 'system-ui, sans-serif', position: 'relative' },
    bgGlow: { position: 'absolute', top: '-10%', left: '30%', width: '50%', height: '60%', background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)', pointerEvents: 'none' },
    header: { position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: `1px solid ${theme.borderDefault}` },
    logo: { display: 'flex', alignItems: 'center', gap: '10px' },
    logoIcon: { fontSize: '20px', color: theme.accentBlue },
    logoText: { fontSize: '18px', fontWeight: '700', color: theme.textPrimary },
    logoSubtext: { fontSize: '12px', color: theme.textMuted, marginLeft: '4px' },
    logoutBtn: { padding: '8px 14px', background: 'transparent', border: `1px solid ${theme.borderDefault}`, borderRadius: '8px', color: theme.textSecondary, fontSize: '13px', cursor: 'pointer' },
    content: { position: 'relative', zIndex: 1, maxWidth: '760px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' },
    greetRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: '24px', fontWeight: '800', color: theme.textPrimary, margin: 0 },
    connectionRow: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: theme.textSecondary },
    dot: { width: '8px', height: '8px', borderRadius: '50%' },
    alertBanner: { display: 'flex', gap: '10px', textAlign: 'left', background: 'rgba(239,68,68,0.1)', border: `1px solid ${theme.accentRed}`, borderRadius: '12px', padding: '14px' },
    alertBannerType: { fontSize: '11px', fontWeight: '700', color: theme.accentRed, textTransform: 'uppercase' },
    alertBannerMsg: { fontSize: '13px', color: theme.textPrimary, marginTop: '2px' },
    vehicleCard: { background: theme.bgSecondary, border: `1px solid ${theme.borderDefault}`, borderRadius: '14px', padding: '16px' },
    vehicleCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    vehiclePlate: { fontSize: '16px', fontWeight: '700', color: theme.textPrimary },
    statusBadge: { fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' },
    vehicleType: { fontSize: '12px', color: theme.textMuted, textTransform: 'capitalize' },
    noVehicleCard: { background: theme.bgSecondary, border: `1px dashed ${theme.borderDefault}`, borderRadius: '14px', padding: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' },
    noTripCard: { background: theme.bgSecondary, border: `1px dashed ${theme.borderDefault}`, borderRadius: '14px', padding: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' },
    noVehicleText: { fontSize: '13px', color: theme.textMuted, margin: 0 },
    tripSummary: { background: theme.bgSecondary, border: `1px solid ${theme.borderDefault}`, borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' },
    tripRouteLine: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: theme.textPrimary, flexWrap: 'wrap' },
    tripMeta: { display: 'flex', gap: '16px', fontSize: '12px', color: theme.textSecondary },
    hazardNote: { fontSize: '13px', color: theme.accentOrange, background: 'rgba(245,158,11,0.1)', border: `1px solid ${theme.accentOrange}`, borderRadius: '10px', padding: '10px 14px' },
    actionsRow: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
    startBtn: { flex: 1, minWidth: '200px', padding: '14px', background: theme.accentGreen, color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
    stopBtn: { flex: 1, minWidth: '200px', padding: '14px', background: theme.accentRed, color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
    breakBtn: { flex: 1, minWidth: '180px', padding: '14px', background: 'transparent', border: `1px solid ${theme.accentBlue}`, color: theme.accentBlue, borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
    altBtn: { flex: 1, minWidth: '180px', padding: '14px', background: 'transparent', border: `1px solid ${theme.accentOrange}`, color: theme.accentOrange, borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
    actionBtn: { padding: '12px 20px', background: theme.accentBlue, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
    coords: { fontSize: '11px', color: theme.textMuted, textAlign: 'center', margin: 0 },
    section: { display: 'flex', flexDirection: 'column', gap: '10px' },
    sectionTitle: { fontSize: '15px', fontWeight: '700', color: theme.textPrimary, margin: 0 },
    notifItem: { background: theme.bgSecondary, border: `1px solid ${theme.borderDefault}`, borderRadius: '10px', padding: '12px' },
    notifTitle: { fontSize: '13px', fontWeight: '700', color: theme.textPrimary },
    notifMsg: { fontSize: '12px', color: theme.textSecondary, marginTop: '4px', lineHeight: 1.5 },
    notifMeta: { fontSize: '11px', color: theme.textMuted, marginTop: '6px', textTransform: 'capitalize' },
    chatToggle: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: theme.bgSecondary, border: `1px solid ${theme.borderDefault}`, borderRadius: '10px', color: theme.textPrimary, fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
    chatBox: { background: theme.bgSecondary, border: `1px solid ${theme.borderDefault}`, borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' },
    safetyNote: { fontSize: '11px', color: theme.accentOrange, margin: 0 },
    chatScroll: { maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' },
    bubbleWrap: { display: 'flex' },
    bubble: { maxWidth: '80%', padding: '10px 12px', borderRadius: '12px', fontSize: '13px', color: theme.textPrimary, lineHeight: 1.5 },
    tripTag: { display: 'block', fontSize: '10px', color: theme.accentBlue, marginTop: '4px' },
    chatForm: { display: 'flex', gap: '8px' },
    chatInput: { flex: 1, padding: '10px 12px', background: theme.bgTertiary, border: `1px solid ${theme.borderDefault}`, borderRadius: '10px', color: theme.textPrimary, fontSize: '13px', outline: 'none' },
    chatSend: { padding: '10px 14px', background: theme.accentBlue, color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center' },
    cargoBox: { background: 'rgba(245,158,11,0.08)', border: `1px solid ${theme.accentOrange}`, borderRadius: '10px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' },
    cargoTitle: { fontSize: '13px', fontWeight: '700', color: theme.accentOrange },
    cargoItem: { fontSize: '12px', color: theme.textPrimary, lineHeight: 1.6 },
};

export default DriverTrackingPage;