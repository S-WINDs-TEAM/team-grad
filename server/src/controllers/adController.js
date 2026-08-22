const Ad = require('../models/Ad');

// GET /api/ads/recommendations?lat=&lng=&condition=heat|rain|dust&fatigue=0-10&radiusKm=25
const getRecommendations = async (req, res, next) => {
    try {
        const { lat, lng, condition, fatigue, radiusKm } = req.query;

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
            return res.status(400).json({
                success: false,
                msg: 'lat and lng query params are required and must be numbers',
            });
        }

        const maxDistanceMeters = (parseFloat(radiusKm) || 25) * 1000; // default 25km radius

        const matchQuery = {};
        if (condition && ['heat', 'rain', 'dust'].includes(condition)) {
            matchQuery[`triggerConditions.${condition}`] = true;
        }

        // $geoNear needs to be the first stage, and it requires the 2dsphere index on Ad.location
        let ads = await Ad.aggregate([
            {
                $geoNear: {
                    near: { type: 'Point', coordinates: [longitude, latitude] },
                    distanceField: 'distanceMeters',
                    spherical: true,
                    maxDistance: maxDistanceMeters,
                    query: matchQuery,
                },
            },
            { $limit: 20 },
        ]);

        // high fatigue -> bubble rest stops to the top regardless of distance ranking
        const fatigueLevel = parseFloat(fatigue);
        if (!Number.isNaN(fatigueLevel) && fatigueLevel >= 6) {
            ads = [...ads].sort((a, b) => {
                const aIsRest = a.type === 'rest' ? -1 : 0;
                const bIsRest = b.type === 'rest' ? -1 : 0;
                return aIsRest - bIsRest;
            });
        }

        const results = ads.map((ad) => ({
            id: ad._id,
            name: ad.name,
            type: ad.type,
            offerText: ad.offerText,
            distanceKm: Math.round((ad.distanceMeters / 1000) * 10) / 10,
            location: { lat: ad.location.coordinates[1], lng: ad.location.coordinates[0] },
        }));

        res.status(200).json({ success: true, ads: results });
    } catch (err) {
        next(err);
    }
};

module.exports = { getRecommendations };