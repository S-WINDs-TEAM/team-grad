// standalone script — run manually with: node src/utils/seedAds.js
// wipes the ads collection and inserts sample roadside-stop data for testing.
require('dotenv').config();
const dbConnection = require('../config/db');
const Ad = require('../models/Ad');

const sampleAds = [
    {
        name: 'Desert Rest Stop - KM45',
        type: 'rest',
        location: { type: 'Point', coordinates: [30.8025, 30.1234] }, // Cairo-Alex desert road
        offerText: 'Free tea with any meal, shaded parking',
        triggerConditions: { heat: true, rain: false, dust: true },
    },
    {
        name: 'GreenWash Car Care',
        type: 'wash',
        location: { type: 'Point', coordinates: [31.2357, 30.0444] }, // Cairo
        offerText: '20% off full wash after dusty weather',
        triggerConditions: { heat: false, rain: false, dust: true },
    },
    {
        name: 'Highway Fuel Station 6th October',
        type: 'fuel',
        location: { type: 'Point', coordinates: [30.9188, 29.9602] }, // 6th of October City
        offerText: 'Free windshield check with fill-up',
        triggerConditions: { heat: true, rain: true, dust: true },
    },
    {
        name: 'Nile View Rest Stop',
        type: 'rest',
        location: { type: 'Point', coordinates: [31.4358, 30.5965] }, // near Tanta
        offerText: 'Cold drinks and AC seating',
        triggerConditions: { heat: true, rain: false, dust: false },
    },
    {
        name: 'RainGuard Tire & Wash',
        type: 'wash',
        location: { type: 'Point', coordinates: [29.9187, 31.2001] }, // Alexandria
        offerText: 'Free tire pressure check after rain',
        triggerConditions: { heat: false, rain: true, dust: false },
    },
    {
        name: 'Desert Fuel Point - KM80',
        type: 'fuel',
        location: { type: 'Point', coordinates: [30.6500, 30.2500] }, // desert road midpoint
        offerText: 'Emergency water bottles available',
        triggerConditions: { heat: true, rain: false, dust: true },
    },
];

const seed = async () => {
    await dbConnection();
    await Ad.deleteMany({});
    const created = await Ad.insertMany(sampleAds);
    console.log(`seeded ${created.length} ads successfully`);
    process.exit(0);
};

seed().catch((err) => {
    console.error('seeding failed:', err.message);
    process.exit(1);
});