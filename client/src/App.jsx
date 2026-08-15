import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import Register from "./pages/Register";
import HomePage from "./pages/HomePage";
import PlanTripPage from "./pages/PlanTripPage";
import LandingPage from "./pages/LandingPage";
import AcceptInvitePage from "./pages/AcceptInvitePage";
import FleetDashboardPage from "./pages/FleetDashboard/FleetDashboardPage";
import DriverTrackingPage from "./pages/DriverTrackingPage";
// import RouteResultsPage from './pages/RouteResultsPage';
import TripHistoryPage from "./pages/TripHistoryPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from "react-hot-toast";
import FleetAnalyticsPage from "./pages/FleetDashboard/FleetAnalyticsPage";
import FleetDashboardLayout from "./pages/FleetDashboard/FleetDashboardLayout";
import FleetOverviewPage from "./pages/FleetDashboard/FleetOverviewPage";
import FleetTripHistoryPage from "./pages/FleetDashboard/FleetTripHistoryPage";
import FleetRouteComparisonPage from "./pages/FleetDashboard/FleetRouteComparisonPage";
import FleetVehicleListPage from "./pages/FleetDashboard/FleetVehicleListPage";
import FleetSettingsPage from "./pages/FleetDashboard/FleetSettingsPage";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <Routes>
        //login
        <Route index element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        //register
        <Route path="/register" element={<Register />} />
        <Route path="/accept-invite/:token" element={<AcceptInvitePage />} />
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
          <Route path="trip-history" element={<FleetTripHistoryPage />} />
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
        //home
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        //history page
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <TripHistoryPage />
            </ProtectedRoute>
          }
        />
        /plan and results
        <Route
          path="/plan"
          element={
            <ProtectedRoute>
              <PlanTripPage />
            </ProtectedRoute>
          }
        />
        //result
        {/* <Route path='/results' 
      element={<ProtectedRoute>
         <RouteResultsPage/> 
         </ProtectedRoute>}/> */}
        //main
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
