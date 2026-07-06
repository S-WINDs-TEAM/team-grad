const axios = require('axios');

const getRoute = async (originLat, originLng, destLat, destLng) => {
    const url = `http://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}`; // osrm server

    const response = await axios.get(url, {
        params: {
            overview: 'full', // full road details
            geometries: 'geojson', // res in json
            steps: false, // diraction commands
        },
    });

    const route = response.data?.routes?.[0]; // get the first route cause the trip could have many rout to get to
    if(!route) throw new Error('no route found');

    return {
        // return the data from the osrm 
        distanceKm: route.distance /1000,
        durationMin: route.duration /60,
        coordinates: route.geometry.coordinates,
    };
};

// const sampleWaypoints = (coordinates, totalDurationMin, totalDistanceKm, departureTime) => {
const sampleWaypoints = (coordinates, totalDistanceKm) => {
    const waypoints = [];
    const totalPoints = coordinates.length;
    // const numWaypoints = Math.max(2, Math.ceil(totalDurationMin /30));
    const numWaypoints = Math.max(2, Math.ceil(totalDistanceKm /30));

    for (let i = 0; i<= numWaypoints; i++) {
        const progress = Math.min(i / numWaypoints, 1);
        const coordIndex = Math.floor(progress* (totalPoints -1));
        const [lng, lat] = coordinates[coordIndex];
        // const etaMs = departureTime.getTime() + progress * totalDurationMin * 60 *1000;

        waypoints.push({
            lat, 
            lng,
            // eta: new Date(etaMs),
            distanceFromStart: progress * totalDistanceKm,
        });
    }
    return waypoints;
}

module.exports = {getRoute, sampleWaypoints};












// والـ Voice Assistant المستقبلي؟
// هنا بقى الجواب اللي هتلمع بيه: لما تجي تشتغل على الـ Voice Assistant، مش هتغير حاجة في الطلب بتاع OSRM. هتخلي steps: false زي ماهو، وهتستخدم مكتبة تانية لتحويل المسار لتعليمات.

// ✅ الخطة الذكية:
// خلي steps: false في طلب OSRM عشان تحافظ على سرعة الأداء.

// استخدم مكتبة زي osrm-text-instructions عشان تحول الـ geometry (الإحداثيات) لتعليمات مفهومة صوتيًا.

// المكتبة دي بتاخد الـ Route من OSRM (حتى من غير steps) وبتحوله لـ "انعطف يمين"، "استمر straight"، إلخ.

// كده بتفصل بين حساب المسار (OSRM) و توليد التعليمات (مكتبة تانية)، وده تصميم أنضف وأسهل في الصيانة.