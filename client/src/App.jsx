import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import PlanTripPage from "./pages/PlanTripPage";
import LandingPage from "./pages/LandingPage";
import AcceptInvitePage from "./pages/AcceptInvitePage";
import FleetDashboardPage from "./pages/FleetDashboardPage";
import DriverTrackingPage from "./pages/DriverTrackingPage";
// import RouteResultsPage from './pages/RouteResultsPage';
import TripHistoryPage from "./pages/TripHistoryPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <Routes>
        //login
        <Route path="/login" element={<LoginPage />} />
        //register
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/accept-invite/:token" element={<AcceptInvitePage />} />
        <Route
          path="/fleet"
          element={
            <ProtectedRoute>
              <FleetDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fleet-driver"
          element={
            <ProtectedRoute>
              <DriverTrackingPage />
            </ProtectedRoute>
          }
        />
        <Route path="/landing" element={<LandingPage />} />
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
        <Route path="*" element={<Navigate to="/landing" />} />
      </Routes>
    </>
  );
}

export default App;
