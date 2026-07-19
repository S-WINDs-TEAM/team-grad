


# S-WINDS 
### Smart Weather-Integrated Navigation & Driving System
**MERN Stack | Progressive Web App (PWA) | Real-Time (Socket.io) | B2C & B2B Solutions**

![MERN Stack](https://img.shields.io/badge/Stack-MERN-blue.svg)
![PWA](https://img.shields.io/badge/PWA-Ready-green.svg)
![Socket.io](https://img.shields.io/badge/RealTime-Socket.io-black.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

---

##  Project Overview

**S-WINDS** is a Progressive Web App (PWA) designed to act as an intelligent co-pilot for drivers. While traditional navigation tools only display traffic conditions and standard weather applications only show static, city-level current weather, S-WINDS bridges this gap. It integrates route planning with **hyper-local, time-accurate weather forecasts** mapped precisely along the journey's timeline.

###  Core Insight
> "The weather at your destination right now is useless. What matters is the weather there when **YOU** arrive." 

When a destination is entered, S-WINDS splits the route into time-based waypoints, calculates the Estimated Time of Arrival (ETA) for each specific point, and fetches the precise weather forecast for that location at that future arrival time.

---


##  Key Features

###  B2C (Individual Drivers)
* **Smart Route Planning:** Enter a destination to receive a detailed breakdown of your route with precise waypoint-level weather overlays.
* **Time-Accurate Insights:** View future weather conditions (temperature, wind, rain, visibility) adjusted to your specific ETA at each segment.
* **Safe Speed Advice:** Dynamic speed recommendations and calculated route risk levels based on upcoming weather hazards.
* **Smart Departure Suggestions:** Answers "When is the best time to leave?" by evaluating multiple departure windows to avoid hazards entirely.
* **Contextual Roadside Recommendations:** Geolocation-targeted commercial ads and recommendations (e.g., rest stops, fuel, washrooms) triggered dynamically by current local weather conditions.

###  B2B (Fleet Management)
* **Live Fleet Dashboard:** A unified dashboard providing fleet managers with a real-time map displaying all active vehicles.
* **Real-Time Tracking:** Instant status updates, vehicle locations, speeds, and localized weather conditions powered by persistent WebSocket connections.
* **Emergency Weather Alerts:** Instantaneous event broadcasting from fleet managers to target vehicle drivers via Socket.io during critical weather anomalies.

---

##  Technology Stack & Architecture

S-WINDS is built on a robust, scalable architecture using industry-standard tools and modern optimization techniques.

| Layer | Technology | Purpose & Implementation Details |
| :--- | :--- | :--- |
| **Frontend** | `React.js`  | Fast, component-based, highly responsive interface. |
| **PWA** | `Service Workers` & `Manifest`  | Enables mobile installation, offline capabilities, and removes App Store reliance. |
| **State Management** | `Redux Toolkit`  | Centralized state tracking for trips, active weather data, and vehicle/fleet states. |
| **Forms & Validation** | `React Hook Form`  | Optimized form handling for user/vehicle registration and fleet setups. |
| **HTTP Client** | `Axios` + Interceptors  | Automated JWT authorization token attachment on outbound requests. |
| **Routing (Client)** | `React Router DOM`  | Declarative navigation featuring protected routing separating users from fleet managers. |
| **Backend** | `Node.js` + `Express.js`  | High-performance asynchronous execution for heavy API workloads. |
| **Architecture** | `MVC Pattern` | Strict separation of Models (schemas), Controllers (logic), and Routes. |
| **Database** | `MongoDB` + `Mongoose`  | Document storage for users, trip history, fleet vehicles, and geohashed caches. |
| **Real-Time** | `Socket.io`  | Full-duplex WebSocket channels for instant, real-time fleet synchronization. |
| **Security/Auth** | `JWT` (Access & Refresh Tokens)  | Dual-token rotation securely handled inside `HttpOnly` Cookies. |
| **API Validation** | `Joi` or `Zod`  | Strict runtime validation schema enforcement on incoming API payloads. |
| **File Storage** | `Multer`  | Multipart form handling for uploading vehicle and user profile media assets. |
| **Mapping Engine** | `OSRM` / `Mapbox`  | OSRM open-source routing for MVP, transitioning to rich Mapbox custom vector tiles. |
| **Weather Source** | `Tomorrow.io` / `OpenWeatherMap`  | Hyper-local road forecasts integrated alongside OpenWeatherMap fallback channels. |

---

##  The Core Algorithm: 5-Step Route Weather Matching

The system minimizes API consumption overhead and provides real-time situational precision through a custom geospatial computation loop:

1. **Request Reception:** Receives the coordinate payload `(Origin, Destination)`, `vehicleType`, and requested `departureTime`.
2. **Polyline Acquisition:** Polls the Routing engine API (OSRM/Mapbox) to calculate the full journey polyline array and runtime durations.
3. **Temporal Waypoint Sampling:** Samples the route coordinates at time-based intervals (every ~30 minutes of driving time) rather than fixed spatial steps.
4. **ETA Offset Calculation:** Computes an absolute arrival time for each waypoint element:
   $$\text{ETA}_{\text{waypoint}} = \text{departureTime} + \text{accumulatedDriveTime}$$ 
5. **Geohash Cache Optimization:** Converts latitude and longitude into an alphanumeric string representing a 5x5 km geographic grid cell (Precision 5). 
   * **Cache Hit:** If the `geohash` paired with the rounded forecast hour exists in the database cache, it returns the stored weather instantly. **Result: 0% external API cost.** 
   * **Cache Miss:** Queries the `Tomorrow.io` API for that exact segment/time, writes the data to the cache collection utilizing a **30-minute MongoDB TTL index**, and resolves the response.

---

##  Project Directory Structure

```text
S-WINDS/
├── backend/
│   ├── src/
│   │   ├── config/       # Database connection & environment configuration 
│   │   ├── controllers/  # Business logic (authController, routeController, etc.) 
│   │   ├── middlewares/  # Authentication checks, body validations, global errors
│   │   ├── models/       # Mongoose schemas (User, Trip, WeatherCache, Ad, FleetVehicle) 
│   │   ├── routes/       # Express structural routing endpoints 
│   │   ├── services/     # Third-party integrations (weatherService, mapService) 
│   │   └── utils/        # Geohashing operations, ETA calculators, helper scripts 
│   ├── app.js            # Express app configuration & middleware pipeline 
│   ├── server.js         # Entry point: HTTP Server & Socket.io socket initialization 
│   ├── .env              # Backend local environment keys (Ignored by Git) 
│   └── .gitignore
└── frontend/
    ├── public/
    │   ├── manifest.json # PWA App metadata, branding assets, theme parameters 
    │   └── sw.js         # Service Worker script managing offline assets & caching 
    ├── src/
    │   ├── api/          # Axios configurations, interceptors, API requests 
    │   ├── components/   # Modular structural UI elements (WeatherPin, SpeedBadge, AdCard) 
    │   ├── hooks/        # Custom react hooks (useGeolocation, useWeatherRoute) 
    │   ├── pages/        # High-level screens (Home, PlanTrip, DriveMode, B2BDashboard) 
    │   ├── store/        # Redux Toolkit global state store and individual slices 
    │   ├── utils/        # Front-end formatters and visual color pickers 
    │   ├── App.jsx       # Client-side React Router protected route map configuration
    │   └── main.jsx      # React runtime entry point & Redux state context provider 
    ├── .env              # Frontend client environment declarations 
    └── .gitignore


API Endpoints Reference
 Authentication (/api/auth)
      POST /api/auth/register - Registers a new user account (Driver or Fleet Manager).
      POST /api/auth/login - Authenticates credentials; returns an encrypted Access Token & deposits a long-lived Refresh Token into secure HttpOnly cookies.
      POST /api/auth/refresh - Evaluates valid refresh tokens to emit renewed Access Token cookies.
      POST /api/auth/logout - Clears operational auth tracking cookies.
   Navigation & Weather (/api/routes)
      POST /api/routes/plan (Protected) - Accepts spatial endpoints and returns a complete chronological waypoint matrix packed with individual weather metadata, safety scores, and speed configurations.
      POST /api/routes/smart-departure (Protected) - Analyzes safety matrices across upcoming departure times to rank alternative start times.  
      POST /api/routes/history (Protected) - Retrieves chronological logs of past journey profiles.
   Advertisements & Commercial Hooks (/api/ads)
      GET /api/ads/recommendations (Protected) - Provides geofenced roadside service listings customized dynamically to situational fatigue scores or active weather anomalies.
   Fleet Operations (/api/fleet)
      GET /api/fleet/status (Fleet Manager Only) - Fetches current telematics details, tracking arrays, and surrounding weather conditions for all vehicles.
       /api/fleet/alert (Fleet Manager Only) - Dispatches immediate warning flags directly to chosen vehicle configurations via active Socket.io listeners

       
   Developed as a Final Graduation Project Template by Elsayed Elkhozamy - all rights reserved