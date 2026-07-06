import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const HomePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const cards = [
    {
      title: 'Trip Planner',
      desc: 'Plan a new route with weather forecasting',
      icon: '🗺️',
      path: '/plan',
    },
    {
      title: 'Live Drive Mode',
      desc: 'Start a live trip with real-time alerts',
      icon: '🚗',
      path: '/drive',
      disabled: true,    
    },
    {
      title: 'Saved Routes',
      desc: 'View your trip history',
      icon: '📍',
      path: '/history',
      disabled: true,    
    },
    {
      title: 'Fleet Hub',
      desc: 'B2B fleet management dashboard',
      icon: '🚛',
      path: '/fleet',
      disabled: true, // not ready yet
    },
  ];

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <span style={styles.logo}>⚡ S-WINDS</span>
        <div style={styles.headerRight}>
          <span style={styles.userName}>👤 {user?.name}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div style={styles.welcome}>
        <h1 style={styles.welcomeTitle}>Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p style={styles.welcomeSubtitle}>Where are we heading today?</p>
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
            {card.disabled && <span style={styles.comingSoon}>Coming Soon</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  page: { minHeight: '100vh', background: '#0a0e14', padding: '24px', fontFamily: 'system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  logo: { color: '#d4ff00', fontWeight: '700', fontSize: '1.1rem', letterSpacing: '1px' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '16px' },
  userName: { color: '#8a93a3', fontSize: '0.85rem' },
  logoutBtn: {
    background: 'transparent', border: '1px solid #2a2f3a', color: '#8a93a3',
    padding: '6px 14px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer',
  },
  welcome: { marginBottom: '32px' },
  welcomeTitle: { color: '#fff', fontSize: '1.8rem', margin: 0 },
  welcomeSubtitle: { color: '#8a93a3', fontSize: '0.95rem', marginTop: '6px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' },
  card: {
    background: '#11151c', border: '1px solid rgba(212,255,0,0.1)', borderRadius: '14px',
    padding: '24px', cursor: 'pointer', transition: 'all 0.2s', position: 'relative',
  },
  cardDisabled: { opacity: 0.4, cursor: 'not-allowed' },
  cardIcon: { fontSize: '2rem' },
  cardTitle: { color: '#fff', fontSize: '1.1rem', margin: '12px 0 6px 0' },
  cardDesc: { color: '#8a93a3', fontSize: '0.8rem', margin: 0 },
  comingSoon: {
    position: 'absolute', top: '16px', right: '16px', fontSize: '0.65rem',
    color: '#f5a623', border: '1px solid #f5a623', borderRadius: '4px', padding: '2px 8px',
  },
};

export default HomePage;