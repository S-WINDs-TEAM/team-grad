import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FlaskConical } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { enableHazardApi, disableHazardApi, getSimStatusApi } from '../api/testApi';
import { theme } from '../styles/theme';

const TestPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [zone, setZone] = useState(null);
    const [fromKm, setFromKm] = useState(40);
    const [toKm, setToKm] = useState(60);

    useEffect(() => {
        if (user && user.role !== 'company_admin') navigate('/home');
    }, [user, navigate]);

    const refresh = async () => {
        try {
            const res = await getSimStatusApi();
            setZone(res.data.hazardZone);
        } catch (e) { /* silent */ }
    };

    useEffect(() => { refresh(); }, []);

    const enable = async () => {
        try {
            await enableHazardApi({ fromKm, toKm });
            toast.success(`hazard simulation ON between KM ${fromKm} and KM ${toKm}`);
            refresh();
        } catch (e) {
            toast.error('could not enable simulation');
        }
    };

    const disable = async () => {
        try {
            await disableHazardApi();
            toast.success('simulation OFF — using real weather data');
            refresh();
        } catch (e) {
            toast.error('could not disable simulation');
        }
    };

    return (
        <div style={styles.page}>
            <header style={styles.header}>
                <div style={styles.logo}>
                    <span style={styles.logoIcon}>◈</span>
                    <span style={styles.logoText}>S-WINDs</span>
                    <span style={styles.logoSubtext}>Demo Controls</span>
                </div>
                <button style={styles.backBtn} onClick={() => navigate('/fleet')}>Back to Dashboard</button>
            </header>

            <div style={styles.content}>
                <h1 style={styles.title}>Demo Controls</h1>
                <p style={styles.subtitle}>
                    Controlled simulation tools for testing and demo day. When OFF, the system
                    uses 100% real weather data. When ON, the injected hazard is clearly labeled
                    "SIMULATED (demo mode)" everywhere it appears.
                </p>

                <div style={zone ? styles.statusOn : styles.statusOff}>
                    {zone
                        ? `Simulation ACTIVE — sandstorm injected between KM ${zone.fromKm} and KM ${zone.toKm}`
                        : 'Simulation OFF — real weather data in use'}
                </div>

                <div style={styles.card}>
                    <div style={styles.cardTitle}><FlaskConical size={16} /> Hazard Zone Simulation</div>

                    <div style={styles.row}>
                        <div style={styles.field}>
                            <label style={styles.label}>From KM</label>
                            <input
                                style={styles.input}
                                type="number"
                                min="0"
                                value={fromKm}
                                onChange={(e) => setFromKm(Number(e.target.value))}
                            />
                        </div>
                        <div style={styles.field}>
                            <label style={styles.label}>To KM</label>
                            <input
                                style={styles.input}
                                type="number"
                                min="0"
                                value={toKm}
                                onChange={(e) => setToKm(Number(e.target.value))}
                            />
                        </div>
                    </div>

                    <div style={styles.row}>
                        <button style={styles.enableBtn} onClick={enable}>Enable Simulation</button>
                        <button style={styles.disableBtn} onClick={disable}>Disable (Real Data)</button>
                    </div>

                    <div style={styles.howto}>
                        <div style={styles.howtoTitle}>How to test the full flow</div>
                        <ol style={styles.howtoList}>
                            <li>Enable the simulation (default KM 40-60 fits Cairo → Alexandria).</li>
                            <li>Plan a trip for a vehicle (or as an individual).</li>
                            <li>The route now contains a HIGH-risk point: alternate route + alert are generated automatically.</li>
                            <li>Log in as the driver: the hazard note and "Request Alternate Route" button appear.</li>
                            <li>The manager sees the request in the notification bell and can approve/reject.</li>
                            <li>Disable the simulation to return to real weather instantly.</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    page: { minHeight: '100vh', background: theme.bgPrimary, fontFamily: 'system-ui, sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: `1px solid ${theme.borderDefault}` },
    logo: { display: 'flex', alignItems: 'center', gap: '10px' },
    logoIcon: { fontSize: '20px', color: theme.accentBlue },
    logoText: { fontSize: '18px', fontWeight: '700', color: theme.textPrimary },
    logoSubtext: { fontSize: '12px', color: theme.textMuted, marginLeft: '4px' },
    backBtn: { padding: '6px 14px', background: 'transparent', border: `1px solid ${theme.borderDefault}`, borderRadius: '8px', color: theme.textSecondary, fontSize: '13px', cursor: 'pointer' },
    content: { maxWidth: '720px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '16px' },
    title: { fontSize: '26px', fontWeight: '800', color: theme.textPrimary, margin: 0 },
    subtitle: { fontSize: '13px', color: theme.textMuted, lineHeight: 1.7, margin: 0 },
    statusOn: { padding: '12px 16px', borderRadius: '10px', border: `1px solid ${theme.accentOrange}`, background: 'rgba(245,158,11,0.1)', color: theme.accentOrange, fontSize: '13px', fontWeight: '700' },
    statusOff: { padding: '12px 16px', borderRadius: '10px', border: `1px solid ${theme.accentGreen}`, background: 'rgba(16,185,129,0.1)', color: theme.accentGreen, fontSize: '13px', fontWeight: '700' },
    card: { background: theme.bgSecondary, border: `1px solid ${theme.borderDefault}`, borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' },
    cardTitle: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '700', color: theme.textPrimary },
    row: { display: 'flex', gap: '12px' },
    field: { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '12px', color: theme.textMuted },
    input: { padding: '10px 12px', background: theme.bgTertiary, border: `1px solid ${theme.borderDefault}`, borderRadius: '8px', color: theme.textPrimary, fontSize: '14px', outline: 'none' },
    enableBtn: { flex: 1, padding: '12px', background: theme.accentOrange, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
    disableBtn: { flex: 1, padding: '12px', background: 'transparent', border: `1px solid ${theme.accentGreen}`, color: theme.accentGreen, borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
    howto: { borderTop: `1px solid ${theme.borderDefault}`, paddingTop: '14px' },
    howtoTitle: { fontSize: '13px', fontWeight: '700', color: theme.textPrimary, marginBottom: '8px' },
    howtoList: { margin: 0, paddingLeft: '18px', fontSize: '12px', color: theme.textSecondary, lineHeight: 1.9 },
};

export default TestPage;