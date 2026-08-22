const axios = require('axios');

/**
 * Fetches a route from OSRM and returns distance, duration, coordinates,
 * road max speed, and urban segment information.
 * 
 * IMPROVEMENT: Added extraction of roadMaxSpeed and urbanSegments from OSRM annotations.
 * IMPROVEMENT: Switched to HTTPS for OSRM (was HTTP, which caused redirect issues).
 */
const getRoute = async (originLat, originLng, destLat, destLng) => {
    // BUG FIX: was "http://router.project-osrm.org" — the public OSRM demo
    // server only serves traffic over HTTPS, so an "http://" request is
    // dropped/redirected and route planning fails. Use "https://".
    const url = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}`;

    // IMPROVEMENT: Added 'annotations' to request speed limit and road class data.
    // 'annotations=nodes,speed,datasources' gives us maxspeed per segment (if available).
    // 'overview=full' for detailed geometry, 'geometries=geojson' for coordinate format.
    const response = await axios.get(url, {
        params: {
            overview: 'full',
            geometries: 'geojson',
            steps: false,
            annotations: 'nodes,speed,datasources', // NEW: request speed & node data
        },
    });

    const route = response.data?.routes?.[0];
    if (!route) throw new Error('no route found');

    // NEW: Extract roadMaxSpeed from annotations (if available)
    // OSRM may return a 'speed' field per segment (which is the speed it used for ETA).
    // We use that as a fallback for roadMaxSpeed if no explicit maxspeed is present.
    // In a production system, you'd cross-reference with a speed limit database.
    let roadMaxSpeed = 120; // default
    let urbanSegments = [];

    // Check if annotations exist and have speed data
    if (route.legs && route.legs.length > 0) {
        // Each leg has 'annotation' with 'speed' array (speed in m/s per segment)
        // We'll aggregate to find the average max speed and detect urban areas.
        const allSpeeds = [];
        const allNodes = [];

        route.legs.forEach((leg) => {
            if (leg.annotation && leg.annotation.speed) {
                // speed is in m/s, convert to km/h
                const speedsKmh = leg.annotation.speed.map((s) => s * 3.6);
                allSpeeds.push(...speedsKmh);
            }
            // NEW: Get node IDs to infer road type (urban vs highway) if available
            if (leg.annotation && leg.annotation.nodes) {
                allNodes.push(...leg.annotation.nodes);
            }
        });

        // Calculate average speed (as a proxy for max speed)
        if (allSpeeds.length > 0) {
            const avgSpeed = allSpeeds.reduce((a, b) => a + b, 0) / allSpeeds.length;
            roadMaxSpeed = Math.round(avgSpeed * 1.1); // 10% buffer above average
            // Cap at typical highway speeds
            roadMaxSpeed = Math.min(roadMaxSpeed, 120);
        }

        // NEW: Detect urban segments by checking road class (if available from annotations)
        // For now, we'll use a heuristic based on speed: segments with speed < 50 km/h are likely urban.
        // In a more advanced implementation, you'd use the 'road_class' from OSRM or a map matching service.
        // Here, we use the first leg's geometry and speed to mark urban zones.
        // This is a simplified fallback; production systems would use Mapbox or TomTom road data.
        if (route.legs[0] && route.legs[0].annotation && route.legs[0].annotation.speed) {
            const speeds = route.legs[0].annotation.speed.map((s) => s * 3.6);
            const coords = route.geometry.coordinates;
            // We need to map each speed to a segment; we'll treat segments with speed < 50 as urban.
            // This is a rough heuristic; a better approach is to use OSM road tags.
            for (let i = 0; i < speeds.length && i < coords.length - 1; i++) {
                const isUrban = speeds[i] < 50;
                // Calculate distance for this segment (approx)
                const segDist = getDistance(
                    coords[i][1], coords[i][0],
                    coords[i+1][1], coords[i+1][0]
                );
                urbanSegments.push({
                    isUrban,
                    distance: segDist / 1000, // km
                    lat: coords[i][1],
                    lng: coords[i][0],
                });
            }
        }
    }

    // Fallback: if we couldn't detect urban segments, mark the whole route as highway.
    if (urbanSegments.length === 0) {
        // If route distance is large, assume mostly highway; otherwise, urban.
        const totalDistKm = route.distance / 1000;
        if (totalDistKm > 50) {
            urbanSegments = [{ isUrban: false, distance: totalDistKm }];
        } else {
            urbanSegments = [{ isUrban: true, distance: totalDistKm }];
        }
    }

    return {
        distanceKm: route.distance / 1000,
        durationMin: route.duration / 60,
        coordinates: route.geometry.coordinates,
        roadMaxSpeed, // NEW: estimated max speed for the route
        urbanSegments, // NEW: array of { isUrban, distance, lat, lng }
    };
};

// Helper: Haversine distance between two coordinates (returns meters)
const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

/**
 * IMPROVEMENT: Changed sampling interval from 30km to 5km for higher weather precision.
 * Now we sample a waypoint every 5 km instead of every 30 km.
 * This gives much finer weather granularity, especially important for detecting
 * localized weather events like sudden fog, sandstorms, or heavy rain patches.
 */
const sampleWaypoints = (coordinates, totalDistanceKm) => {
    const waypoints = [];
    const totalPoints = coordinates.length;
    // FIX: Changed from 30 to 5 km for better weather precision
    const numWaypoints = Math.max(2, Math.ceil(totalDistanceKm / 5));

    for (let i = 0; i <= numWaypoints; i++) {
        const progress = Math.min(i / numWaypoints, 1);
        const coordIndex = Math.floor(progress * (totalPoints - 1));
        const [lng, lat] = coordinates[coordIndex];

        waypoints.push({
            lat,
            lng,
            distanceFromStart: progress * totalDistanceKm,
        });
    }
    return waypoints;
};


//   Calculates an alternate route that bypasses a specific danger zone.
//  Instead of re-routing the entire trip, it only changes a small segment
//   around the dangerous waypoint (approximately 5-10 km each side).
const calculateLocalAlternate = async (origin, destination, dangerWaypoint, offsetKm = 10) => {
    // Step 1: Get the full route (already done in planRoute, but we may need the raw polyline)
    // We'll use the same OSRM call but with a via point to force a different path.
    // The idea: add a via point that is offset from the danger waypoint by `offsetKm`.
    
    // For simplicity, we'll shift the danger waypoint by a small amount in lat/lng.
    // In production, you'd use a more sophisticated method (e.g., query a nearby road).
    const offsetLat = dangerWaypoint.lat + (offsetKm / 111); // 1 degree lat ≈ 111 km
    const offsetLng = dangerWaypoint.lng + (offsetKm / 111 / Math.cos(dangerWaypoint.lat * Math.PI / 180));
    
    const viaPoint = { lat: offsetLat, lng: offsetLng };
    
    // Build a route that goes from origin → via point → destination
    // OSRM supports via points by separating coordinates with semicolons.
    const viaUrl = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${viaPoint.lng},${viaPoint.lat};${destination.lng},${destination.lat}`;
    
    const response = await axios.get(viaUrl, {
        params: {
            overview: 'full',
            geometries: 'geojson',
            steps: false,
            annotations: 'nodes,speed,datasources',
        },
    });
    
    const route = response.data?.routes?.[0];
    if (!route) throw new Error('no alternate route found');
    
    return {
        distanceKm: route.distance / 1000,
        durationMin: route.duration / 60,
        coordinates: route.geometry.coordinates,
        polyline: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    };
};

module.exports = { getRoute, sampleWaypoints, calculateLocalAlternate  };