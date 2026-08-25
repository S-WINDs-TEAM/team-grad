import { useState } from "react";
import { getRiskPathColor } from "../../utils/riskColors";
import { styles } from "./FleetDashboard.styles";
import { theme } from "../../styles/theme";

const FleetSidebar = ({
  search,
  setSearch,
  filteredVehicles,
  selectedVehicleIds,
  toggleVehicleSelection,
  selectedVehicleId,
  handleVehicleSelect,
  handleOpenPanel, // 🆕 NEW
  handleAssignDriver, // 🆕 NEW
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
  // 🆕 NEW: Track which vehicle's driver dropdown is open
  const [driverDropdownOpen, setDriverDropdownOpen] = useState(null);
  const [assigningDriver, setAssigningDriver] = useState(null);

  const handleDriverDropdownSelect = async (vehicleId, driverId) => {
    setAssigningDriver(vehicleId);
    await handleAssignDriver(vehicleId, driverId || null);
    setDriverDropdownOpen(null);
    setAssigningDriver(null);
  };

  return (
    <div style={styles.sidebar}>
      <input
        style={styles.searchInput}
        placeholder="Search vehicles or drivers…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <input
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        ref={vehiclePhotoInputRef}
        onChange={handleVehiclePhotoChange}
        style={{ display: "none" }}
      />

      <div style={styles.vehicleListWrapper}>
        <div style={styles.vehicleList}>
          {filteredVehicles.length === 0 && (
            <p style={styles.emptyText}>No vehicles yet — add one below.</p>
          )}
          {filteredVehicles.map((v) => {
            const risk = v.todayTrip?.overallRiskLevel || "N/A";
            const riskColor = getRiskPathColor(risk);
            const isSelected = v._id === selectedVehicleId;
            const trip = v.todayTrip;
            const routeInfo = trip
              ? `${trip.origin?.address || "Start"} → ${trip.destination?.address || "End"}`
              : "No route planned";
            const hasDriver = !!v.driverId;
            const driverName = v.driverId?.name || "No driver assigned";
            const isDropdownOpen = driverDropdownOpen === v._id;

            return (
              <div key={v._id} style={{ position: "relative" }}>
                <div
                  style={{
                    ...styles.vehicleItem,
                    background: isSelected
                      ? "rgba(37, 99, 235, 0.15)"
                      : styles.vehicleItem.background,
                    borderColor: isSelected
                      ? "#2563EB"
                      : styles.vehicleItem.borderColor,
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
                      <img
                        src={`http://localhost:5000${v.photoUrl}`}
                        alt={v.plateNumber}
                        style={styles.vehicleThumbImg}
                      />
                    ) : (
                      <span style={styles.vehicleThumbPlaceholder}>📷</span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={styles.vehiclePlate}>{v.plateNumber}</div>
                    {/* 🆕 NEW: Clickable driver name — opens dropdown */}
                    <div
                      style={{
                        ...styles.vehicleDriver,
                        cursor: "pointer",
                        color: hasDriver
                          ? theme.textSecondary
                          : theme.accentOrange,
                        textDecoration: hasDriver ? "none" : "underline dotted",
                        fontStyle: hasDriver ? "normal" : "italic",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDriverDropdownOpen(isDropdownOpen ? null : v._id);
                      }}
                      title={
                        hasDriver
                          ? `Click to change driver`
                          : `Click to assign a driver`
                      }
                    >
                      {hasDriver ? `👤 ${driverName}` : "⚠️ No driver assigned"}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span style={{ ...styles.statusBadge, color: riskColor }}>
                      {risk === "N/A" ? "No Trip" : risk.toUpperCase()}
                    </span>
                    {/* 🆕 NEW: Details button — only this opens the slide-out panel */}
                    {trip && (
                      <button
                        style={{
                          padding: "2px 8px",
                          background: "rgba(37, 99, 235, 0.15)",
                          border: `1px solid #2563EB`,
                          borderRadius: "4px",
                          color: "#3B82F6",
                          fontSize: "10px",
                          fontWeight: "700",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPanel(v._id);
                        }}
                        title="View waypoints and trip details"
                      >
                        Details
                      </button>
                    )}
                  </div>
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

                {/* 🆕 NEW: Driver assignment dropdown */}
                {isDropdownOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: "40px",
                      right: "8px",
                      background: "#1e293b",
                      border: `1px solid ${theme.borderDefault}`,
                      borderRadius: "8px",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                      zIndex: 100,
                      padding: "8px",
                      marginTop: "4px",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div
                      style={{
                        fontSize: "11px",
                        color: theme.textMuted,
                        marginBottom: "6px",
                        fontWeight: "600",
                      }}
                    >
                      Assign Driver:
                    </div>
                    {hasDriver && (
                      <button
                        style={{
                          width: "100%",
                          padding: "6px 10px",
                          background: "rgba(239,68,68,0.15)",
                          border: "1px solid rgba(239,68,68,0.3)",
                          borderRadius: "6px",
                          color: theme.accentRed,
                          fontSize: "11px",
                          cursor: "pointer",
                          marginBottom: "4px",
                          textAlign: "left",
                        }}
                        onClick={() => handleDriverDropdownSelect(v._id, null)}
                        disabled={assigningDriver === v._id}
                      >
                        ✕ Unassign current driver
                      </button>
                    )}
                    {drivers.length === 0 && (
                      <div
                        style={{
                          fontSize: "11px",
                          color: theme.textMuted,
                          padding: "4px",
                        }}
                      >
                        No drivers yet — invite one below
                      </div>
                    )}
                    {drivers.map((d) => {
                      const isCurrent = v.driverId?._id === d._id;
                      return (
                        <button
                          key={d._id}
                          style={{
                            width: "100%",
                            padding: "6px 10px",
                            background: isCurrent
                              ? "rgba(37,99,235,0.2)"
                              : "transparent",
                            border: isCurrent
                              ? "1px solid rgba(37,99,235,0.4)"
                              : "1px solid transparent",
                            borderRadius: "6px",
                            color: theme.textPrimary,
                            fontSize: "11px",
                            cursor: "pointer",
                            textAlign: "left",
                            marginBottom: "2px",
                          }}
                          onClick={() =>
                            handleDriverDropdownSelect(v._id, d._id)
                          }
                          disabled={assigningDriver === v._id}
                        >
                          👤 {d.name}
                          {d.accountStatus === "invited" ? " (pending)" : ""}
                          {isCurrent ? " ✓" : ""}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={styles.sidebarFooter}>
        <button
          style={styles.toggleFormsBtn}
          onClick={() => setShowAddForms((s) => !s)}
        >
          {showAddForms ? "− Hide forms" : "+ Add vehicle / invite driver"}
        </button>

        {showAddForms && (
          <div style={styles.formsBlock}>
            <form onSubmit={handleAddVehicle} style={styles.miniForm}>
              <span style={styles.miniFormTitle}>Add Vehicle</span>
              <input
                style={styles.miniInput}
                placeholder="Plate number"
                value={newVehicle.plateNumber}
                onChange={(e) =>
                  setNewVehicle({ ...newVehicle, plateNumber: e.target.value })
                }
              />
              <select
                style={styles.miniInput}
                value={newVehicle.vehicleType}
                onChange={(e) =>
                  setNewVehicle({ ...newVehicle, vehicleType: e.target.value })
                }
              >
                <option value="truck">🚛 Truck</option>
                <option value="car">🚗 Car</option>
                <option value="motorcycle">🏍️ Motorcycle</option>
              </select>
              <select
                style={styles.miniInput}
                value={newVehicle.driverId}
                onChange={(e) =>
                  setNewVehicle({ ...newVehicle, driverId: e.target.value })
                }
              >
                <option value="">No driver yet (assign later)</option>
                {drivers.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}{" "}
                    {d.accountStatus === "invited" ? "(invite pending)" : ""}
                  </option>
                ))}
              </select>
              <button type="submit" style={styles.miniBtn}>
                Add
              </button>
            </form>

            <form onSubmit={handleInviteDriver} style={styles.miniForm}>
              <span style={styles.miniFormTitle}>Invite Driver</span>
              <input
                style={styles.miniInput}
                placeholder="Driver name"
                value={newDriver.name}
                onChange={(e) =>
                  setNewDriver({ ...newDriver, name: e.target.value })
                }
              />
              <input
                style={styles.miniInput}
                placeholder="Driver email"
                value={newDriver.email}
                onChange={(e) =>
                  setNewDriver({ ...newDriver, email: e.target.value })
                }
              />
              <button
                type="submit"
                style={{ ...styles.miniBtn, background: theme.accentGreen }}
              >
                Invite
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default FleetSidebar;
