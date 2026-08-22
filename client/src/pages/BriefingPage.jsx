import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuth from '../hooks/useAuth';
import { getBriefingApi } from '../api/briefingApi';
import { theme } from '../styles/theme';

// level → color (none = grey)
const LEVEL_COLOR = (level) => {
    if (level === 'high') return theme.accentRed;
    if (level === 'medium') return theme.accentOrange;
    if (level === 'low') return theme.accentGreen;
    return theme.textMuted;
};

const BriefingPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [briefing, setBriefing] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBriefing = async () => {
            try {
                const res = await getBriefingApi();
                setBriefing(res.data.briefing);
            } catch (err) {
                toast.error('Could not load the daily briefing');
            } finally {
                setLoading(false);
            }
        };
        fetchBriefing();
    }, []);

    return (
        <div style={styles.page}>
            {/* Header */}
            <header style={styles.header}>
                <div style={styles.logo}>
                    <span style={styles.logoIcon}>◈</span>
                    <span style={styles.logoText}>S-WINDs</span>
                    <span style={styles.logoSubtext}>Daily Briefing</span>
                </div>
                <div style={styles.headerRight}>
                    <button style={styles.backBtn} onClick={() => navigate('/fleet')}>
                        ← Back to Dashboard
                    </button>
                    <span style={styles.userName}>{user?.name}</span>
                </div>
            </header>

            <div style={styles.content}>
                <h1 style={styles.title}>☀️ Good morning, {user?.name?.split(' ')[0]}</h1>
                <p style={styles.subtitle}>
                    {briefing
                        ? new Date(briefing.date).toLocaleDateString('en-US', {
                            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                        })
                        : 'Loading today\'s fleet picture...'}
                </p>

                {loading ? (
                    <div style={styles.loading}>Preparing your briefing...</div>
                ) : !briefing ? (
                    <div style={styles.loading}>No briefing available for this account.</div>
                ) : (
                    <>
                        {/* Summary cards */}
                        <div style={styles.statsRow}>
                            <div style={{ ...styles.statCard, borderColor: theme.accentGreen }}>
                                <div style={{ ...styles.statValue, color: theme.accentGreen }}>{briefing.safe}</div>
                                <div style={styles.statLabel}>Safe to dispatch</div>
                            </div>
                            <div style={{ ...styles.statCard, borderColor: theme.accentOrange }}>
                                <div style={{ ...styles.statValue, color: theme.accentOrange }}>{briefing.caution}</div>
                                <div style={styles.statLabel}>Dispatch with caution</div>
                            </div>
                            <div style={{ ...styles.statCard, borderColor: theme.accentRed }}>
                                <div style={{ ...styles.statValue, color: theme.accentRed }}>{briefing.danger}</div>
                                <div style={styles.statLabel}>Consider delaying</div>
                            </div>
                            <div style={styles.statCard}>
                                <div style={styles.statValue}>{briefing.noTrip}</div>
                                <div style={styles.statLabel}>No trip today</div>
                            </div>
                        </div>

                        {/* Per-vehicle recommendations */}
                        <div style={styles.itemsList}>
                            {briefing.items.map((item, i) => (
                                <div key={i} style={{ ...styles.itemCard, borderLeft: `4px solid ${LEVEL_COLOR(item.level)}` }}>
                                    <div style={styles.itemHeader}>
                                        <span style={styles.itemPlate}>🚛 {item.plateNumber}</span>
                                        {item.driver && <span style={styles.itemDriver}>{item.driver}</span>}
                                        <span style={{ ...styles.itemLevel, color: LEVEL_COLOR(item.level) }}>
                                            {item.level === 'none' ? 'NO TRIP' : item.level.toUpperCase()}
                                        </span>
                                    </div>
                                    {item.route && <div style={styles.itemRoute}>{item.route}</div>}
                                    <div style={styles.itemRec}>✅ {item.recommendation}</div>
                                </div>
                            ))}
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
    content: { flex: 1, padding: '32px 24px', maxWidth: '900px', margin: '0 auto', width: '100%' },
    title: { fontSize: '26px', fontWeight: '700', color: theme.textPrimary, margin: '0 0 8px' },
    subtitle: { fontSize: '15px', color: theme.textMuted, margin: '0 0 28px' },
    loading: { color: theme.textSecondary, fontSize: '16px', textAlign: 'center', padding: '60px 0' },
    statsRow: {
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '16px', marginBottom: '24px',
    },
    statCard: {
        background: theme.bgSecondary, border: `1px solid ${theme.borderDefault}`,
        borderRadius: '12px', padding: '14px 18px', textAlign: 'center',
    },
    statValue: { fontSize: '24px', fontWeight: '800', color: theme.textPrimary },
    statLabel: { fontSize: '11px', color: theme.textMuted, marginTop: '4px' },
    itemsList: { display: 'flex', flexDirection: 'column', gap: '12px' },
    itemCard: {
        background: theme.bgSecondary, border: `1px solid ${theme.borderDefault}`,
        borderRadius: '10px', padding: '14px 16px',
    },
    itemHeader: { display: 'flex', alignItems: 'center', gap: '12px' },
    itemPlate: { color: theme.textPrimary, fontSize: '14px', fontWeight: '700' },
    itemDriver: { color: theme.textSecondary, fontSize: '12px' },
    itemLevel: { marginLeft: 'auto', fontSize: '11px', fontWeight: '800' },
    itemRoute: { color: theme.textSecondary, fontSize: '12px', marginTop: '6px' },
    itemRec: { color: theme.textPrimary, fontSize: '13px', marginTop: '8px' },
};

export default BriefingPage;