const Trip = require('../models/Trip');

const {getRoute, sampleWaypoints} = require('../services/mapService');
const {getWeatherForLocationAndTime} = require('../services/weatherService');
const {calculatemaxSafeSpeed, calculateRiskLevel} = require('../utils/geoUtils');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms)); // make a delay for api limitation per sec

const planRoute = async (req, res, next) => {
    try{

        const {origin, destination, vehicleType, departureTime} = req.body;
        const departure = departureTime ? new Date(departureTime) : new Date();

        const vType = vehicleType || 'car';

        const route = await getRoute(
            origin.lat, origin.lng,
            destination.lat, destination.lng
        );

        // const rawWaypoints = sampleWaypoints(
        //     route.coordinates,
        //     route.durationMin,
        //     route.distanceKm,
        //     departure
        // );

        const rawWaypoints = sampleWaypoints(route.coordinates, route.distanceKm );


        // const waypointsWithWeather = await Promise.all(
        //     rawWaypoints.map(async(wp)=> {
        //         const weather = await getWeatherForLocationAndTime(wp.lat, wp.lng, wp.eta);
        //         const maxSafeSpeed = calculatemaxSafeSpeed(weather, vehicleType|| 'car');
        //         const riskLevel = calculateRiskLevel(weather, vehicleType || 'car');

        //         return {
        //             location: {lat: wp.lat, lng: wp.lng},
        //             eta: wp.eta,
        //             distanceFromStart: wp.distanceFromStart,
        //             weather: {...weather, riskLevel},
        //             maxSafeSpeed,
        //         };
        //     })
        // );

        // chained ETA count 
        const waypointsWithWeather = [];
        let cumulativeEta = departure;
        let previousDistance = 0;
        for (const wp of rawWaypoints) {
            const segmentDistanceKm = wp.distanceFromStart - previousDistance;

            let etaForThisPoint = cumulativeEta;
            
            if(segmentDistanceKm > 0) {
                const lastmaxSafeSpeed = waypointsWithWeather.length > 0
                ? waypointsWithWeather[waypointsWithWeather.length - 1].maxSafeSpeed
                : 100;

                const segmentTimeHours = segmentDistanceKm /lastmaxSafeSpeed;
                const segmentTimeMs = segmentTimeHours * 60 * 60 *1000;
                etaForThisPoint = new Date(cumulativeEta.getTime() + segmentTimeMs);
            }

            await delay(500); // wait 1/2 sec

            const weather = await getWeatherForLocationAndTime(wp.lat, wp.lng, etaForThisPoint);
            // const maxSafeSpeed = calculatemaxSafeSpeed(weather, vType);
            // const riskLevel = calculateRiskLevel(weather, vType);

            //calc all types speed and risks for caching
            const vehicleTypes = ['car', 'motorcycle', 'truck'];
            const speeds = {};
            const risks= {};
            vehicleTypes.forEach(type => {
                speeds[type]= calculatemaxSafeSpeed(weather, type);
                risks[type] = calculateRiskLevel(weather, type);
            });
            //push
            waypointsWithWeather.push({
                location: {lat: wp.lat, lng: wp.lng},
                eta: etaForThisPoint,
                distanceFromStart: wp.distanceFromStart,
                weather: {...weather, riskLevel: risks[vType]},
                maxSafeSpeed: speeds[vType],
                speeds: speeds,
                risks: risks,
            });
            
            cumulativeEta = etaForThisPoint;
            previousDistance = wp.distanceFromStart;

        }

        const riskScores = {low: 1, medium: 2, high:3};
        const avgScore = waypointsWithWeather.reduce(
            (sum, wp)=> sum + riskScores[wp.weather.riskLevel], 0
        ) / waypointsWithWeather.length;

        // const riskLevels = waypointsWithWeather.map((wp)=> wp.weather.riskLevel);
        // const overallRisk = riskLevels.includes('high')
        // ? 'high'
        // : riskLevels.includes('medium')
        // ? 'medium'
        // : 'low';
        const overallRisk = avgScore > 2.2 ? 'high' : avgScore > 1.4 ? 'medium' : 'low';
        const totalDurationMin = (cumulativeEta.getTime() - departure.getTime()) / (60*1000);

        const routePolyline = route.coordinates.map(([lng, lat])=> [lat, lng]); // osrm stor data in lng -lat but leaflet stor it in lat -lang so we are swapping

        const trip = await Trip.create({
            userId: req.user._id,
            origin,
            destination,
            // vehicleType: vehicleType || 'car',
            vehicleType: vType,
            departureTime: departure,
            totalDistanceKm: route.distanceKm, 
            // totalDurationMin: route.durationMin,
            totalDurationMin,
            waypoints: waypointsWithWeather, 
            routePolyline,
            overallRiskLevel: overallRisk,
        });


    res.status(200).json({
        success: true,
        trip: {
            id: trip._id,
            totalDistanceKm: route.distanceKm,
            // totalDurationMin: route.durationMin,
            totalDurationMin,
            overallRiskLevel: overallRisk,
            waypoints: waypointsWithWeather,
            routePolyline,
        },
    });
    }catch (err){
        // APIs sites limitation errors show 
        console.error("Failed URL:", err.config?.url || err.response?.config?.url);
        console.error("Status Code:", err.response?.status);
        
        next(err);
    }
};


const getTripHistory = async (req, res, next) => {
    try{
        const trips = await Trip.find({userId: req.user._id})
        .sort({createdAt: -1})
        .limit(10)
        .select('-waypoints -routePolyline');

        res.status(200).json({success: true, trips});

    }catch(err) {
        next(err);
    };

};

const getTripById = async (req, res, next)=> {
    try {
        const {tripId} = req.params;
        const trip = await Trip.findOne({
            _id: tripId,
            userId: req.user._id,
        });
        if (!trip) return res.status(404).json({msg: 'trip not found', success: false});
        res.status(200).json({
            success: true,
            trip: {
                id: trip._id,
                totalDistanceKm: trip.totalDistanceKm,
                totalDurationMin: trip.totalDurationMin,
                overallRiskLevel: trip.overallRiskLevel,
                waypoints: trip.waypoints,
                routePolyline: trip.routePolyline,
                vehicleType: trip.vehicleType,
            },
        });
    } catch (err) {
        next(err)
        
    }
}

module.exports = {planRoute, getTripHistory, getTripById};