import { NavLink } from "react-router-dom";
import { styles } from "../components/fleet/FleetDashboard.styles";

export default function FleetAuthorizedHeader({ userName, logout }) {
  return (
    <header style={styles.header}>
      <div style={styles.logo}>
        <span style={styles.logoIcon}>◈</span>
        <span style={styles.logoText}>S-WINDs</span>
        <span style={styles.logoSubtext}>Fleet Management</span>
      </div>
      <NavLink to="analytics">Analytics</NavLink>
      <div style={styles.headerRight}>
        <span style={styles.userName}>{userName} · Admin</span>
        <button style={styles.logoutBtn} onClick={logout}>
          Logout
        </button>
      </div>
    </header>
  );
}
