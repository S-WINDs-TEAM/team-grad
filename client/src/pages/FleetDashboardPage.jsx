import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import toast from 'react-hot-toast';
import useAuth from '../hooks/useAuth';
import useSocket from '../hooks/useSocket';
import {
    getFleetDashboardApi,
    getDriversApi,
    addVehicleApi,
    inviteDriverApi,
    sendAlertApi,
    uploadVehiclePhotoApi,
    getFleetStatusApi,
} from '../api/fleetApi';
import { planRouteApi, getTripByIdApi } from '../api/routeApi';
import { setVehicles, upsertVehicle } from '../store/fleetSlice';
import { getFleetStatusColor, getFleetStatusLabel } from '../utils/fleetColors';
import { theme } from '../styles/theme';
import LocationAutocomplete from '../components/LocationAutocomplete';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const vehicleIcon = (status) => L.divIcon({
    className: 'fleet-marker',
    html: `<div style="
        background-color:${getFleetStatusColor(status)};
        width:30px;height:30px;border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.35);
        font-size:15px;
    ">🚚</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
});

const getRiskPathColor = (riskLevel) => {
    switch (riskLevel) {
        case 'low': return '#10B981';
        case 'medium': return '#F59E0B';
        case 'high': return '#EF4444';
        default: return '#3B82F6';
    }
};

// ================================================================
// MapController - Handles all map drawing imperatively
// ================================================================
const MapController = ({
    mergedFleetData,
    vehiclesWithLocation,
    showRoutes,
    showLive,
    selectedTripDetails,
    showWaypoints,
    selectedVehicleId
}) => {
    const map = useMap();
    const layersRef = useRef({
        routes: [],
        markers: [],
        startEnd: [],
        waypoints: [],
        routeMarkers: [],
    });
    const prevSelectedRef = useRef(null);
    const prevShowRoutesRef = useRef(showRoutes);
    const prevShowLiveRef = useRef(showLive);
    const prevShowWaypointsRef = useRef(showWaypoints);

    useEffect(() => {
        // Clear old layers
        layersRef.current.routes.forEach(layer => map.removeLayer(layer));
        layersRef.current.markers.forEach(layer => map.removeLayer(layer));
        layersRef.current.startEnd.forEach(layer => map.removeLayer(layer));
        layersRef.current.waypoints.forEach(layer => map.removeLayer(layer));
        layersRef.current.routeMarkers.forEach(layer => map.removeLayer(layer));

        const newRoutes = [];
        const newMarkers = [];
        const newStartEnd = [];
        const newWaypoints = [];
        const newRouteMarkers = [];

        // ================================================================
        // 1. Draw Routes
        // ================================================================
        if (showRoutes) {
            mergedFleetData.forEach((item) => {
                const trip = item.todayTrip;
                if (!trip || !trip.routePolyline || trip.routePolyline.length === 0) return;

                const isSelected = item._id === selectedVehicleId;
                const riskColor = getRiskPathColor(trip.overallRiskLevel);
                const positions = trip.routePolyline.map(coord => [coord[0], coord[1]]);

                const polyline = L.polyline(positions, {
                    color: isSelected ? riskColor : '#F59E0B',
                    weight: isSelected ? 6 : 4,
                    opacity: isSelected ? 1 : 0.7,
                    lineJoin: 'round',
                    dashArray: isSelected ? null : '4, 6',
                }).addTo(map);

                newRoutes.push(polyline);

                // ================================================================
                // 1a. Draw Start/End markers for EVERY route
                // ================================================================
                if (trip.origin && trip.destination) {
                    const startIcon = L.divIcon({
                        className: 'route-start-marker',
                        html: `<div style="
                            background:#22c55e;
                            width:20px;height:20px;
                            border-radius:50%;
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            color:#fff;
                            font-weight:bold;
                            font-size:10px;
                            border:2px solid #fff;
                            box-shadow:0 2px 6px rgba(0,0,0,0.25);
                            opacity:${isSelected ? 1 : 0.6};
                        ">S</div>`,
                        iconSize: [20, 20],
                        iconAnchor: [10, 10],
                    });
                    const endIcon = L.divIcon({
                        className: 'route-end-marker',
                        html: `<div style="
                            background:#ef4444;
                            width:20px;height:20px;
                            border-radius:50%;
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            color:#fff;
                            font-weight:bold;
                            font-size:10px;
                            border:2px solid #fff;
                            box-shadow:0 2px 6px rgba(0,0,0,0.25);
                            opacity:${isSelected ? 1 : 0.6};
                        ">E</div>`,
                        iconSize: [20, 20],
                        iconAnchor: [10, 10],
                    });

                    const startMarker = L.marker([trip.origin.lat, trip.origin.lng], { icon: startIcon })
                        .addTo(map)
                        .bindPopup(`🚀 ${trip.origin.address || 'Start'}`);
                    const endMarker = L.marker([trip.destination.lat, trip.destination.lng], { icon: endIcon })
                        .addTo(map)
                        .bindPopup(`🏁 ${trip.destination.address || 'End'}`);

                    newRouteMarkers.push(startMarker, endMarker);
                }
            });
        }

        // ================================================================
        // 2. Draw Live Markers
        // ================================================================
        if (showLive) {
            vehiclesWithLocation.forEach((v) => {
                const isSelected = v._id === selectedVehicleId;
                const marker = L.marker(
                    [v.currentLocation.coordinates[1], v.currentLocation.coordinates[0]],
                    {
                        icon: vehicleIcon(v.status),
                        opacity: isSelected ? 1 : 0.6,
                    }
                ).addTo(map);

                const popupContent = `
                    ${v.photoUrl ? `<img src="http://localhost:5000${v.photoUrl}" style="width:100%;max-width:160px;border-radius:6px;margin-bottom:6px;" />` : ''}
                    <strong>${v.plateNumber}</strong><br />
                    ${v.driverId?.name || 'No driver'}<br />
                    Status: ${getFleetStatusLabel(v.status)}<br />
                    ${v.todayTrip ? `<span style="color:${getRiskPathColor(v.todayTrip.overallRiskLevel)}">Risk: ${v.todayTrip.overallRiskLevel.toUpperCase()}</span>` : ''}
                `;
                marker.bindPopup(popupContent);

                newMarkers.push(marker);
            });
        }

        // ================================================================
        // 3. Draw Start/End markers for selected trip (large ones)
        // ================================================================
        if (selectedVehicleId) {
            const selectedItem = mergedFleetData.find(item => item._id === selectedVehicleId);
            if (selectedItem && selectedItem.todayTrip) {
                const trip = selectedItem.todayTrip;
                const startIcon = L.divIcon({
                    className: 'custom-marker',
                    html: `<div style="background:#22c55e;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;font-size:12px;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,0.3);">S</div>`,
                    iconSize: [32, 32],
                    iconAnchor: [16, 16],
                });
                const endIcon = L.divIcon({
                    className: 'custom-marker',
                    html: `<div style="background:#ef4444;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;font-size:12px;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,0.3);">E</div>`,
                    iconSize: [32, 32],
                    iconAnchor: [16, 16],
                });

                const startMarker = L.marker([trip.origin.lat, trip.origin.lng], { icon: startIcon })
                    .addTo(map)
                    .bindPopup('🚀 Start Point');
                const endMarker = L.marker([trip.destination.lat, trip.destination.lng], { icon: endIcon })
                    .addTo(map)
                    .bindPopup('🏁 Destination');

                newStartEnd.push(startMarker, endMarker);
            }
        }

        // ================================================================
        // 4. Draw Waypoints
        // ================================================================
        if (selectedTripDetails && selectedVehicleId) {
            const allWaypoints = selectedTripDetails.waypoints || [];
            
            if (allWaypoints.length === 0) return;

            const createWaypointIcon = (index, riskLevel, isDetailed = false) => {
                const color = getRiskPathColor(riskLevel);
                const size = isDetailed ? 22 : 28;
                const fontSize = isDetailed ? 9 : 11;
                return L.divIcon({
                    className: 'waypoint-marker',
                    html: `<div style="
                        background-color:${color};
                        width:${size}px;height:${size}px;
                        border-radius:50%;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        color:#fff;
                        font-weight:bold;
                        font-size:${fontSize}px;
                        border:2px solid #fff;
                        box-shadow:0 2px 8px rgba(0,0,0,0.25);
                        ${isDetailed ? 'opacity:0.85;' : ''}
                    ">${index + 1}</div>`,
                    iconSize: [size, size],
                    iconAnchor: [size/2, size/2],
                });
            };

            let waypointsToShow = [];
            if (showWaypoints) {
                waypointsToShow = allWaypoints;
            } else {
                const totalDistance = allWaypoints[allWaypoints.length - 1]?.distanceFromStart || 0;
                const targetCount = Math.max(2, Math.ceil(totalDistance / 30));
                const step = Math.max(1, Math.floor(allWaypoints.length / targetCount));
                
                for (let i = 0; i < allWaypoints.length; i += step) {
                    waypointsToShow.push(allWaypoints[i]);
                }
                const last = allWaypoints[allWaypoints.length - 1];
                if (waypointsToShow[waypointsToShow.length - 1] !== last) {
                    waypointsToShow.push(last);
                }
            }

            waypointsToShow.forEach((wp, index) => {
                const riskColor = getRiskPathColor(wp.weather.riskLevel);
                const isDetailed = showWaypoints;
                const icon = createWaypointIcon(index, wp.weather.riskLevel, isDetailed);

                const marker = L.marker([wp.location.lat, wp.location.lng], { icon })
                    .addTo(map);

                const popupContent = `
                    <div style="min-width:200px;">
                        <strong>📍 KM ${Math.round(wp.distanceFromStart)}</strong><br />
                        <strong>ETA:</strong> ${new Date(wp.eta).toLocaleTimeString()}
                        <hr />
                        <strong>Weather:</strong> ${wp.weather.condition} (${wp.weather.description || ''})<br />
                        <strong>Temp:</strong> ${wp.weather.temperature}°C<br />
                        <strong>Wind:</strong> ${wp.weather.windSpeed} km/h<br />
                        <strong>Precip:</strong> ${wp.weather.precipitation} mm<br />
                        <strong>Visibility:</strong> ${wp.weather.visibility} km
                        <hr />
                        <strong>⚡ Max Safe Speed:</strong> ${wp.maxSafeSpeed} km/h
                        <br />
                        <span style="color:${riskColor};font-weight:bold;">
                            Risk: ${wp.weather.riskLevel.toUpperCase()}
                        </span>
                    </div>
                `;
                marker.bindPopup(popupContent);

                newWaypoints.push(marker);
            });
        }

        // Store new layers
        layersRef.current = { 
            routes: newRoutes, 
            markers: newMarkers, 
            startEnd: newStartEnd, 
            waypoints: newWaypoints,
            routeMarkers: newRouteMarkers,
        };

        // ================================================================
        // 5. Smart Focus - ONLY when selection changes, NOT on layer toggles
        // ================================================================
        const selectionChanged = prevSelectedRef.current !== selectedVehicleId;
        const routesToggled = prevShowRoutesRef.current !== showRoutes;
        const liveToggled = prevShowLiveRef.current !== showLive;
        const waypointsToggled = prevShowWaypointsRef.current !== showWaypoints;

        // Update refs for next comparison
        prevSelectedRef.current = selectedVehicleId;
        prevShowRoutesRef.current = showRoutes;
        prevShowLiveRef.current = showLive;
        prevShowWaypointsRef.current = showWaypoints;

        // Only focus when vehicle selection changes (not on layer toggles)
        if (selectionChanged) {
            if (selectedVehicleId) {
                const selectedItem = mergedFleetData.find(item => item._id === selectedVehicleId);
                if (selectedItem && selectedItem.todayTrip && selectedItem.todayTrip.routePolyline.length > 0) {
                    const positions = selectedItem.todayTrip.routePolyline.map(coord => [coord[0], coord[1]]);
                    const bounds = L.latLngBounds(positions);
                    map.flyToBounds(bounds, {
                        padding: [120, 120],
                        maxZoom: 10,
                        duration: 0.8,
                    });
                }
            } else {
                // Deselected - fit to all routes
                if (newRoutes.length > 0) {
                    const group = L.featureGroup(newRoutes);
                    map.flyToBounds(group.getBounds(), {
                        padding: [80, 80],
                        duration: 0.8,
                    });
                }
            }
        }

        return () => {
            layersRef.current.routes.forEach(layer => map.removeLayer(layer));
            layersRef.current.markers.forEach(layer => map.removeLayer(layer));
            layersRef.current.startEnd.forEach(layer => map.removeLayer(layer));
            layersRef.current.waypoints.forEach(layer => map.removeLayer(layer));
            layersRef.current.routeMarkers.forEach(layer => map.removeLayer(layer));
        };
    }, [map, mergedFleetData, vehiclesWithLocation, showRoutes, showLive, selectedTripDetails, showWaypoints, selectedVehicleId]);

    return null;
};

// ================================================================
// Main Component
// ================================================================
const FleetDashboardPage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user, logout } = useAuth();
    useSocket();

    const { vehicles, alerts, connected } = useSelector((state) => state.fleet);

    // States
    const [fleetWithTrips, setFleetWithTrips] = useState([]);
    const [loadingDashboard, setLoadingDashboard] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedVehicleIds, setSelectedVehicleIds] = useState([]);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('weather');
    const [sending, setSending] = useState(false);
    const [showAddForms, setShowAddForms] = useState(false);
    const [drivers, setDrivers] = useState([]);
    const [newVehicle, setNewVehicle] = useState({ plateNumber: '', vehicleType: 'truck', driverId: '' });
    const [newDriver, setNewDriver] = useState({ name: '', email: '' });

    // Layer Controls
    const [showRoutes, setShowRoutes] = useState(true);
    const [showLive, setShowLive] = useState(true);
    const [showWaypoints, setShowWaypoints] = useState(false);

    // Selection & Waypoints
    const [selectedVehicleId, setSelectedVehicleId] = useState(null);
    const [selectedTripDetails, setSelectedTripDetails] = useState(null);

    // Plan Route Modal
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [planVehicleId, setPlanVehicleId] = useState(null);
    const [planVehiclePlate, setPlanVehiclePlate] = useState('');
    const [planOrigin, setPlanOrigin] = useState(null);
    const [planDestination, setPlanDestination] = useState(null);
    const [planDepartureTime, setPlanDepartureTime] = useState('');
    const [planning, setPlanning] = useState(false);

    const vehiclePhotoInputRef = useRef(null);
    const [photoTargetVehicleId, setPhotoTargetVehicleId] = useState(null);

    // Effects
    useEffect(() => {
        if (user && user.role !== 'company_admin') {
            navigate('/home');
        }
    }, [user, navigate]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoadingDashboard(true);
                const dashboardRes = await getFleetDashboardApi();
                setFleetWithTrips(dashboardRes.data.fleet);

                const statusRes = await getFleetStatusApi();
                dispatch(setVehicles(statusRes.data.vehicles));

            } catch (err) {
                toast.error('Could not load fleet data');
            } finally {
                setLoadingDashboard(false);
            }
        };

        if (user?.role === 'company_admin') {
            fetchData();
            fetchDrivers();
        }
    }, [dispatch, user]);

    const fetchDrivers = async () => {
        try {
            const response = await getDriversApi();
            setDrivers(response.data.drivers);
        } catch (err) {}
    };

    // Computed Data
    const mergedFleetData = useMemo(() => {
        return vehicles.map((vehicle) => {
            const fleetItem = fleetWithTrips.find(f => f.vehicle.id === vehicle._id);
            return {
                ...vehicle,
                todayTrip: fleetItem?.todayTrip || null,
            };
        });
    }, [vehicles, fleetWithTrips]);

    const vehiclesWithLocation = useMemo(
        () => mergedFleetData.filter((v) => v.currentLocation?.coordinates?.some((c) => c !== 0)),
        [mergedFleetData]
    );

    const stats = useMemo(() => {
        const total = vehicles.length;
        const active = vehicles.filter((v) => v.status === 'active').length;
        const idle = vehicles.filter((v) => v.status === 'idle').length;
        const offline = vehicles.filter((v) => v.status === 'offline').length;
        return { total, active, idle, offline };
    }, [vehicles]);

    const filteredVehicles = useMemo(() => {
        if (!search.trim()) return mergedFleetData;
        const q = search.toLowerCase();
        return mergedFleetData.filter((v) =>
            v.plateNumber?.toLowerCase().includes(q) ||
            v.driverId?.name?.toLowerCase().includes(q)
        );
    }, [mergedFleetData, search]);

    const mapCenter = useMemo(() => {
        if (vehiclesWithLocation.length > 0) {
            const loc = vehiclesWithLocation[0].currentLocation.coordinates;
            return [loc[1], loc[0]];
        }
        const firstWithTrip = mergedFleetData.find(item => item.todayTrip !== null);
        if (firstWithTrip && firstWithTrip.todayTrip.routePolyline?.length > 0) {
            const mid = Math.floor(firstWithTrip.todayTrip.routePolyline.length / 2);
            const point = firstWithTrip.todayTrip.routePolyline[mid];
            return [point[0], point[1]];
        }
        return [30.0444, 31.2357];
    }, [vehiclesWithLocation, mergedFleetData]);

    // Handlers
    const toggleVehicleSelection = (id) => {
        setSelectedVehicleIds((prev) =>
            prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
        );
    };

    const handleVehicleSelect = async (vehicleId) => {
        if (selectedVehicleId === vehicleId) {
            setSelectedVehicleId(null);
            setSelectedTripDetails(null);
            return;
        }

        setSelectedVehicleId(vehicleId);

        const vehicle = mergedFleetData.find(v => v._id === vehicleId);
        if (vehicle && vehicle.todayTrip) {
            try {
                const response = await getTripByIdApi(vehicle.todayTrip.id);
                setSelectedTripDetails(response.data.trip);
            } catch (err) {
                toast.error('Could not load trip details');
                setSelectedTripDetails(null);
            }
        } else {
            setSelectedTripDetails(null);
        }
    };

    const handleSendAlert = async (e) => {
        e.preventDefault();
        if (selectedVehicleIds.length === 0) return toast.error('select at least one vehicle');
        if (!alertMessage.trim()) return toast.error('write a message first');

        setSending(true);
        try {
            await sendAlertApi({ vehicleIds: selectedVehicleIds, message: alertMessage, alertType });
            toast.success(`alert sent to ${selectedVehicleIds.length} vehicle(s)`);
            setAlertMessage('');
            setSelectedVehicleIds([]);
        } catch (err) {
            toast.error(err.response?.data?.msg || 'could not send alert');
        } finally {
            setSending(false);
        }
    };

    const handleAddVehicle = async (e) => {
        e.preventDefault();
        if (!newVehicle.plateNumber.trim()) return toast.error('plate number is required');
        try {
            const payload = { plateNumber: newVehicle.plateNumber, vehicleType: newVehicle.vehicleType };
            if (newVehicle.driverId) payload.driverId = newVehicle.driverId;
            const response = await addVehicleApi(payload);
            dispatch(setVehicles([...vehicles, response.data.vehicle]));
            toast.success('vehicle added');
            setNewVehicle({ plateNumber: '', vehicleType: 'truck', driverId: '' });
        } catch (err) {
            toast.error(err.response?.data?.msg || 'could not add vehicle');
        }
    };

    const handleInviteDriver = async (e) => {
        e.preventDefault();
        if (!newDriver.name.trim() || !newDriver.email.trim()) return toast.error('name and email are required');
        try {
            const response = await inviteDriverApi(newDriver);
            toast.success(`invite sent to ${newDriver.email}`);
            console.log('invite link (dev mode):', response.data.inviteLink);
            setNewDriver({ name: '', email: '' });
            fetchDrivers();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'could not invite driver');
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
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
            formData.append('photo', file);
            const response = await uploadVehiclePhotoApi(photoTargetVehicleId, formData);
            dispatch(upsertVehicle(response.data.vehicle));
            toast.success('vehicle photo updated');
        } catch (err) {
            toast.error(err.response?.data?.msg || 'could not upload vehicle photo');
        } finally {
            e.target.value = '';
            setPhotoTargetVehicleId(null);
        }
    };

    // Plan Route Handlers
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
        setPlanVehiclePlate('');
        setPlanOrigin(null);
        setPlanDestination(null);
        setPlanning(false);
    };

    const handlePlanRoute = async () => {
        if (!planOrigin || !planDestination) {
            toast.error('Please select both origin and destination');
            return;
        }

        if (!planDepartureTime) {
            toast.error('Please select a departure time');
            return;
        }

        setPlanning(true);
        try {
            const payload = {
                origin: planOrigin,
                destination: planDestination,
                vehicleType: 'car',
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
            toast.error(err.response?.data?.msg || 'Failed to plan route');
        } finally {
            setPlanning(false);
        }
    };

    // ================================================================
    // Render
    // ================================================================
    return (
        <div style={styles.page}>
            {/* Header */}
            <header style={styles.header}>
                <div style={styles.logo}>
                    <span style={styles.logoIcon}>◈</span>
                    <span style={styles.logoText}>S-WINDs</span>
                    <span style={styles.logoSubtext}>Fleet Management</span>
                </div>
                <div style={styles.headerRight}>
                    <span style={styles.userName}>{user?.name} · Admin</span>
                    <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
                </div>
            </header>

            {/* Stats */}
            <div style={styles.statsBar}>
                <StatCard label="Total Vehicles" value={stats.total} icon="🚚" />
                <StatCard label="On the Move" value={stats.active} icon="🟢" color={theme.accentGreen} />
                <StatCard label="Idle" value={stats.idle} icon="🟡" color={theme.accentOrange} />
                <StatCard label="Offline" value={stats.offline} icon="🔴" color={theme.accentRed} />
                <div style={styles.connectionDot}>
                    <span style={{
                        ...styles.dot,
                        background: connected ? theme.accentGreen : theme.accentRed,
                    }} />
                    {connected ? 'Real-time Tracking' : 'Connecting…'}
                </div>
            </div>

            {/* Body */}
            <div style={styles.body}>
                {/* Sidebar */}
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
                        style={{ display: 'none' }}
                    />

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

                {/* Map */}
                <div style={styles.mapContainer}>
                    {loadingDashboard ? (
                        <div style={styles.placeholder}>Loading fleet routes & locations...</div>
                    ) : (
                        <MapContainer
                            key="fleet-map"
                            center={mapCenter}
                            zoom={7}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />

                            {/* Layer Control Buttons */}
                            <div style={styles.layersControl}>
                                <button
                                    onClick={() => setShowRoutes(!showRoutes)}
                                    style={{
                                        ...styles.layerButton,
                                        background: showRoutes ? 'rgba(16, 185, 129, 0.9)' : 'rgba(30, 41, 59, 0.8)',
                                        borderColor: showRoutes ? '#10B981' : '#475569',
                                    }}
                                >
                                    🗺️ {showRoutes ? 'Hide Routes' : 'Show Routes'}
                                </button>
                                <button
                                    onClick={() => setShowLive(!showLive)}
                                    style={{
                                        ...styles.layerButton,
                                        background: showLive ? 'rgba(37, 99, 235, 0.9)' : 'rgba(30, 41, 59, 0.8)',
                                        borderColor: showLive ? '#3B82F6' : '#475569',
                                    }}
                                >
                                    📍 {showLive ? 'Hide Live' : 'Show Live'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowWaypoints(!showWaypoints);
                                    }}
                                    style={{
                                        ...styles.layerButton,
                                        background: showWaypoints ? 'rgba(245, 158, 11, 0.9)' : 'rgba(30, 41, 59, 0.8)',
                                        borderColor: showWaypoints ? '#F59E0B' : '#475569',
                                    }}
                                    disabled={!selectedVehicleId}
                                >
                                    🔍 {showWaypoints ? 'Hide Details' : 'Show Details'}
                                    {selectedVehicleId ? '' : ' (select vehicle)'}
                                </button>
                            </div>

                            {/* MapController draws everything */}
                            <MapController
                                key={`map-controller-${selectedVehicleId}-${showWaypoints}`}
                                mergedFleetData={mergedFleetData}
                                vehiclesWithLocation={vehiclesWithLocation}
                                showRoutes={showRoutes}
                                showLive={showLive}
                                selectedTripDetails={selectedTripDetails}
                                showWaypoints={showWaypoints}
                                selectedVehicleId={selectedVehicleId}
                            />
                        </MapContainer>
                    )}
                </div>

                {/* Alerts Panel */}
                <div style={styles.alertsPanel}>
                    <h3 style={styles.panelTitle}>⚠ Dispatch Alert</h3>
                    <form onSubmit={handleSendAlert} style={styles.alertForm}>
                        <label style={styles.alertLabel}>
                            Type
                            <select style={styles.miniInput} value={alertType} onChange={(e) => setAlertType(e.target.value)}>
                                <option value="weather">Weather Warning</option>
                                <option value="safety">Safety Instruction</option>
                                <option value="general">General Message</option>
                            </select>
                        </label>
                        <label style={styles.alertLabel}>
                            Message
                            <textarea
                                style={{ ...styles.miniInput, minHeight: '70px', resize: 'vertical' }}
                                maxLength={200}
                                value={alertMessage}
                                onChange={(e) => setAlertMessage(e.target.value)}
                                placeholder="Severe thunderstorm ahead, reduce speed…"
                            />
                        </label>
                        <span style={styles.charCount}>{alertMessage.length} / 200 · {selectedVehicleIds.length} vehicle(s) selected</span>
                        <button type="submit" disabled={sending} style={styles.sendAlertBtn}>
                            {sending ? 'Sending…' : '📨 Send Now'}
                        </button>
                    </form>

                    <h3 style={{ ...styles.panelTitle, marginTop: '24px' }}>Recent Alerts</h3>
                    <div style={styles.alertHistory}>
                        {alerts.length === 0 && <p style={styles.emptyText}>No alerts sent yet.</p>}
                        {alerts.map((a, i) => (
                            <div key={i} style={styles.alertHistoryItem}>
                                <div style={styles.alertHistoryMsg}>{a.message}</div>
                                <div style={styles.alertHistoryMeta}>
                                    {a.alertType} · {a.targetDriverIds?.length || 0} driver(s) · {new Date(a.sentAt).toLocaleTimeString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Plan Route Modal */}
            {showPlanModal && (
                <div style={styles.modalOverlay} onClick={closePlanModal}>
                    <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h3 style={styles.modalTitle}>Plan Route for {planVehiclePlate}</h3>
                            <button style={styles.modalClose} onClick={closePlanModal}>✕</button>
                        </div>

                        <div style={styles.modalBody}>
                            <LocationAutocomplete
                                label="Departure Location"
                                placeholder="Type a city or address..."
                                onSelect={setPlanOrigin}
                            />

                            <LocationAutocomplete
                                label="Destination Location"
                                placeholder="Type a city or address..."
                                onSelect={setPlanDestination}
                            />

                            <div style={styles.field}>
                                <label style={styles.label}>Departure Time</label>
                                <input
                                    style={styles.input}
                                    type="datetime-local"
                                    value={planDepartureTime}
                                    onChange={(e) => setPlanDepartureTime(e.target.value)}
                                />
                            </div>

                            <button
                                style={styles.modalSubmitBtn}
                                onClick={handlePlanRoute}
                                disabled={planning}
                            >
                                {planning ? 'Planning...' : '🗺️ Calculate Route'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ label, value, icon, color }) => (
    <div style={styles.statCard}>
        <span style={styles.statIcon}>{icon}</span>
        <div>
            <div style={{ ...styles.statValue, color: color || theme.textPrimary }}>{value}</div>
            <div style={styles.statLabel}>{label}</div>
        </div>
    </div>
);

const styles = {
    page: { minHeight: '100vh', background: theme.bgPrimary, display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif' },

    header: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 24px', borderBottom: `1px solid ${theme.borderDefault}`,
    },
    logo: { display: 'flex', alignItems: 'center', gap: '10px' },
    logoIcon: { fontSize: '20px', color: theme.accentBlue },
    logoText: { fontSize: '18px', fontWeight: '700', color: theme.textPrimary },
    logoSubtext: { fontSize: '12px', color: theme.textMuted, marginLeft: '4px' },
    headerRight: { display: 'flex', alignItems: 'center', gap: '16px' },
    userName: { fontSize: '13px', color: theme.textSecondary },
    logoutBtn: {
        padding: '8px 14px', background: 'transparent', border: `1px solid ${theme.borderDefault}`,
        borderRadius: '8px', color: theme.textSecondary, fontSize: '13px', cursor: 'pointer',
    },

    statsBar: {
        display: 'flex', gap: '16px', padding: '16px 24px',
        borderBottom: `1px solid ${theme.borderDefault}`, alignItems: 'center', flexWrap: 'wrap',
    },
    statCard: {
        display: 'flex', alignItems: 'center', gap: '10px',
        background: theme.bgSecondary, border: `1px solid ${theme.borderDefault}`,
        borderRadius: '12px', padding: '10px 16px',
    },
    statIcon: { fontSize: '18px' },
    statValue: { fontSize: '18px', fontWeight: '700' },
    statLabel: { fontSize: '11px', color: theme.textMuted },
    connectionDot: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: theme.textSecondary },
    dot: { width: '8px', height: '8px', borderRadius: '50%' },

    body: { flex: 1, display: 'grid', gridTemplateColumns: '280px 1fr 320px', minHeight: 0 },

    sidebar: { borderRight: `1px solid ${theme.borderDefault}`, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' },
    searchInput: {
        width: '100%', padding: '10px 12px', background: theme.bgTertiary,
        border: `1px solid ${theme.borderDefault}`, borderRadius: '10px', color: theme.textPrimary,
        fontSize: '13px', outline: 'none', boxSizing: 'border-box',
    },
    vehicleList: { display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 },
    vehicleItem: {
        display: 'flex', alignItems: 'center', gap: '10px', padding: '10px',
        background: theme.bgSecondary, border: `1px solid ${theme.borderDefault}`,
        borderRadius: '10px', cursor: 'pointer',
        transition: 'all 0.2s ease',
        ':hover': {
            background: 'rgba(255,255,255,0.05)',
        },
    },
    checkbox: { accentColor: theme.accentBlue },
    vehicleThumbWrap: {
        width: '28px', height: '28px', borderRadius: '6px', overflow: 'hidden',
        background: theme.bgTertiary, border: `1px solid ${theme.borderDefault}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
    },
    vehicleThumbImg: { width: '100%', height: '100%', objectFit: 'cover' },
    vehicleThumbPlaceholder: { fontSize: '13px' },
    vehiclePlate: { fontSize: '13px', fontWeight: '600', color: theme.textPrimary },
    vehicleDriver: { fontSize: '11px', color: theme.textMuted },
    statusBadge: { fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' },
    emptyText: { fontSize: '12px', color: theme.textMuted, textAlign: 'center', padding: '12px' },

    planRouteBtn: {
        background: 'transparent',
        border: '1px solid rgba(37, 99, 235, 0.3)',
        borderRadius: '6px',
        padding: '4px 8px',
        color: '#fff',
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        ':hover': {
            background: 'rgba(37, 99, 235, 0.2)',
            borderColor: '#2563EB',
        },
    },

    toggleFormsBtn: {
        padding: '10px', background: 'transparent', border: `1px dashed ${theme.borderDefault}`,
        borderRadius: '10px', color: theme.accentBlue, fontSize: '12px', cursor: 'pointer',
    },
    formsBlock: { display: 'flex', flexDirection: 'column', gap: '12px' },
    miniForm: {
        display: 'flex', flexDirection: 'column', gap: '8px',
        background: theme.bgTertiary, border: `1px solid ${theme.borderDefault}`,
        borderRadius: '10px', padding: '12px',
    },
    miniFormTitle: { fontSize: '11px', fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase' },
    miniInput: {
        width: '100%', padding: '8px 10px', background: theme.bgPrimary,
        border: `1px solid ${theme.borderDefault}`, borderRadius: '8px', color: theme.textPrimary,
        fontSize: '12px', outline: 'none', boxSizing: 'border-box',
    },
    miniBtn: {
        padding: '9px', background: theme.accentBlue, color: '#fff', border: 'none',
        borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
    },

    mapContainer: { position: 'relative', minHeight: '300px' },
    placeholder: {
        width: '100%',
        height: '100%',
        background: '#11151c',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#8a93a3',
        fontSize: '0.9rem',
    },

    alertsPanel: { borderLeft: `1px solid ${theme.borderDefault}`, padding: '16px', overflowY: 'auto' },
    panelTitle: { fontSize: '14px', fontWeight: '700', color: theme.textPrimary, margin: '0 0 12px' },
    alertForm: { display: 'flex', flexDirection: 'column', gap: '10px' },
    alertLabel: { display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: theme.textSecondary },
    charCount: { fontSize: '11px', color: theme.textMuted },
    sendAlertBtn: {
        padding: '12px', background: theme.accentRed, color: '#fff', border: 'none',
        borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
    },
    alertHistory: { display: 'flex', flexDirection: 'column', gap: '8px' },
    alertHistoryItem: {
        background: theme.bgSecondary, border: `1px solid ${theme.borderDefault}`,
        borderRadius: '10px', padding: '10px',
    },
    alertHistoryMsg: { fontSize: '12px', color: theme.textPrimary, marginBottom: '4px' },
    alertHistoryMeta: { fontSize: '10px', color: theme.textMuted },

    layersControl: {
        position: 'absolute',
        top: '12px',
        right: '12px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        pointerEvents: 'none',
    },
    layerButton: {
        pointerEvents: 'auto',
        padding: '6px 12px',
        borderRadius: '8px',
        border: '1px solid',
        color: '#fff',
        fontSize: '11px',
        fontWeight: '600',
        cursor: 'pointer',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        fontFamily: 'system-ui, sans-serif',
        transition: 'all 0.2s ease',
        textAlign: 'center',
        minWidth: '130px',
        ':disabled': {
            opacity: 0.4,
            cursor: 'not-allowed',
        },
        ':hover:not(:disabled)': {
            transform: 'scale(1.05)',
        },
    },

    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modal: {
        background: theme.bgSecondary,
        border: `1px solid ${theme.borderDefault}`,
        borderRadius: '16px',
        padding: '24px',
        width: '100%',
        maxWidth: '480px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    },
    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
    },
    modalTitle: {
        fontSize: '18px',
        fontWeight: '700',
        color: theme.textPrimary,
        margin: 0,
    },
    modalClose: {
        background: 'transparent',
        border: 'none',
        color: theme.textMuted,
        fontSize: '18px',
        cursor: 'pointer',
        padding: '4px 8px',
        borderRadius: '4px',
        ':hover': {
            background: 'rgba(255,255,255,0.05)',
        },
    },
    modalBody: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
    field: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
    },
    label: {
        fontSize: '13px',
        fontWeight: '500',
        color: theme.textSecondary,
    },
    input: {
        width: '100%',
        padding: '10px 12px',
        background: theme.bgTertiary,
        border: `1px solid ${theme.borderDefault}`,
        borderRadius: '8px',
        color: theme.textPrimary,
        fontSize: '14px',
        outline: 'none',
        boxSizing: 'border-box',
    },
    modalSubmitBtn: {
        padding: '12px',
        background: theme.accentBlue,
        color: '#fff',
        border: 'none',
        borderRadius: '10px',
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer',
        marginTop: '8px',
        transition: 'opacity 0.2s',
        ':hover': {
            opacity: 0.9,
        },
        ':disabled': {
            opacity: 0.6,
            cursor: 'not-allowed',
        },
    },
};

export default FleetDashboardPage;