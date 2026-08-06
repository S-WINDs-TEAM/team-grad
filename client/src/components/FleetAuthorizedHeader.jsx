import { NavLink } from "react-router-dom";
import { styles } from "../components/fleet/FleetDashboard.styles";
import { useDispatch } from "react-redux";
import { setFleetDashboardSidebarState } from "../store/fleetDashboardSidebarSlice";

export default function FleetAuthorizedHeader({ userName, logout }) {
  const dispatch = useDispatch();

  return (
    <header style={styles.header}>
      <button
        className="p-2 -ml-2 text-on-surface-variant hover:text-primary-fixed-dim hover:bg-surface-container-high transition-all rounded-full flex items-center justify-center mr-1 xl:flex cursor-pointer"
        onClick={() => dispatch(setFleetDashboardSidebarState(true))}
      >
        <span className="material-symbols-outlined">menu</span>
      </button>
      <div style={styles.logo}>
        <span style={styles.logoIcon}>◈</span>
        <span style={styles.logoText}>S-WINDs</span>
        <span style={styles.logoSubtext}>Fleet Management</span>
      </div>
      <div style={styles.headerRight}>
        <span style={styles.userName}>{userName} · Admin</span>
        <button style={styles.logoutBtn} onClick={logout}>
          Logout
        </button>
      </div>
    </header>
  );
}
