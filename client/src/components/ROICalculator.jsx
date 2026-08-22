import { useState } from 'react';
import { theme } from '../styles/theme';

// documented assumptions (same constants we use in the pitch):
// $1.5 saved per trip (delays) + $0.8 per trip (accident risk) + $0.02 per km (fuel)
const DELAY_SAVED_PER_TRIP = 1.5;
const ACCIDENT_SAVED_PER_TRIP = 0.8;
const FUEL_SAVED_PER_KM = 0.02;
const WORK_DAYS = 22;
const planCostFor = (vehicles) => (vehicles <= 5 ? 49 : vehicles <= 25 ? 149 : 399);

const ROICalculator = () => {
    const [vehicles, setVehicles] = useState(10);
    const [dailyTrips, setDailyTrips] = useState(3);
    const [avgKm, setAvgKm] = useState(150);

    const monthlyTrips = vehicles * dailyTrips * WORK_DAYS;
    const savings = Math.round(
        monthlyTrips * (DELAY_SAVED_PER_TRIP + ACCIDENT_SAVED_PER_TRIP) +
        monthlyTrips * avgKm * FUEL_SAVED_PER_KM
    );
    const cost = planCostFor(vehicles);
    const net = savings - cost;
    const roi = cost > 0 ? Math.round((net / cost) * 100) : 0;

    return (
        <div style={styles.box}>
            <h3 style={styles.title}>💰 How much could S-WINDS save you?</h3>

            <div style={styles.inputsRow}>
                <label style={styles.inputBox}>
                    <span style={styles.label}>Vehicles</span>
                    <input style={styles.input} type="number" min="1" max="500" value={vehicles}
                        onChange={(e) => setVehicles(Math.max(1, Number(e.target.value) || 1))} />
                </label>
                <label style={styles.inputBox}>
                    <span style={styles.label}>Trips / vehicle / day</span>
                    <input style={styles.input} type="number" min="1" max="20" value={dailyTrips}
                        onChange={(e) => setDailyTrips(Math.max(1, Number(e.target.value) || 1))} />
                </label>
                <label style={styles.inputBox}>
                    <span style={styles.label}>Avg trip distance (km)</span>
                    <input style={styles.input} type="number" min="10" max="1000" value={avgKm}
                        onChange={(e) => setAvgKm(Math.max(10, Number(e.target.value) || 10))} />
                </label>
            </div>

            <div style={styles.resultsRow}>
                <div style={styles.resultCard}>
                    <div style={{ ...styles.resultValue, color: theme.accentGreen }}>
                        ${savings.toLocaleString()}
                    </div>
                    <div style={styles.resultLabel}>Estimated monthly savings</div>
                </div>
                <div style={styles.resultCard}>
                    <div style={styles.resultValue}>${cost}</div>
                    <div style={styles.resultLabel}>S-WINDS plan / month</div>
                </div>
                <div style={styles.resultCard}>
                    <div style={{ ...styles.resultValue, color: theme.accentBlue }}>{roi}%</div>
                    <div style={styles.resultLabel}>ROI</div>
                </div>
            </div>

            <p style={styles.note}>
                Assumptions: $1.5/trip delay savings · $0.8/trip accident-risk savings · $0.02/km fuel · 22 work days.
                If we don't save you at least $500/month, you don't pay. That's the deal.
            </p>
        </div>
    );
};

const styles = {
    box: {
        width: '100%', maxWidth: '880px', margin: '40px auto 0',
        background: 'rgba(13,19,33,0.9)', border: '1px solid rgba(16,185,129,0.25)',
        borderRadius: '16px', padding: '28px',
    },
    title: { color: '#fff', fontSize: '18px', fontWeight: '700', margin: '0 0 20px', textAlign: 'center' },
    inputsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' },
    inputBox: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { color: '#94A3B8', fontSize: '12px' },
    input: {
        padding: '10px 12px', background: '#111827', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none',
    },
    resultsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' },
    resultCard: { background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '14px', textAlign: 'center' },
    resultValue: { color: '#fff', fontSize: '22px', fontWeight: '800' },
    resultLabel: { color: '#94A3B8', fontSize: '11px', marginTop: '4px' },
    note: { color: '#64748B', fontSize: '12px', textAlign: 'center', marginTop: '16px', lineHeight: '1.5' },
};

export default ROICalculator;