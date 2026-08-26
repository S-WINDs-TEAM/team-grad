import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
// import Register from "./pages/Register";
// import TestDashboard from "./pages/TestDashboard";
import HomePage from "./pages/HomePage";
import LandingPage from "./pages/LandingPage";
import AcceptInvitePage from "./pages/AcceptInvitePage";
import DriverTrackingPage from "./pages/DriverTrackingPage";
// import RouteResultsPage from './pages/RouteResultsPage';
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from "react-hot-toast";
import FleetDashboardPage from "./pages/FleetDashboard/FleetDashboardPage";
// import FleetDashboardPage from "./pages/FleetDashboardPage";
import FleetAnalyticsPage from "./pages/FleetDashboard/FleetAnalyticsPage";
import FleetDashboardLayout from "./pages/FleetDashboard/FleetDashboardLayout";
import TripHistoryPage from "./pages/FleetDashboard/TripHistoryPage";
import PlanTripPage from "./pages/FleetDashboard/PlanTripPage";
import FleetOverviewPage from "./pages/FleetDashboard/FleetOverviewPage";
import FleetRouteComparisonPage from "./pages/FleetDashboard/FleetRouteComparisonPage";
import FleetVehicleListPage from "./pages/FleetDashboard/FleetVehicleListPage";
import FleetSettingsPage from "./pages/FleetDashboard/FleetSettingsPage";
import NotFound from "./pages/NotFound";
import RegisterPage from "./pages/RegisterPage";
import TestPage from "./pages/TestPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import BriefingPage from "./pages/BriefingPage";

function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <Routes>
        {/* Public landing */}
        <Route index element={<LandingPage />} />
        {/* Auth routes */}
        <Route path="/login" element={<LoginPage />} />
        //register
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/accept-invite/:token" element={<AcceptInvitePage />} />
        {/* Fleet routes */}
        <Route
          path="/fleet"
          element={
            <ProtectedRoute>
              <FleetDashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<FleetDashboardPage />} />
          <Route path="overview" element={<FleetOverviewPage />} />
          <Route path="trip-history" element={<TripHistoryPage />} />
          <Route path="plan" element={<PlanTripPage />} />
          <Route
            path="route-comparison"
            element={<FleetRouteComparisonPage />}
          />
          <Route path="vehicle-list" element={<FleetVehicleListPage />} />
          <Route path="analytics" element={<FleetAnalyticsPage />} />
          <Route path="settings" element={<FleetSettingsPage />} />
        </Route>
        <Route
          path="/fleet-driver"
          element={
            <ProtectedRoute>
              <DriverTrackingPage />
            </ProtectedRoute>
          }
        />
        {/* Individual routes */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/test"
          element={
            <ProtectedRoute>
              <TestPage />
            </ProtectedRoute>
          }
        />
        {/* Analytics (basic charts for the manager & individual) */}
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />
        {/* briefing routes  */}
        <Route
          path="/briefing"
          element={
            <ProtectedRoute>
              <BriefingPage />
            </ProtectedRoute>
          }
        />
        //result
        {/* <Route path='/results' 
      element={<ProtectedRoute>
         <RouteResultsPage/> 
         </ProtectedRoute>}/> */}
        //main
        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
