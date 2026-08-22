import { useNavigate } from 'react-router-dom';
import { theme } from '../styles/theme';
import ROICalculator from '../components/ROICalculator';
const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      {/* خلفية الـ gradient الجوية */}
      <div style={styles.bgGlow} />

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>◈</span>
          <span style={styles.logoText}>S-WINDs</span>
        </div>
        <div style={styles.tagline}>Smart Navigation. Stronger Journeys.</div>
      </header>

      {/* Hero */}
      <main style={styles.main}>
        <h1 style={styles.heroTitle}>
          Navigate Smarter.{' '}
          <span style={styles.heroAccent}>Arrive Safer.</span>
        </h1>
        <p style={styles.heroSub}>
          Real-time weather intelligence and smart routing
          <br />for every journey and every fleet.
        </p>

        {/* Dual Entry Cards */}
        <div style={styles.cardsRow}>

          {/* Individual Driver */}
          <div
            style={styles.card}
            onMouseEnter={e => e.currentTarget.style.borderColor = theme.accentBlue}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
            onClick={() => navigate('/login?type=driver')}
          >
            <div style={{...styles.cardIcon, background: 'rgba(37,99,235,0.15)'}}>🚗</div>
            <h2 style={styles.cardTitle}>Individual Driver</h2>
            <p style={styles.cardDesc}>
              Get personalized weather alerts, smarter routes,
              and real-time road conditions for your daily drive.
            </p>
            <ul style={styles.featureList}>
              {[
                'Real-time weather updates',
                'Smart route recommendations',
                'Hazard & traffic alerts',
                'Safe speed per waypoint',
              ].map(f => (
                <li key={f} style={styles.featureItem}>
                  <span style={{color: theme.accentBlue}}>✓</span> {f}
                </li>
              ))}
            </ul>
            <button style={{...styles.btn, background: theme.accentBlue}}>
              I'm an Individual Driver →
            </button>
          </div>

          {/* Fleet Manager */}
          <div
            style={{...styles.card, borderColor: 'rgba(16,185,129,0.2)'}}
            onMouseEnter={e => e.currentTarget.style.borderColor = theme.accentGreen}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(16,185,129,0.2)'}
            onClick={() => navigate('/login?type=fleet')}
          >
            <div style={{...styles.cardIcon, background: 'rgba(16,185,129,0.15)'}}>🚛</div>
            <h2 style={styles.cardTitle}>Fleet Manager</h2>
            <p style={styles.cardDesc}>
              Monitor your fleet in real time, optimize operations,
              and keep every driver and vehicle safe.
            </p>
            <ul style={styles.featureList}>
              {[
                'Live fleet tracking',
                'Operational insights & reports',
                'Driver safety & compliance',
                'Emergency weather alerts',
              ].map(f => (
                <li key={f} style={styles.featureItem}>
                  <span style={{color: theme.accentGreen}}>✓</span> {f}
                </li>
              ))}
            </ul>
            <button style={{...styles.btn, background: theme.accentGreen}}>
              I'm a Fleet Manager →
            </button>
          </div>

        </div>

        {/* Bottom features bar */}
        <div style={styles.featuresBar}>
          {[
            { icon: '🌦', label: 'Real-time Weather' },
            { icon: '🗺', label: 'Smart Routing' },
            { icon: '🛡', label: 'Safety First' },
            { icon: '⚡', label: 'ETA-Based Forecast' },
          ].map(f => (
            <div key={f.label} style={styles.featureBarItem}>
              <span>{f.icon}</span>
              <span style={{color: theme.textSecondary, fontSize: '12px'}}>{f.label}</span>
            </div>
          ))}
        </div>
        {/* ROI Calculator — the sales closer for fleet prospects */}
        <ROICalculator />
      </main>
    </div>
  );
};

const styles = {
    page: {
    height: '100vh',             
    overflowY: 'auto',          
    overflowX: 'hidden',    
    background: '#080C14',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'system-ui, sans-serif',
    position: 'relative',
  },
  bgGlow: {
    position: 'absolute',
    top: '-20%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '80vw',
    height: '60vh',
    background: 'radial-gradient(ellipse, rgba(37,99,235,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '24px 48px',
    position: 'relative',
    zIndex: 1,
  },
  logo: { display: 'flex', alignItems: 'center', gap: '10px' },
  logoIcon: { fontSize: '22px', color: '#2563EB' },
  logoText: { fontSize: '20px', fontWeight: '700', color: '#fff', letterSpacing: '0.5px' },
  tagline: { fontSize: '13px', color: '#64748B' },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '48px 24px',
    position: 'relative',
    zIndex: 1,
  },
  heroTitle: {
    fontSize: '48px',
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    margin: '0 0 16px',
    lineHeight: 1.15,
  },
  heroAccent: { color: '#2563EB' },
  heroSub: {
    fontSize: '16px',
    color: '#94A3B8',
    textAlign: 'center',
    margin: '0 0 56px',
    lineHeight: 1.6,
  },
  cardsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    width: '100%',
    maxWidth: '880px',
    marginBottom: '48px',
  },
  card: {
    background: 'rgba(13,19,33,0.9)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '32px',
    cursor: 'pointer',
    transition: 'border-color 0.2s, transform 0.2s',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  cardIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '26px',
  },
  cardTitle: { fontSize: '22px', fontWeight: '700', color: '#fff', margin: 0 },
  cardDesc: { fontSize: '14px', color: '#94A3B8', lineHeight: 1.6, margin: 0 },
  featureList: { listStyle: 'none', padding: 0, margin: '4px 0', display: 'flex', flexDirection: 'column', gap: '8px' },
  featureItem: { fontSize: '13px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '8px' },
  btn: {
    marginTop: '8px',
    padding: '14px 24px',
    border: 'none',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'center',
  },
  featuresBar: {
    display: 'flex',
    gap: '40px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    paddingTop: '32px',
    width: '100%',
    maxWidth: '880px',
    justifyContent: 'center',
  },
  featureBarItem: { display: 'flex', alignItems: 'center', gap: '8px' },
};

export default LandingPage;