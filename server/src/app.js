
// libs
console.log("server start calling app")

const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');

//file req routes
const authRoutes = require('./routes/authRoutes');
const routeRoutes = require('./routes/routeRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const fleetRoutes = require('./routes/fleetRoutes');
const adRoutes = require('./routes/adRoutes');
const errorHandler = require('./middlewares/errorMiddleware');
const geocodeRoutes = require('../src/routes/geocodeRoutes');
const alertRoutes = require('./routes/alertRoutes');

const app = express();

//middlewares
app.use(express.json());
app.use(cookieParser());

// BUG FIX: the old config hardcoded origin: 'http://localhost:5173'.
// cors() only allows that EXACT origin. If the browser loads the app from
// ANY other origin (127.0.0.1:5173, a LAN IP, [::1], or the
// deployed domain), cors sends NO Access-Control-Allow-Origin header.
// Because the request uses credentials, the browser then BLOCKS the response
// and axios surfaces it as "Network Error" / ERR_NETWORK — even though
// the server is up and answers fine from a non-browser client (proven by a
// node fetch returning 200 + correct CORS headers). That is exactly the
// "registration error response: undefined" symptom. We now reflect the
// request's own Origin for trusted dev origins, and restrict to the
// configured CLIENT_URL in production.
const isLoopbackOrigin = (o) =>
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(o || '');
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // same-origin / server-to-server
    if (origin === allowedOrigin || isLoopbackOrigin(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// serves uploaded profile/vehicle photos, e.g. GET /uploads/171234-abc.jpg — see uploadMiddleware.js
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

//endpoints routes here:
app.use('/api/auth', authRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/geocode', geocodeRoutes);
app.use('/api/fleet', fleetRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/alerts', alertRoutes);




app.get('/', (req, res)=>{
    res.status(200).json({msg: "wind api is ruunnig"});

});

app.use(errorHandler);
console.log("server end calling app")

module.exports = app;



// const PORT = process.env.PORT || 6000;

// app.listen(PORT, ()=>{
//     console.log(`server is powerd on port: ${PORT}`);
// });


// الكارثة: المتصفح يطلعلك CORS error (الفرونت مش عارف يتواصل).
// العلامة: في الـ Network بقى blocked by CORS policy.
// الحل: تأكد إن origin في cors() مظبوط على الرابط اللي شغال عليه الفرونت بالظبط (من غير / في الآخر).

// الكارثة: req.body دايمًا فاضي (undefined) رغم إنك باعت بيانات.
// العلامة: الـ API بتاعك بيرجع undefined.
// الحل: تأكد إن الـ app.use(express.json()) مكتوب قبل الـ Routes، مش بعدها.


// مساحة التطور والتوسعة (Scale & Extend)
// لو المشروع كبر: هتحتاج تضيف helmet (يخفي هوية السيرفر للأمان) و express-rate-limit (يحدد عدد الطلبات لكل IP عشان محدش يضرب السيرفر). هتكتبهم كـ app.use قبل الـ Routes.

// لو عندك 50 Route: مش هتفضل تكتب app.use لكل واحد. هتعمل fs.readdirSync تقرأ مجلد routes وتضيفهم أوتوماتيكياً. لكن الوقت الحالي، الكتابة اليدوية أوضح للفهم.
