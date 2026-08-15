import { useDispatch, useSelector } from "react-redux";
import { setFleetDashboardSidebarState } from "../../store/fleetDashboardSidebarSlice";
import { NavLink } from "react-router-dom";

const menuItems = [
  {
    title: "Dashboard",
    icon: "dashboard",
    to: "/fleet",
    end: true,
  },
  {
    title: "Fleet Overview",
    icon: "directions_boat",
    to: "/fleet/overview",
  },
  {
    title: "Trip History",
    icon: "history",
    to: "/fleet/trip-history",
  },
  {
    title: "Route Comparison",
    icon: "compare_arrows",
    to: "/fleet/route-comparison",
  },
  {
    title: "Vehicle List",
    icon: "list",
    to: "/fleet/vehicle-list",
  },
  {
    title: "Analytics",
    icon: "analytics",
    to: "/fleet/analytics",
  },
  {
    title: "Settings",
    icon: "settings",
    to: "/fleet/settings",
  },
];
export default function FleetDashboardSidebar() {
  const dispatch = useDispatch();
  const { fleetDashboardSidebarState } = useSelector(
    (state) => state.fleetDashboardSidebar,
  );

  return (
    <>
      <div
        onClick={() => dispatch(setFleetDashboardSidebarState(false))}
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 cursor-pointer ${fleetDashboardSidebarState ? "" : "opacity-0 hidden"}`}
      ></div>
      <aside
        className={`fixed top-0 left-0 h-full w-70 bg-surface-container-low z-60 transform  transition-transform duration-300 flex flex-col border-r border-outline-variant shadow-lg ${fleetDashboardSidebarState ? "" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-outline-variant">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-fixed-dim material-symbols-over">
              speed
            </span>
            <span className="font-display-lg text-[20px] font-black text-primary-fixed-dim tracking-tighter">
              S-WINDS
            </span>
          </div>
          <button
            onClick={() => dispatch(setFleetDashboardSidebarState(false))}
            className="p-2 text-on-surface-variant hover:text-primary-fixed-dim hover:bg-surface-container-high transition-all rounded-full flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <nav className="grow overflow-y-auto py-4 flex flex-col gap-1 px-3">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary-fixed-dim/10 text-primary-fixed-dim font-bold"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">
                {item.icon}
              </span>

              <span className="font-title-lg text-[16px]">{item.title}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
