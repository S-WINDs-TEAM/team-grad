import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
    LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import useAuth from '../hooks/useAuth';
import { getHistoryApi } from '../api/routeApi';
import { getFleetStatusApi } from '../api/fleetApi';
import { theme } from '../styles/theme';

// map risk levels to numbers so we can average them per vehicle
const RISK_SCORE = { low: 1, medium: 2, high: 3 };

const AnalyticsPage = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const isAdmin = user?.role === 'company_admin';

    const [trips, setTrips] = useState([]);
    const [vehiclesCount, setVehiclesCount] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch the latest 50 trips (+ fleet size for admins)
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const historyRes = await getHistoryApi(1, 50);
                setTrips(historyRes.data.trips || []);
                if (isAdmin) {
                    const fleetRes = await getFleetStatusApi();
                    setVehiclesCount(fleetRes.data.vehicles?.length || 0);
                }
            } catch (err) {
                toast.error('Could not load analytics data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [isAdmin]);

    // ---- Chart 1: risk distribution (Bar) ----
    const riskDistribution = useMemo(() => {
        const counts = { low: 0, medium: 0, high: 0 };
        trips.forEach((t) => {
            if (counts[t.overallRiskLevel] !== undefined) counts[t.overallRiskLevel] += 1;
        });
        return [
            { name: 'Low', trips: counts.low, fill: theme.risk.low },
            { name: 'Medium', trips: counts.medium, fill: theme.risk.medium },
            { name: 'High', trips: counts.high, fill: theme.risk.high },
        ];
    }, [trips]);

    // ---- Chart 2: trips per day over the last 7 days (Line) ----
    const tripsPerDay = useMemo(() => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            d.setDate(d.getDate() - i);
            days.push({
                key: d.toDateString(),
                name: d.toLocaleDateString('en-US', { weekday: 'short' }),
                trips: 0,
            });
        }
        trips.forEach((t) => {
            const key = new Date(t.createdAt || t.departureTime).toDateString();
            const day = days.find((x) => x.key === key);
            if (day) day.trips += 1;
        });
        return days;
    }, [trips]);

    // ---- Chart 3: trips per vehicle, slice color = average risk (Pie) ----
    const vehicleRisk = useMemo(() => {
        const groups = {};
        trips.forEach((t) => {
            const label = t.vehicleId?.plateNumber
                || (t.vehicleType ? t.vehicleType.toUpperCase() : 'Personal');
            if (!groups[label]) groups[label] = { name: label, trips: 0, score: 0 };
            groups[label].trips += 1;
            groups[label].score += RISK_SCORE[t.overallRiskLevel] || 1;
        });
        return Object.values(groups).map((g) => {
            const avg = g.score / g.trips;
            return {
                name: g.name,
                value: g.trips,
                avgRisk: avg >= 2.2 ? 'high' : avg >= 1.4 ? 'medium' : 'low',
                fill: avg >= 2.2 ? theme.risk.high : avg >= 1.4 ? theme.risk.medium : theme.risk.low,
            };
        });
    }, [trips]);

    // ---- Top stat cards ----
    const stats = useMemo(() => {
        const total = trips.length;
        const high = trips.filter((t) => t.overallRiskLevel === 'high').length;
        const safe = total - high;
        const totalKm = trips.reduce((sum, t) => sum + (t.totalDistanceKm || 0), 0);
        return [
            { label: 'Total Trips', value: total, icon: '🛣️', color: theme.accentBlue },
            { label: 'High-Risk Trips', value: high, icon: '🔴', color: theme.accentRed },
            { label: 'Safe Trip Rate', value: total ? `${Math.round((safe / total) * 100)}%` : '—', icon: '🟢', color: theme.accentGreen },
            isAdmin
                ? { label: 'Fleet Vehicles', value: vehiclesCount ?? '—', icon: '🚚', color: theme.accentOrange }
                : { label: 'Total Distance', value: `${Math.round(totalKm)} km`, icon: '📏', color: theme.accentOrange },
        ];
    }, [trips, isAdmin, vehiclesCount]);

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    const handleBack = () => navigate(isAdmin ? '/fleet' : '/home');

    const tooltipStyle = {
        background: theme.bgSecondary,
        border: `1px solid ${theme.borderDefault}`,
        borderRadius: '8px',
        color: theme.textPrimary,
        fontSize: '12px',
    };

    return (
        <div style={styles.page}>
            {/* Header */}
            <header style={styles.header}>
                <div style={styles.logo}>
                    <span style={styles.logoIcon}>◈</span>
                    <span style={styles.logoText}>S-WINDs</span>
                    <span style={styles.logoSubtext}>Analytics</span>
                </div>
                <div style={styles.headerRight}>
                    <button style={styles.backBtn} onClick={handleBack}>← Back</button>
                    <span style={styles.userName}>{user?.name}</span>
                    <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
                </div>
            </header>

            <div style={styles.content}>
                <h1 style={styles.title}>📊 Analytics</h1>
                <p style={styles.subtitle}>
                    {isAdmin
                        ? 'Risk patterns across your company trips (latest 50 trips).'
                        : 'Risk patterns across your trips (latest 50 trips).'}
                </p>

                {loading ? (
                    <div style={styles.loading}>Crunching the numbers...</div>
                ) : trips.length === 0 ? (
                    <div style={styles.empty}>
                        <span style={styles.emptyIcon}>📭</span>
                        <p>No trips yet — plan a trip to see analytics.</p>
                        <button style={styles.planBtn} onClick={() => navigate('/plan')}>
                            Plan a trip →
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Stat cards */}
                        <div style={styles.statsRow}>
                            {stats.map((s) => (
                                <div key={s.label} style={styles.statCard}>
                                    <span style={styles.statIcon}>{s.icon}</span>
                                    <div>
                                        <div style={{ ...styles.statValue, color: s.color }}>{s.value}</div>
                                        <div style={styles.statLabel}>{s.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={styles.chartsGrid}>
                            {/* Bar: risk distribution */}
                            <div style={styles.chartCard}>
                                <h3 style={styles.chartTitle}>Risk Distribution</h3>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={riskDistribution}>
                                        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                                        <XAxis dataKey="name" stroke={theme.textMuted} fontSize={12} />
                                        <YAxis allowDecimals={false} stroke={theme.textMuted} fontSize={12} />
                                        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                                        <Bar dataKey="trips" radius={[6, 6, 0, 0]}>
                                            {riskDistribution.map((entry, i) => (
                                                <Cell key={i} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Line: trips per day */}
                            <div style={styles.chartCard}>
                                <h3 style={styles.chartTitle}>Trips — Last 7 Days</h3>
                                <ResponsiveContainer width="100%" height={220}>
                                    <LineChart data={tripsPerDay}>
                                        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                                        <XAxis dataKey="name" stroke={theme.textMuted} fontSize={12} />
                                        <YAxis allowDecimals={false} stroke={theme.textMuted} fontSize={12} />
                                        <Tooltip contentStyle={tooltipStyle} />
                                        <Line
                                            type="monotone"
                                            dataKey="trips"
                                            stroke={theme.accentBlue}
                                            strokeWidth={2}
                                            dot={{ r: 3, fill: theme.accentBlue }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Pie: trips per vehicle, color = avg risk */}
                            <div style={styles.chartCard}>
                                <h3 style={styles.chartTitle}>
                                    {isAdmin ? 'Trips per Vehicle (color = avg risk)' : 'Trips per Vehicle Type (color = avg risk)'}
                                </h3>
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie
                                            data={vehicleRisk}
                                            dataKey="value"
                                            nameKey="name"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={3}
                                        >
                                            {vehicleRisk.map((entry, i) => (
                                                <Cell key={i} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={tooltipStyle} />
                                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

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
    backBtn: {
        padding: '6px 14px', background: 'transparent', border: `1px solid ${theme.borderDefault}`,
        borderRadius: '8px', color: theme.textSecondary, fontSize: '13px', cursor: 'pointer',
    },
    logoutBtn: {
        padding: '8px 14px', background: 'transparent', border: `1px solid ${theme.borderDefault}`,
        borderRadius: '8px', color: theme.textSecondary, fontSize: '13px', cursor: 'pointer',
    },
    content: { flex: 1, padding: '32px 24px', maxWidth: '1100px', margin: '0 auto', width: '100%' },
    title: { fontSize: '28px', fontWeight: '700', color: theme.textPrimary, margin: '0 0 8px' },
    subtitle: { fontSize: '15px', color: theme.textMuted, margin: '0 0 28px' },
    loading: { color: theme.textSecondary, fontSize: '16px', textAlign: 'center', padding: '60px 0' },
    empty: { textAlign: 'center', padding: '60px 0', color: theme.textMuted },
    emptyIcon: { fontSize: '48px', display: 'block', marginBottom: '16px' },
    planBtn: {
        marginTop: '16px', padding: '12px 24px', background: theme.accentBlue,
        color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px',
        fontWeight: '600', cursor: 'pointer',
    },
    statsRow: {
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px', marginBottom: '24px',
    },
    statCard: {
        display: 'flex', alignItems: 'center', gap: '12px',
        background: theme.bgSecondary, border: `1px solid ${theme.borderDefault}`,
        borderRadius: '12px', padding: '14px 18px',
    },
    statIcon: { fontSize: '22px' },
    statValue: { fontSize: '20px', fontWeight: '700' },
    statLabel: { fontSize: '11px', color: theme.textMuted, marginTop: '2px' },
    chartsGrid: {
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px',
    },
    chartCard: {
        background: theme.bgSecondary, border: `1px solid ${theme.borderDefault}`,
        borderRadius: '12px', padding: '18px',
    },
    chartTitle: { color: theme.textPrimary, fontSize: '14px', fontWeight: '700', margin: '0 0 12px' },
};

export default AnalyticsPage;