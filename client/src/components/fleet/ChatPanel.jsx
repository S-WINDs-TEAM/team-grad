import { useEffect, useState, useCallback, useRef } from 'react';
import { MessageSquare, Send, X, ArrowLeft } from 'lucide-react';
import { getThreadsApi, getThreadApi, sendChatApi } from '../../api/chatApi';
import { theme } from '../../styles/theme';

const ChatPanel = ({ open, onOpenChange }) => {
    // const [open, setOpen] = useState(false);
    const [threads, setThreads] = useState([]);
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const endRef = useRef(null);

    const totalUnread = threads.reduce((s, t) => s + (t.unread || 0), 0);

    const refreshThreads = useCallback(async () => {
        try {
            const res = await getThreadsApi();
            setThreads(res.data.threads);
        } catch (e) { /* silent */ }
    }, []);

    const refreshThread = useCallback(async (driverId) => {
        try {
            const res = await getThreadApi(driverId);
            setMessages(res.data.messages);
        } catch (e) { /* silent */ }
    }, []);

    useEffect(() => {
        if (!open) return;
        refreshThreads();
        const t = setInterval(() => {
            refreshThreads();
            if (selectedDriver) refreshThread(selectedDriver);
        }, 8000);
        return () => clearInterval(t);
    }, [open, selectedDriver, refreshThreads, refreshThread]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const openThread = (driverId) => {
        setSelectedDriver(driverId);
        refreshThread(driverId);
    };

    const send = async (e) => {
        e.preventDefault();
        if (!input.trim() || !selectedDriver) return;
        setSending(true);
        try {
            const res = await sendChatApi({ driverId: selectedDriver, message: input.trim() });
            setMessages((prev) => [...prev, res.data.message]);
            setInput('');
        } catch (err) {
            // silent — retryable
        } finally {
            setSending(false);
        }
    };

    const activeThread = threads.find((t) => t.driverId === selectedDriver);

    return (
        <div style={styles.wrap}>
            <button style={styles.chatBtn} onClick={() => onOpenChange(!open)} title="Messages">
                <MessageSquare size={18} />
                {totalUnread > 0 && <span style={styles.badge}>{totalUnread}</span>}
            </button>

            {open && (
                <div style={styles.panel}>
                    <div style={styles.panelHeader}>
                        {selectedDriver ? (
                            <button style={styles.backBtn} onClick={() => setSelectedDriver(null)}>
                                <ArrowLeft size={14} /> Threads
                            </button>
                        ) : (
                            <span style={styles.panelTitle}>Messages</span>
                        )}
                        <button style={styles.closeBtn} onClick={() => onOpenChange(false)}><X size={14} /></button>
                    </div>

                    {!selectedDriver ? (
                        <div style={styles.list}>
                            {threads.length === 0 && <p style={styles.empty}>No drivers yet.</p>}
                            {threads.map((t) => (
                                <button key={t.driverId} style={styles.threadItem} onClick={() => openThread(t.driverId)}>
                                    <div style={styles.threadTop}>
                                        <span style={styles.threadName}>{t.driverName}</span>
                                        {t.unread > 0 && <span style={styles.unreadDot}>{t.unread}</span>}
                                    </div>
                                    <div style={styles.threadLast}>
                                        {t.lastMessage ? `${t.lastMessage.senderRole === 'company_admin' ? 'You: ' : ''}${t.lastMessage.message}` : 'No messages yet'}
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <>
                            <div style={styles.scroll}>
                                {messages.length === 0 && <p style={styles.empty}>No messages yet.</p>}
                                {messages.map((m) => {
                                    const mine = m.senderRole === 'company_admin';
                                    return (
                                        <div key={m._id} style={{ ...styles.bubbleWrap, justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                                            <div style={{ ...styles.bubble, background: mine ? 'rgba(37,99,235,0.2)' : 'rgba(255,255,255,0.06)' }}>
                                                {m.message}
                                                {m.tripId && <span style={styles.tripTag}>trip-linked</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={endRef} />
                            </div>
                            <form onSubmit={send} style={styles.form}>
                                <input
                                    style={styles.input}
                                    placeholder={`Message ${activeThread?.driverName || ''}…`}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    maxLength={500}
                                />
                                <button style={styles.sendBtn} type="submit" disabled={sending}>
                                    <Send size={15} />
                                </button>
                            </form>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

const styles = {
    wrap: { position: 'relative' },
    chatBtn: { position: 'relative', padding: '8px', background: 'transparent', border: `1px solid ${theme.borderDefault}`, borderRadius: '8px', color: theme.textSecondary, cursor: 'pointer', display: 'flex' },
    badge: { position: 'absolute', top: '-6px', right: '-6px', background: theme.accentRed, color: '#fff', fontSize: '10px', fontWeight: '700', borderRadius: '10px', padding: '1px 6px' },
    panel: { position: 'absolute', top: '42px', right: 0, width: '380px', height: '480px', background: theme.bgSecondary, border: `1px solid ${theme.borderDefault}`, borderRadius: '12px', boxShadow: '0 12px 32px rgba(0,0,0,0.45)', zIndex: 2100, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: `1px solid ${theme.borderDefault}` },
    panelTitle: { fontSize: '14px', fontWeight: '700', color: theme.textPrimary },
    backBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: theme.textSecondary, fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
    closeBtn: { background: 'transparent', border: 'none', color: theme.textMuted, cursor: 'pointer', display: 'flex' },
    list: { overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '8px' },
    empty: { fontSize: '12px', color: theme.textMuted, textAlign: 'center', padding: '20px 0' },
    threadItem: { textAlign: 'left', background: theme.bgTertiary, border: `1px solid ${theme.borderDefault}`, borderRadius: '10px', padding: '10px 12px', cursor: 'pointer' },
    threadTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    threadName: { fontSize: '13px', fontWeight: '700', color: theme.textPrimary },
    unreadDot: { background: theme.accentRed, color: '#fff', fontSize: '10px', fontWeight: '700', borderRadius: '10px', padding: '1px 6px' },
    threadLast: { fontSize: '11px', color: theme.textMuted, marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    scroll: { flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' },
    bubbleWrap: { display: 'flex' },
    bubble: { maxWidth: '80%', padding: '9px 12px', borderRadius: '12px', fontSize: '12px', color: theme.textPrimary, lineHeight: 1.5 },
    tripTag: { display: 'block', fontSize: '9px', color: theme.accentBlue, marginTop: '4px' },
    form: { display: 'flex', gap: '8px', padding: '10px 14px', borderTop: `1px solid ${theme.borderDefault}` },
    input: { flex: 1, padding: '9px 12px', background: theme.bgTertiary, border: `1px solid ${theme.borderDefault}`, borderRadius: '8px', color: theme.textPrimary, fontSize: '12px', outline: 'none' },
    sendBtn: { padding: '9px 12px', background: theme.accentBlue, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex' },
};

export default ChatPanel;