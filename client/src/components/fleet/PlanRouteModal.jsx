import LocationAutocomplete from '../LocationAutocomplete';
import { styles } from './FleetDashboard.styles';

const PlanRouteModal = ({
    show,
    onClose,
    vehiclePlate,
    origin,
    setOrigin,
    destination,
    setDestination,
    departureTime,
    setDepartureTime,
    onPlan,
    planning,
}) => {
    if (!show) return null;

    return (
        <div style={styles.modalOverlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div style={styles.modalHeader}>
                    <h3 style={styles.modalTitle}>Plan Route for {vehiclePlate}</h3>
                    <button style={styles.modalClose} onClick={onClose}>✕</button>
                </div>

                <div style={styles.modalBody}>
                    <LocationAutocomplete
                        label="Departure Location"
                        placeholder="Type a city or address..."
                        onSelect={setOrigin}
                    />

                    <LocationAutocomplete
                        label="Destination Location"
                        placeholder="Type a city or address..."
                        onSelect={setDestination}
                    />

                    <div style={styles.field}>
                        <label style={styles.label}>Departure Time</label>
                        <input
                            style={styles.input}
                            type="datetime-local"
                            value={departureTime}
                            onChange={(e) => setDepartureTime(e.target.value)}
                        />
                    </div>

                    <button
                        style={styles.modalSubmitBtn}
                        onClick={onPlan}
                        disabled={planning}
                    >
                        {planning ? 'Planning...' : '🗺️ Calculate Route'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlanRouteModal;