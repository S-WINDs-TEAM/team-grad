import { useEffect, useState, useCallback } from 'react';
import { Bell, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getInboxApi, getUnreadCountApi, decideRequestApi, markReadApi, markAllReadApi } from '../../api/requestApi';
import { theme } from '../../styles/theme';

const CHIPS = [
    { key: 'all', label: 'All' },
    { key: 'route_request', label: 'Routes' },
    { key: 'break_request', label: 'Breaks' },
    { key: 'trip_request', label: 'Trips' },
];

const statusColor = (status) => {
    if (status === 'approved' || status === 'auto_approved') return theme.accentGreen;
    if (status === 'rejected') return theme.accentRed;
    if (status === 'pending') return theme.accentOrange;
    return theme.textMuted;
};

const NotificationCenter = ({ open, onOpenChange }) => {
    // const [open, setOpen] = useState(false);
    const [unread, setUnread] = useState({ total: 0, categories: {} });
    const [items, setItems] = useState([]);
    const [filter, setFilter] = useState('all');
    const [busyId, setBusyId] = useState(null);

    const refresh = useCallback(async () => {
        try {
            const [uRes, iRes] = await Promise.all([
                getUnreadCountApi(),
                getInboxApi({ limit: 20 }),
            ]);
            setUnread({ total: uRes.data.total, categories: uRes.data.categories });
            setItems(iRes.data.notifications);
        } catch (e) { /* silent */ }
    }, []);

    useEffect(() => {
        refresh();
        const t = setInterval(refresh, 8000);
        return () => clearInterval(t);
    }, [refresh]);

    useEffect(() => {
        if (open) {
            markAllReadApi().then(refresh).catch(() => {});
        }
    }, [open, refresh]);

    const decide = async (id, decision) => {
        setBusyId(id);
        try {
            await decideRequestApi(id, { decision });
            toast.success(decision === 'approved' ? 'Request approved' : 'Request rejected');
            refresh();
        } catch (e) {
            toast.error(e.response?.data?.msg || 'could not decide');
        } finally {
            setBusyId(null);
        }
    };

    const markRead = async (id) => {
        try {
            await markReadApi(id);
            refresh();
        } catch (e) { /* silent */ }
    };

    const visible = filter === 'all' ? items : items.filter((i) => i.category === filter);

    return (
        <div style={styles.wrap}>
            <button style={styles.bellBtn} onClick={() => onOpenChange(!open)} title="Notifications">
                <Bell size={18} />
                {unread.total > 0 && <span style={styles.badge}>{unread.total}</span>}
            </button>

            {open && (
                <div style={styles.panel}>
                    <div style={styles.panelHeader}>
                        <span style={styles.panelTitle}>Notifications</span>
                        <button style={styles.closeBtn} onClick={() => onOpenChange(false)}><X size={14} /></button>
                    </div>

                    <div style={styles.chipsRow}>
                        {CHIPS.map((c) => (
                            <button
                                key={c.key}
                                style={{
                                    ...styles.chip,
                                    background: filter === c.key ? 'rgba(37,99,235,0.2)' : 'transparent',
                                    borderColor: filter === c.key ? theme.accentBlue : theme.borderDefault,
                                }}
                                onClick={() => setFilter(c.key)}
                            >
                                {c.label}
                                {c.key !== 'all' && unread.categories[c.key] ? ` (${unread.categories[c.key]})` : ''}
                            </button>
                        ))}
                    </div>

                    <div style={styles.list}>
                        {visible.length === 0 && <p style={styles.empty}>No notifications yet.</p>}
                        {visible.map((n) => (
                            <div key={n._id} style={{ ...styles.item, opacity: n.read ? 0.65 : 1 }} onClick={() => !n.read && markRead(n._id)}>
                                <div style={styles.itemTop}>
                                    <span style={styles.itemTitle}>{n.title}</span>
                                    <span style={{ ...styles.itemStatus, color: statusColor(n.status) }}>
                                        {n.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div style={styles.itemMsg}>{n.message}</div>
                                <div style={styles.itemMeta}>{new Date(n.createdAt).toLocaleString()}</div>

                                {n.actionRequired && n.status === 'pending' && (
                                    <div style={styles.itemActions}>
                                        <button
                                            style={styles.approveBtn}
                                            disabled={busyId === n._id}
                                            onClick={(e) => { e.stopPropagation(); decide(n._id, 'approved'); }}
                                        >
                                            <Check size={14} /> Approve
                                        </button>
                                        <button
                                            style={styles.rejectBtn}
                                            disabled={busyId === n._id}
                                            onClick={(e) => { e.stopPropagation(); decide(n._id, 'rejected'); }}
                                        >
                                            <X size={14} /> Reject
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    wrap: { position: 'relative' },
    bellBtn: { position: 'relative', padding: '8px', background: 'transparent', border: `1px solid ${theme.borderDefault}`, borderRadius: '8px', color: theme.textSecondary, cursor: 'pointer', display: 'flex' },
    badge: { position: 'absolute', top: '-6px', right: '-6px', background: theme.accentRed, color: '#fff', fontSize: '10px', fontWeight: '700', borderRadius: '10px', padding: '1px 6px' },
    panel: { position: 'absolute', top: '42px', right: 0, width: '380px', maxHeight: '520px', background: theme.bgSecondary, border: `1px solid ${theme.borderDefault}`, borderRadius: '12px', boxShadow: '0 12px 32px rgba(0,0,0,0.45)', zIndex: 2100, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: `1px solid ${theme.borderDefault}` },
    panelTitle: { fontSize: '14px', fontWeight: '700', color: theme.textPrimary },
    closeBtn: { background: 'transparent', border: 'none', color: theme.textMuted, cursor: 'pointer', display: 'flex' },
    chipsRow: { display: 'flex', gap: '6px', padding: '10px 14px', borderBottom: `1px solid ${theme.borderDefault}`, flexWrap: 'wrap' },
    chip: { padding: '4px 10px', borderRadius: '12px', border: `1px solid`, color: theme.textSecondary, fontSize: '11px', fontWeight: '600', cursor: 'pointer' },
    list: { overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '10px' },
    empty: { fontSize: '12px', color: theme.textMuted, textAlign: 'center', padding: '20px 0' },
    item: { background: theme.bgTertiary, border: `1px solid ${theme.borderDefault}`, borderRadius: '10px', padding: '10px 12px', cursor: 'pointer' },
    itemTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' },
    itemTitle: { fontSize: '13px', fontWeight: '700', color: theme.textPrimary },
    itemStatus: { fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' },
    itemMsg: { fontSize: '12px', color: theme.textSecondary, marginTop: '4px', lineHeight: 1.5 },
    itemMeta: { fontSize: '10px', color: theme.textMuted, marginTop: '6px' },
    itemActions: { display: 'flex', gap: '8px', marginTop: '10px' },
    approveBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', background: theme.accentGreen, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
    rejectBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', background: 'transparent', border: `1px solid ${theme.accentRed}`, color: theme.accentRed, borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
};

export default NotificationCenter;