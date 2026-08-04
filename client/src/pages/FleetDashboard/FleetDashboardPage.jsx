import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { MapContainer, TileLayer } from "react-leaflet";
import toast from "react-hot-toast";
import useAuth from "../../hooks/useAuth";
import useSocket from "../../hooks/useSocket";
import {
  getFleetDashboardApi,
  getDriversApi,
  addVehicleApi,
  inviteDriverApi,
  sendAlertApi,
  uploadVehiclePhotoApi,
  getFleetStatusApi,
} from "../../api/fleetApi";
import { planRouteApi, getTripByIdApi } from "../../api/routeApi";
import { setVehicles, upsertVehicle } from "../../store/fleetSlice";
import { theme } from "../../styles/theme";

// Components
import FleetSidebar from "../../components/fleet/FleetSidebar";
import FleetMapController from "../../components/fleet/FleetMapController";
import SlideOutPanel from "../../components/fleet/SlideOutPanel";
import PlanRouteModal from "../../components/fleet/PlanRouteModal";
import { styles } from "../../components/fleet/FleetDashboard.styles";
import FleetAuthorizedHeader from "../../components/FleetAuthorizedHeader";

const StatCard = ({ label, value, icon, color }) => (
  <div style={styles.statCard}>
    <span style={styles.statIcon}>{icon}</span>
    <div>
      <div style={{ ...styles.statValue, color: color || theme.textPrimary }}>
        {value}
      </div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  </div>
);

const FleetDashboardPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();
  useSocket();

  const { vehicles, alerts, connected } = useSelector((state) => state.fleet);

  // States
  const [fleetWithTrips, setFleetWithTrips] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedVehicleIds, setSelectedVehicleIds] = useState([]);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("weather");
  const [sending, setSending] = useState(false);
  const [showAddForms, setShowAddForms] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [newVehicle, setNewVehicle] = useState({
    plateNumber: "",
    vehicleType: "truck",
    driverId: "",
  });
  const [newDriver, setNewDriver] = useState({ name: "", email: "" });

  // Layer Controls
  const [showRoutes, setShowRoutes] = useState(true);
  const [showLive, setShowLive] = useState(true);
  const [showWaypoints, setShowWaypoints] = useState(false);

  // Selection & Waypoints
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [selectedTripDetails, setSelectedTripDetails] = useState(null);
  const [selectedVehicleForPanel, setSelectedVehicleForPanel] = useState(null);
  const [selectedWaypointIndex, setSelectedWaypointIndex] = useState(null);

  // Plan Route Modal
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planVehicleId, setPlanVehicleId] = useState(null);
  const [planVehiclePlate, setPlanVehiclePlate] = useState("");
  const [planOrigin, setPlanOrigin] = useState(null);
  const [planDestination, setPlanDestination] = useState(null);
  const [planDepartureTime, setPlanDepartureTime] = useState("");
  const [planning, setPlanning] = useState(false);

  const vehiclePhotoInputRef = useRef(null);
  const [photoTargetVehicleId, setPhotoTargetVehicleId] = useState(null);

  // Effects
  useEffect(() => {
    if (user && user.role !== "company_admin") navigate("/home");
  }, [user, navigate]);

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const response = await getDriversApi();
        setDrivers(response.data.drivers);
      } catch (err) {}
    };
    const fetchData = async () => {
      try {
        setLoadingDashboard(true);
        const dashboardRes = await getFleetDashboardApi();
        setFleetWithTrips(dashboardRes.data.fleet);
        const statusRes = await getFleetStatusApi();
        dispatch(setVehicles(statusRes.data.vehicles));
      } catch (err) {
        toast.error("Could not load fleet data");
      } finally {
        setLoadingDashboard(false);
      }
    };
    if (user?.role === "company_admin") {
      fetchData();
      fetchDrivers();
    }
  }, [dispatch, user]);

  // Computed Data
  const mergedFleetData = useMemo(() => {
    return vehicles.map((vehicle) => {
      const fleetItem = fleetWithTrips.find(
        (f) => f.vehicle.id === vehicle._id,
      );
      return { ...vehicle, todayTrip: fleetItem?.todayTrip || null };
    });
  }, [vehicles, fleetWithTrips]);

  const vehiclesWithLocation = useMemo(
    () =>
      mergedFleetData.filter((v) =>
        v.currentLocation?.coordinates?.some((c) => c !== 0),
      ),
    [mergedFleetData],
  );

  const stats = useMemo(() => {
    const total = vehicles.length;
    const active = vehicles.filter((v) => v.status === "active").length;
    const idle = vehicles.filter((v) => v.status === "idle").length;
    const offline = vehicles.filter((v) => v.status === "offline").length;
    return { total, active, idle, offline };
  }, [vehicles]);

  const filteredVehicles = useMemo(() => {
    if (!search.trim()) return mergedFleetData;
    const q = search.toLowerCase();
    return mergedFleetData.filter(
      (v) =>
        v.plateNumber?.toLowerCase().includes(q) ||
        v.driverId?.name?.toLowerCase().includes(q),
    );
  }, [mergedFleetData, search]);

  const mapCenter = useMemo(() => {
    if (vehiclesWithLocation.length > 0) {
      const loc = vehiclesWithLocation[0].currentLocation.coordinates;
      return [loc[1], loc[0]];
    }
    const firstWithTrip = mergedFleetData.find(
      (item) => item.todayTrip !== null,
    );
    if (firstWithTrip && firstWithTrip.todayTrip.routePolyline?.length > 0) {
      const mid = Math.floor(firstWithTrip.todayTrip.routePolyline.length / 2);
      const point = firstWithTrip.todayTrip.routePolyline[mid];
      return [point[0], point[1]];
    }
    return [30.0444, 31.2357];
  }, [vehiclesWithLocation, mergedFleetData]);

  // Filtered waypoints for slide-out panel
  const filteredWaypoints = useMemo(() => {
    if (!selectedTripDetails) return [];
    const allWaypoints = selectedTripDetails.waypoints || [];
    if (allWaypoints.length === 0) return [];
    if (showWaypoints) return allWaypoints;
    const totalDistance =
      allWaypoints[allWaypoints.length - 1]?.distanceFromStart || 0;
    const targetCount = Math.max(2, Math.ceil(totalDistance / 30));
    const step = Math.max(1, Math.floor(allWaypoints.length / targetCount));
    const sampled = [];
    for (let i = 0; i < allWaypoints.length; i += step)
      sampled.push(allWaypoints[i]);
    const last = allWaypoints[allWaypoints.length - 1];
    if (sampled[sampled.length - 1] !== last) sampled.push(last);
    return sampled;
  }, [selectedTripDetails, showWaypoints]);

  // Handlers
  const toggleVehicleSelection = (id) => {
    setSelectedVehicleIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  };

  const handleVehicleSelect = async (vehicleId) => {
    if (selectedVehicleId === vehicleId) {
      setSelectedVehicleId(null);
      setSelectedTripDetails(null);
      setSelectedVehicleForPanel(null);
      setSelectedWaypointIndex(null);
      return;
    }
    const vehicle = mergedFleetData.find((v) => v._id === vehicleId);
    if (!vehicle) return;
    setSelectedVehicleId(vehicleId);
    setSelectedVehicleForPanel(vehicle);
    setSelectedWaypointIndex(null);
    // Clear old details immediately
    setSelectedTripDetails(null);
    if (vehicle.todayTrip) {
      try {
        const response = await getTripByIdApi(vehicle.todayTrip.id);
        setSelectedTripDetails(response.data.trip);
      } catch (err) {
        toast.error("Could not load trip details");
        // selectedTripDetails remains null
      }
    }
  };

  const handleClosePanel = () => {
    setSelectedVehicleForPanel(null);
    setSelectedVehicleId(null);
    setSelectedTripDetails(null);
    setSelectedWaypointIndex(null);
  };

  const handleWaypointClick = (index) => setSelectedWaypointIndex(index);

  const handleSendAlert = async (e) => {
    e.preventDefault();
    if (selectedVehicleIds.length === 0)
      return toast.error("select at least one vehicle");
    if (!alertMessage.trim()) return toast.error("write a message first");
    setSending(true);
    try {
      await sendAlertApi({
        vehicleIds: selectedVehicleIds,
        message: alertMessage,
        alertType,
      });
      toast.success(`alert sent to ${selectedVehicleIds.length} vehicle(s)`);
      setAlertMessage("");
      setSelectedVehicleIds([]);
    } catch (err) {
      toast.error(err.response?.data?.msg || "could not send alert");
    } finally {
      setSending(false);
    }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    if (!newVehicle.plateNumber.trim())
      return toast.error("plate number is required");
    try {
      const payload = {
        plateNumber: newVehicle.plateNumber,
        vehicleType: newVehicle.vehicleType,
      };
      if (newVehicle.driverId) payload.driverId = newVehicle.driverId;
      const response = await addVehicleApi(payload);
      dispatch(setVehicles([...vehicles, response.data.vehicle]));
      toast.success("vehicle added");
      setNewVehicle({ plateNumber: "", vehicleType: "truck", driverId: "" });
    } catch (err) {
      toast.error(err.response?.data?.msg || "could not add vehicle");
    }
  };

  const handleInviteDriver = async (e) => {
    e.preventDefault();
    if (!newDriver.name.trim() || !newDriver.email.trim())
      return toast.error("name and email are required");
    try {
      const response = await inviteDriverApi(newDriver);
      toast.success(`invite sent to ${newDriver.email}`);
      console.log("invite link (dev mode):", response.data.inviteLink);
      setNewDriver({ name: "", email: "" });
      fetchDrivers();
    } catch (err) {
      toast.error(err.response?.data?.msg || "could not invite driver");
    }
  };

  const handleVehiclePhotoClick = (vehicleId) => {
    setPhotoTargetVehicleId(vehicleId);
    vehiclePhotoInputRef.current?.click();
  };

  const handleVehiclePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !photoTargetVehicleId) return;
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const response = await uploadVehiclePhotoApi(
        photoTargetVehicleId,
        formData,
      );
      dispatch(upsertVehicle(response.data.vehicle));
      toast.success("vehicle photo updated");
    } catch (err) {
      toast.error(err.response?.data?.msg || "could not upload vehicle photo");
    } finally {
      e.target.value = "";
      setPhotoTargetVehicleId(null);
    }
  };

  const openPlanModal = (vehicleId, plateNumber) => {
    setPlanVehicleId(vehicleId);
    setPlanVehiclePlate(plateNumber);
    setPlanOrigin(null);
    setPlanDestination(null);
    const now = new Date();
    now.setHours(now.getHours() + 2);
    setPlanDepartureTime(now.toISOString().slice(0, 16));
    setShowPlanModal(true);
  };

  const closePlanModal = () => {
    setShowPlanModal(false);
    setPlanVehicleId(null);
    setPlanVehiclePlate("");
    setPlanOrigin(null);
    setPlanDestination(null);
    setPlanning(false);
  };

  const handlePlanRoute = async () => {
    if (!planOrigin || !planDestination) {
      toast.error("Please select both origin and destination");
      return;
    }
    if (!planDepartureTime) {
      toast.error("Please select a departure time");
      return;
    }
    setPlanning(true);
    try {
      const payload = {
        origin: planOrigin,
        destination: planDestination,
        vehicleType: "car",
        departureTime: new Date(planDepartureTime).toISOString(),
        vehicleId: planVehicleId,
      };
      await planRouteApi(payload);
      toast.success(`Route planned for ${planVehiclePlate}!`);
      closePlanModal();
      const dashboardRes = await getFleetDashboardApi();
      setFleetWithTrips(dashboardRes.data.fleet);
      const statusRes = await getFleetStatusApi();
      dispatch(setVehicles(statusRes.data.vehicles));
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to plan route");
    } finally {
      setPlanning(false);
    }
  };

  // Determine if panel should be visible
  const showPanel = selectedVehicleForPanel && selectedTripDetails;

  return (
    <div style={styles.page}>
      {/* Stats */}
      <div style={styles.statsBar}>
        <StatCard label="Total Vehicles" value={stats.total} icon="🚚" />
        <StatCard
          label="On the Move"
          value={stats.active}
          icon="🟢"
          color={theme.accentGreen}
        />
        <StatCard
          label="Idle"
          value={stats.idle}
          icon="🟡"
          color={theme.accentOrange}
        />
        <StatCard
          label="Offline"
          value={stats.offline}
          icon="🔴"
          color={theme.accentRed}
        />
        <div style={styles.connectionDot}>
          <span
            style={{
              ...styles.dot,
              background: connected ? theme.accentGreen : theme.accentRed,
            }}
          />
          {connected ? "Real-time Tracking" : "Connecting…"}
        </div>
      </div>

      {/* Body with dynamic grid columns based on panel visibility */}
      <div
        style={{
          ...styles.body,
          gridTemplateColumns: showPanel
            ? "280px 320px 1fr 300px" // 4 columns: Sidebar | SlideOut | Map | Alerts
            : "280px 1fr 300px", // 3 columns: Sidebar | Map | Alerts
        }}
      >
        {/* Column 1: Sidebar */}
        <FleetSidebar
          search={search}
          setSearch={setSearch}
          filteredVehicles={filteredVehicles}
          selectedVehicleIds={selectedVehicleIds}
          toggleVehicleSelection={toggleVehicleSelection}
          selectedVehicleId={selectedVehicleId}
          handleVehicleSelect={handleVehicleSelect}
          handleVehiclePhotoClick={handleVehiclePhotoClick}
          openPlanModal={openPlanModal}
          showAddForms={showAddForms}
          setShowAddForms={setShowAddForms}
          newVehicle={newVehicle}
          setNewVehicle={setNewVehicle}
          handleAddVehicle={handleAddVehicle}
          drivers={drivers}
          newDriver={newDriver}
          setNewDriver={setNewDriver}
          handleInviteDriver={handleInviteDriver}
          vehiclePhotoInputRef={vehiclePhotoInputRef}
          handleVehiclePhotoChange={handleVehiclePhotoChange}
        />

        {/* Column 2: SlideOutPanel (only when showPanel is true) */}
        {showPanel && (
          <SlideOutPanel
            trip={{ ...selectedTripDetails, waypoints: filteredWaypoints }}
            vehicle={selectedVehicleForPanel}
            onClose={handleClosePanel}
            selectedWaypointIndex={selectedWaypointIndex}
            onWaypointSelect={handleWaypointClick}
          />
        )}

        {/* Column 3: Map */}
        <div style={styles.mapContainer}>
          {loadingDashboard ? (
            <div style={styles.placeholder}>
              Loading fleet routes & locations...
            </div>
          ) : (
            <MapContainer
              key="fleet-map"
              center={mapCenter}
              zoom={7}
              style={{ height: "100%", width: "100%", background: "#0a0e14" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />

              <div style={styles.layersControl}>
                <button
                  onClick={() => setShowRoutes(!showRoutes)}
                  style={{
                    ...styles.layerButton,
                    background: showRoutes
                      ? "rgba(16,185,129,0.9)"
                      : "rgba(30,41,59,0.8)",
                    borderColor: showRoutes ? "#10B981" : "#475569",
                  }}
                >
                  🗺️ {showRoutes ? "Hide Routes" : "Show Routes"}
                </button>
                <button
                  onClick={() => setShowLive(!showLive)}
                  style={{
                    ...styles.layerButton,
                    background: showLive
                      ? "rgba(37,99,235,0.9)"
                      : "rgba(30,41,59,0.8)",
                    borderColor: showLive ? "#3B82F6" : "#475569",
                  }}
                >
                  📍 {showLive ? "Hide Live" : "Show Live"}
                </button>
                <button
                  onClick={() => setShowWaypoints(!showWaypoints)}
                  style={{
                    ...styles.layerButton,
                    background: showWaypoints
                      ? "rgba(245,158,11,0.9)"
                      : "rgba(30,41,59,0.8)",
                    borderColor: showWaypoints ? "#F59E0B" : "#475569",
                  }}
                  disabled={!selectedVehicleId}
                >
                  🔍 {showWaypoints ? "Hide Details" : "Show Details"}
                  {selectedVehicleId ? "" : " (select vehicle)"}
                </button>
              </div>

              <FleetMapController
                mergedFleetData={mergedFleetData}
                vehiclesWithLocation={vehiclesWithLocation}
                showRoutes={showRoutes}
                showLive={showLive}
                selectedTripDetails={selectedTripDetails}
                showWaypoints={showWaypoints}
                selectedVehicleId={selectedVehicleId}
                selectedWaypointIndex={selectedWaypointIndex}
                onWaypointClick={handleWaypointClick}
              />
            </MapContainer>
          )}
        </div>

        {/* Column 4: Alerts Panel */}
        <div style={styles.alertsPanel}>
          <h3 style={styles.panelTitle}>⚠ Dispatch Alert</h3>
          <form onSubmit={handleSendAlert} style={styles.alertForm}>
            <label style={styles.alertLabel}>
              Type
              <select
                style={styles.miniInput}
                value={alertType}
                onChange={(e) => setAlertType(e.target.value)}
              >
                <option value="weather">Weather Warning</option>
                <option value="safety">Safety Instruction</option>
                <option value="general">General Message</option>
              </select>
            </label>
            <label style={styles.alertLabel}>
              Message
              <textarea
                style={{
                  ...styles.miniInput,
                  minHeight: "70px",
                  resize: "vertical",
                }}
                maxLength={200}
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                placeholder="Severe thunderstorm ahead, reduce speed…"
              />
            </label>
            <span style={styles.charCount}>
              {alertMessage.length} / 200 · {selectedVehicleIds.length}{" "}
              vehicle(s) selected
            </span>
            <button
              type="submit"
              disabled={sending}
              style={styles.sendAlertBtn}
            >
              {sending ? "Sending…" : "📨 Send Now"}
            </button>
          </form>

          <h3 style={{ ...styles.panelTitle, marginTop: "24px" }}>
            Recent Alerts
          </h3>
          <div style={styles.alertHistory}>
            {alerts.length === 0 && (
              <p style={styles.emptyText}>No alerts sent yet.</p>
            )}
            {alerts.map((a, i) => (
              <div key={i} style={styles.alertHistoryItem}>
                <div style={styles.alertHistoryMsg}>{a.message}</div>
                <div style={styles.alertHistoryMeta}>
                  {a.alertType} · {a.targetDriverIds?.length || 0} driver(s) ·{" "}
                  {new Date(a.sentAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Plan Route Modal */}
      <PlanRouteModal
        show={showPlanModal}
        onClose={closePlanModal}
        vehiclePlate={planVehiclePlate}
        origin={planOrigin}
        setOrigin={setPlanOrigin}
        destination={planDestination}
        setDestination={setPlanDestination}
        departureTime={planDepartureTime}
        setDepartureTime={setPlanDepartureTime}
        onPlan={handlePlanRoute}
        planning={planning}
      />
    </div>
  );
};

export default FleetDashboardPage;
