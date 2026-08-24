import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { interpretWeather } from '../../utils/riskTranslator';
import { getFleetStatusColor, getFleetStatusLabel } from '../../utils/fleetColors';
import { getRiskPathColor } from '../../utils/riskColors';

// Vehicle icon definition
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

const FleetMapController = ({
    mergedFleetData,
    vehiclesWithLocation,
    showRoutes,
    showLive,
    selectedTripDetails,
    showWaypoints,
    selectedVehicleId,
    selectedWaypointIndex,
    onWaypointClick,
    hazardFocus,
    alternatePreview,
}) => {
    const map = useMap();
    const layersRef = useRef({
        routes: [],
        markers: [],
        startEnd: [],
        waypoints: [],
        routeMarkers: [],
        focus: [],
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

        // 
        // 1. Draw Routes
        // 
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

                // Start/End markers for EVERY route
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

                // FIXED: when the Routes layer is hidden, still draw the SELECTED
        // vehicle's route so its waypoints never look like disconnected dots.
        if (!showRoutes && selectedVehicleId) {
            const selectedItem = mergedFleetData.find(item => item._id === selectedVehicleId);
            const selTrip = selectedItem?.todayTrip;
            if (selTrip && selTrip.routePolyline && selTrip.routePolyline.length > 0) {
                const riskColor = getRiskPathColor(selTrip.overallRiskLevel);
                const positions = selTrip.routePolyline.map(coord => [coord[0], coord[1]]);
                const polyline = L.polyline(positions, {
                    color: riskColor, weight: 6, opacity: 1, lineJoin: 'round',
                }).addTo(map);
                newRoutes.push(polyline);
            }
        }
        // 
        // 2. Draw Live Markers
        // 
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

        // 
        // 3. Draw Start/End markers for selected trip (large ones)
        // 
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

        // 
        // 4. Draw Waypoints with interpretation and highlight
        // 
        if (selectedTripDetails && selectedVehicleId) {
            const allWaypoints = selectedTripDetails.waypoints || [];
            if (allWaypoints.length === 0) return;

            // Helper: Create waypoint icon with highlight support
            const createWaypointIcon = (index, riskLevel, isDetailed = false) => {
                const color = getRiskPathColor(riskLevel);
                const size = isDetailed ? 22 : 28;
                const fontSize = isDetailed ? 9 : 11;
                const isHighlighted = selectedWaypointIndex === index;

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
                        border:${isHighlighted ? '3px solid #3B82F6' : '2px solid #fff'};
                        box-shadow:0 2px 8px rgba(0,0,0,0.25);
                        ${isDetailed ? 'opacity:0.85;' : ''}
                        ${isHighlighted ? 'box-shadow: 0 0 16px rgba(59, 130, 246, 0.7);' : ''}
                    ">${index + 1}</div>`,
                    iconSize: [size, size],
                    iconAnchor: [size/2, size/2],
                });
            };

            // Determine which waypoints to show (30km or 5km)
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

            // Draw each waypoint
            waypointsToShow.forEach((wp, index) => {
                const riskColor = getRiskPathColor(wp.weather?.riskLevel);
                const isDetailed = showWaypoints;
                const icon = createWaypointIcon(index, wp.weather?.riskLevel, isDetailed);

                const marker = L.marker([wp.location.lat, wp.location.lng], { icon })
                    .addTo(map);

                // Click handler to sync with sidebar
                marker.on('click', () => {
                    if (onWaypointClick) onWaypointClick(index);
                });

                // Build popup with interpreted weather
                let summary = '';
                let recommendation = '';
                if (wp.weather) {
                    const interpretation = interpretWeather(
                        wp.weather,
                        selectedTripDetails?.vehicleType || 'car',
                        'medium'
                    );
                    summary = interpretation.summary;
                    recommendation = interpretation.recommendation;
                }

                const popupContent = `
                    <div style="min-width:220px;">
                        <strong>📍 KM ${Math.round(wp.distanceFromStart || 0)}</strong><br />
                        <strong>ETA:</strong> ${new Date(wp.eta).toLocaleTimeString()}
                        <hr />
                        ${summary ? `<p style="font-size:13px; color:#e5e7eb; margin:4px 0;">${summary}</p>` : ''}
                        ${recommendation ? `<p style="font-size:12px; color:#10b981; margin:4px 0;"><strong>✅ Recommendation:</strong> ${recommendation}</p>` : ''}
                        <hr />
                        <div style="font-size:10px; color:#9ca3af; margin-top:4px;">
                            <strong>Weather:</strong> ${wp.weather?.condition || 'N/A'} (${wp.weather?.description || ''})<br />
                            <strong>Temp:</strong> ${wp.weather?.temperature ?? 'N/A'}°C &nbsp;|&nbsp; <strong>Wind:</strong> ${wp.weather?.windSpeed ?? 'N/A'} km/h<br />
                            <strong>Precip:</strong> ${wp.weather?.precipitation ?? 'N/A'} mm &nbsp;|&nbsp; <strong>Visibility:</strong> ${wp.weather?.visibility ?? 'N/A'} km
                        </div>
                        <hr />
                        <strong>⚡ Max Safe Speed:</strong> ${wp.maxSafeSpeed || 'N/A'} km/h
                        <br />
                        <span style="color:${riskColor};font-weight:bold;">
                            Risk: ${wp.weather?.riskLevel?.toUpperCase() || 'N/A'}
                        </span>
                    </div>
                `;
                marker.bindPopup(popupContent);

                newWaypoints.push(marker);
            });
        }

        // Store layers
        layersRef.current = {
            ...layersRef.current,
            routes: newRoutes,
            markers: newMarkers,
            startEnd: newStartEnd,
            waypoints: newWaypoints,
            routeMarkers: newRouteMarkers,
        };

        // 
        // 5. Smart Focus - only when selection changes
        // 
        const selectionChanged = prevSelectedRef.current !== selectedVehicleId;
        const routesToggled = prevShowRoutesRef.current !== showRoutes;
        const liveToggled = prevShowLiveRef.current !== showLive;
        const waypointsToggled = prevShowWaypointsRef.current !== showWaypoints;

        prevSelectedRef.current = selectedVehicleId;
        prevShowRoutesRef.current = showRoutes;
        prevShowLiveRef.current = showLive;
        prevShowWaypointsRef.current = showWaypoints;

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
    }, [map, mergedFleetData, vehiclesWithLocation, showRoutes, showLive, selectedTripDetails, showWaypoints, selectedVehicleId, selectedWaypointIndex, onWaypointClick]);

    // Hazard focus marker + alternate preview + zoom to danger
    useEffect(() => {
        (layersRef.current.focus || []).forEach(layer => map.removeLayer(layer));
        const focusLayers = [];

        if (alternatePreview?.polyline?.length) {
            const line = L.polyline(alternatePreview.polyline, {
                color: '#F59E0B', weight: 5, opacity: 0.9, dashArray: '10, 10',
            }).addTo(map).bindPopup('Proposed alternate route');
            focusLayers.push(line);
        }

        if (hazardFocus) {
            const icon = L.divIcon({
                className: 'hazard-marker',
                html: `<div style="width:18px;height:18px;background:#EF4444;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 8px rgba(239,68,68,0.35);"></div>`,
                iconSize: [18, 18],
                iconAnchor: [9, 9],
            });
            const m = L.marker([hazardFocus.lat, hazardFocus.lng], { icon })
                .addTo(map).bindPopup('Weather hazard location');
            focusLayers.push(m);
            map.flyTo([hazardFocus.lat, hazardFocus.lng], 10, { duration: 0.8 });
        }

        layersRef.current.focus = focusLayers;
        return () => { focusLayers.forEach(layer => map.removeLayer(layer)); };
    }, [hazardFocus, alternatePreview, map]);

    return null;
};

export default FleetMapController;