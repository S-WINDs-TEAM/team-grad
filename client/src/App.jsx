import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Register from "./pages/Register"
import HomePage from './pages/HomePage';
import PlanTripPage from './pages/PlanTripPage';
import LandingPage from './pages/LandingPage';
// import RouteResultsPage from './pages/RouteResultsPage';
import ProtectedRoute from './components/ProtectedRoute';
import TripHistoryPage from './pages/tripHistoryPage';
import {Toaster} from 'react-hot-toast';

function App() {
  return (
  <>
  <Toaster position="top-right" toastOptions={{duration: 4000}}/>
    <Routes>
      //login
      <Route path="/login" element={<LoginPage />} />
      //register
      <Route path="/register" element={<Register />} />
      <Route path="/landing" element={<LandingPage />} />
      //home
      <Route 
      path='/home'
      element = {
        <ProtectedRoute>
          <HomePage/>
        </ProtectedRoute>}/>
        /plan and results
      <Route
        path="/plan"
        element={
          <ProtectedRoute>
            <PlanTripPage />
          </ProtectedRoute>}/>
          //trip history
      {/* <Route path='/results' 
      element={<ProtectedRoute>
         <RouteResultsPage/> 
         </ProtectedRoute>}/> */}
         <Route
  path="/history"
  element={
    <ProtectedRoute>
      <TripHistoryPage />
    </ProtectedRoute>
  }
/>
//main
      <Route path="*" element={<Navigate to="/landing" />} />
    </Routes>
        </>
  );
}

export default App;