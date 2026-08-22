
// libs
console.log("server start calling app")

const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { rateLimit } = require('express-rate-limit');

// Security Layer
const helmet = require('helmet');
// const mongoSanitize = require('express-mongo-sanitize');


// file req routes
const authRoutes = require('./routes/authRoutes');
const routeRoutes = require('./routes/routeRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const fleetRoutes = require('./routes/fleetRoutes');
const adRoutes = require('./routes/adRoutes');
const errorHandler = require('./middlewares/errorMiddleware');
const geocodeRoutes = require('../src/routes/geocodeRoutes');
const alertRoutes = require('./routes/alertRoutes');
const briefingRoutes = require('./routes/briefingRoutes');
const mockTrackingRoutes = require('./routes/mockTrackingRoutes');
const fleetAdminRoutes = require('./routes/fleetAdminRoutes');
const requestRoutes = require('./routes/requestRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();


// Helmet — sets secure HTTP headers (X-Content-Type-Options,
//    X-Frame-Options, CSP, etc.). First middleware so every response
//    carries the security headers.
app.use(helmet({
    // allow inline styles/scripts in dev (Vite injects them); tighten in prod
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
}));


// Body parsing + cookies (before any route that reads req.body)
app.use(express.json({ limit: '1mb' })); // cap body size against abuse
app.use(cookieParser());



// CORS — keep the existing dynamic origin logic untouched
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

// Manual body sanitizer — replaces express-mongo-sanitize which breaks on
// Express 5 (req.query / req.params are getters, not settable).
// We only sanitize req.body, which is where user input actually comes from.
app.use((req, res, next) => {
    const strip$ = (obj) => {
        if (!obj || typeof obj !== 'object') return;
        for (const key of Object.keys(obj)) {
            if (key.startsWith('$') || key.includes('.')) {
                delete obj[key];
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                strip$(obj[key]);
            }
        }
    };
    if (req.body) strip$(req.body);
    next();
});

// Global API rate limit — 100 req / 15 min per IP on /api/*
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    ipv6Subnet: 56,
    message: { success: false, msg: 'too many requests, please slow down' },
});
app.use('/api', apiLimiter);


// 6) Strict brute-force limiter on auth endpoints — 10 attempts / 15 min.
//    MUST be registered BEFORE the auth routes so it runs first.
//    During demo rehearsals you can temporarily raise this to 50 if you
//    keep re-logging to show different flows.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    ipv6Subnet: 56,
    skipSuccessfulRequests: true,  // successful logins don't count against the quota
    message: { success: false, msg: 'too many login attempts, please try again after 15 minutes' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/register-company', authLimiter);

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
app.use('/api/briefing', briefingRoutes);
app.use('/api/fleet', mockTrackingRoutes);
app.use('/api/fleet-admin', fleetAdminRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/chat', chatRoutes);

app.get('/', (req, res) => {
  res.status(200).json({ msg: "wind api is ruunnig" });

});

app.use(errorHandler);

console.log("server end calling app")

module.exports = app;

