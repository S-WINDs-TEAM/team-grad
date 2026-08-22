const RouteLoadingSkeleton = () => {
  return (
    <div style={styles.container}>
      <div style={styles.shimmerBar} />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={styles.card}>
          <div style={{ ...styles.shimmerBlock, width: '60px', height: '40px' }} />
          <div style={styles.middle}>
            <div style={{ ...styles.shimmerBlock, width: '50%', height: '14px', marginBottom: '8px' }} />
            <div style={{ ...styles.shimmerBlock, width: '70%', height: '10px' }} />
          </div>
        </div>
      ))}

      <style>{`
        @keyframes shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
      `}</style>
    </div>
  );
};

const shimmerStyle = {
  background: 'linear-gradient(90deg, #11151c 25%, #1a1f2a 37%, #11151c 63%)',
  backgroundSize: '400px 100%',
  animation: 'shimmer 1.4s ease-in-out infinite',
  borderRadius: '6px',
};

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '10px' },
  shimmerBar: { ...shimmerStyle, height: '20px', width: '40%', marginBottom: '10px' },
  card: {
    display: 'flex', alignItems: 'center', gap: '14px',
    background: '#11151c', borderRadius: '10px', padding: '14px 16px',
  },
  shimmerBlock: shimmerStyle,
  middle: { flex: 1 },
};

export default RouteLoadingSkeleton;