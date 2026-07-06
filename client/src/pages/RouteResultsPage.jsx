// import { useSelector, useDispatch } from 'react-redux';
// import { useNavigate } from 'react-router-dom';
// import { useEffect } from 'react';
// import WaypointCard from '../components/WaypointCard';
// import MapView from '../components/MapView';
// import { clearCurrentTrip } from '../store/tripSlice';

// const RouteResultsPage = () => {
//     const { currentTrip: trip } = useSelector((state) => state.trip);
//     const navigate = useNavigate();
//     const dispatch = useDispatch();

//     useEffect(() => {
//         if (!trip) {
//             navigate('/plan');
//         }
//     }, [trip, navigate]);

//     const handleNewTrip = () => {
//         dispatch(clearCurrentTrip());
//         navigate('/plan');
//     };

//     if (!trip) return null;

//     // استخراج الـ origin و destination من الـ trip (لو موجودين)
//     const origin = trip.origin || null;
//     const destination = trip.destination || null;
//     const vehicleType = trip.vehicleType || 'car';

//     return (
//         <div style={styles.page}>
//             <header style={styles.header}>
//                 <span style={styles.logo}>⚡ S-WINDS</span>
//                 <button style={styles.newTripBtn} onClick={handleNewTrip}>+ New Trip</button>
//             </header>

//             <div style={styles.mapSection}>
//                 <MapView
//                     routePolyline={trip.routePolyline}
//                     waypoints={trip.waypoints}
//                     origin={origin}
//                     destination={destination}
//                     vehicleType={vehicleType}
//                 />
//             </div>

//             <div style={styles.panel}>
//                 <h2 style={styles.panelTitle}>Route Weather Timeline (ETA Based)</h2>

//                 <div style={styles.summaryRow}>
//                     <span style={styles.summaryItem}>📏 {trip.totalDistanceKm.toFixed(0)} km</span>
//                     <span style={styles.summaryItem}>⏱ {Math.round(trip.totalDurationMin)} min</span>
//                     <span style={{
//                         ...styles.summaryItem,
//                         color: trip.overallRiskLevel === 'high' ? '#ff4d4d' : trip.overallRiskLevel === 'medium' ? '#f5a623' : '#d4ff00',
//                     }}>
//                         Risk: {trip.overallRiskLevel.toUpperCase()}
//                     </span>
//                 </div>

//                 {trip.waypoints.map((wp, i) => (
//                     <WaypointCard
//                         key={i}
//                         waypoint={wp}
//                         index={i}
//                         isFirst={i === 0}
//                         isLast={i === trip.waypoints.length - 1}
//                     />
//                 ))}
//             </div>
//         </div>
//     );
// };

// const styles = {
//     page: { minHeight: '100vh', background: '#0a0e14', padding: '24px', fontFamily: 'system-ui, sans-serif' },
//     header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
//     logo: { color: '#d4ff00', fontWeight: '700', fontSize: '1.1rem', letterSpacing: '1px', cursor: 'pointer' },
//     newTripBtn: {
//         background: 'transparent', border: '1px solid #d4ff00', color: '#d4ff00',
//         padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer',
//     },
//     mapSection: { marginBottom: '20px' },
//     panel: {
//         background: '#11151c', borderRadius: '14px', padding: '24px',
//         border: '1px solid rgba(212,255,0,0.1)',
//     },
//     panelTitle: { color: '#fff', fontSize: '1.1rem', marginBottom: '20px' },
//     summaryRow: { display: 'flex', gap: '16px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #2a2f3a' },
//     summaryItem: { color: '#fff', fontSize: '0.85rem' },
// };

// export default RouteResultsPage;