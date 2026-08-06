import { Outlet, useNavigate } from "react-router-dom";
import FleetAuthorizedHeader from "../../components/FleetAuthorizedHeader";
import useAuth from "../../hooks/useAuth";
import FleetDashboardSidebar from "../../components/fleet/FleetDashboardSidebar";

export default function FleetDashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };
  return (
    <>
      <FleetAuthorizedHeader userName={user?.name} logout={handleLogout} />
      <FleetDashboardSidebar />
      <Outlet />
    </>
  );
}
