import { getRiskPathColor } from '../../utils/riskColors';
import { styles } from './FleetDashboard.styles';
import { theme } from '../../styles/theme';

const FleetSidebar = ({
    search,
    setSearch,
    filteredVehicles,
    selectedVehicleIds,
    toggleVehicleSelection,
    selectedVehicleId,
    handleVehicleSelect,
    handleVehiclePhotoClick,
    openPlanModal,
    showAddForms,
    setShowAddForms,
    newVehicle,
    setNewVehicle,
    handleAddVehicle,
    drivers,
    newDriver,
    setNewDriver,
    handleInviteDriver,
    vehiclePhotoInputRef,
    handleVehiclePhotoChange,
}) => {
    return (
        <div style={styles.sidebar}>
            {/* حقل البحث - ثابت */}
            <input
                style={styles.searchInput}
                placeholder="Search vehicles or drivers…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            {/* ملف الصور - مخفي */}
            <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                ref={vehiclePhotoInputRef}
                onChange={handleVehiclePhotoChange}
                style={{ display: 'none' }}
            />

            {/* ✅ حاوية العربيات القابلة للتمرير - هتاخد كل المساحة المتبقية */}
            <div style={styles.vehicleListWrapper}>
                <div style={styles.vehicleList}>
                    {filteredVehicles.length === 0 && (
                        <p style={styles.emptyText}>No vehicles yet — add one below.</p>
                    )}
                    {filteredVehicles.map((v) => {
                        const risk = v.todayTrip?.overallRiskLevel || 'N/A';
                        const riskColor = getRiskPathColor(risk);
                        const isSelected = v._id === selectedVehicleId;
                        const trip = v.todayTrip;
                        const routeInfo = trip ? `${trip.origin?.address || 'Start'} → ${trip.destination?.address || 'End'}` : 'No route planned';
                        return (
                            <div
                                key={v._id}
                                style={{
                                    ...styles.vehicleItem,
                                    background: isSelected ? 'rgba(37, 99, 235, 0.15)' : styles.vehicleItem.background,
                                    borderColor: isSelected ? '#2563EB' : styles.vehicleItem.borderColor,
                                }}
                                onClick={() => handleVehicleSelect(v._id)}
                                title={routeInfo}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedVehicleIds.includes(v._id)}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        toggleVehicleSelection(v._id);
                                    }}
                                    style={styles.checkbox}
                                />
                                <div
                                    style={styles.vehicleThumbWrap}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleVehiclePhotoClick(v._id);
                                    }}
                                    title="Click to change vehicle photo"
                                >
                                    {v.photoUrl ? (
                                        <img src={`http://localhost:5000${v.photoUrl}`} alt={v.plateNumber} style={styles.vehicleThumbImg} />
                                    ) : (
                                        <span style={styles.vehicleThumbPlaceholder}>📷</span>
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={styles.vehiclePlate}>{v.plateNumber}</div>
                                    <div style={styles.vehicleDriver}>{v.driverId?.name || 'No driver assigned'}</div>
                                </div>
                                <span style={{ ...styles.statusBadge, color: riskColor }}>
                                    {risk === 'N/A' ? 'No Trip' : risk.toUpperCase()}
                                </span>
                                <button
                                    style={styles.planRouteBtn}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openPlanModal(v._id, v.plateNumber);
                                    }}
                                    title="Plan a route for this vehicle"
                                >
                                    🛣️
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ✅ الجزء السفلي الثابت - الزر والنماذج هيفضلوا في مكانهم تحت */}
            <div style={styles.sidebarFooter}>
                <button style={styles.toggleFormsBtn} onClick={() => setShowAddForms((s) => !s)}>
                    {showAddForms ? '− Hide forms' : '+ Add vehicle / invite driver'}
                </button>

                {showAddForms && (
                    <div style={styles.formsBlock}>
                        <form onSubmit={handleAddVehicle} style={styles.miniForm}>
                            <span style={styles.miniFormTitle}>Add Vehicle</span>
                            <input
                                style={styles.miniInput}
                                placeholder="Plate number"
                                value={newVehicle.plateNumber}
                                onChange={(e) => setNewVehicle({ ...newVehicle, plateNumber: e.target.value })}
                            />
                            <select
                                style={styles.miniInput}
                                value={newVehicle.vehicleType}
                                onChange={(e) => setNewVehicle({ ...newVehicle, vehicleType: e.target.value })}
                            >
                                <option value="truck">🚛 Truck</option>
                                <option value="car">🚗 Car</option>
                                <option value="motorcycle">🏍️ Motorcycle</option>
                            </select>
                            <select
                                style={styles.miniInput}
                                value={newVehicle.driverId}
                                onChange={(e) => setNewVehicle({ ...newVehicle, driverId: e.target.value })}
                            >
                                <option value="">No driver yet (assign later)</option>
                                {drivers.map((d) => (
                                    <option key={d._id} value={d._id}>
                                        {d.name} {d.accountStatus === 'invited' ? '(invite pending)' : ''}
                                    </option>
                                ))}
                            </select>
                            <button type="submit" style={styles.miniBtn}>Add</button>
                        </form>

                        <form onSubmit={handleInviteDriver} style={styles.miniForm}>
                            <span style={styles.miniFormTitle}>Invite Driver</span>
                            <input
                                style={styles.miniInput}
                                placeholder="Driver name"
                                value={newDriver.name}
                                onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })}
                            />
                            <input
                                style={styles.miniInput}
                                placeholder="Driver email"
                                value={newDriver.email}
                                onChange={(e) => setNewDriver({ ...newDriver, email: e.target.value })}
                            />
                            <button type="submit" style={{ ...styles.miniBtn, background: theme.accentGreen }}>Invite</button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FleetSidebar;