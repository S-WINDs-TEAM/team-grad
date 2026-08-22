import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import PlanTripPage from './pages/PlanTripPage';
import LandingPage from './pages/LandingPage';
import AcceptInvitePage from './pages/AcceptInvitePage';
import FleetDashboardPage from './pages/FleetDashboardPage';
import DriverTrackingPage from './pages/DriverTrackingPage';
import TripHistoryPage from './pages/TripHistoryPage';
import AnalyticsPage from './pages/AnalyticsPage';
import BriefingPage from './pages/BriefingPage';
import ProtectedRoute from './components/ProtectedRoute';
import TestPage from './pages/TestPage';
import { Toaster } from 'react-hot-toast';
function App() {
    return (
        <>
            <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
            <Routes>
                {/* Auth routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/accept-invite/:token" element={<AcceptInvitePage />} />

                {/* Fleet routes */}
                <Route path="/fleet" element={<ProtectedRoute><FleetDashboardPage /></ProtectedRoute>} />
                <Route path="/fleet-driver" element={<ProtectedRoute><DriverTrackingPage /></ProtectedRoute>} />

                {/* Public landing */}
                <Route path="/landing" element={<LandingPage />} />

                {/* Individual routes */}
                <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                <Route path="/history" element={<ProtectedRoute><TripHistoryPage /></ProtectedRoute>} />
                <Route path="/plan" element={<ProtectedRoute><PlanTripPage /></ProtectedRoute>} />
                <Route path="/test" element={<ProtectedRoute><TestPage /></ProtectedRoute>} />                {/* Analytics (basic charts for the manager & individual) */}
                <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
                {/* briefing routes  */}
                <Route path="/briefing" element={<ProtectedRoute><BriefingPage /></ProtectedRoute>} />
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/landing" />} />
            </Routes>
        </>
    );
}

export default App;