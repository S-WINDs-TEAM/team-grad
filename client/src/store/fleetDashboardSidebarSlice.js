import { createSlice } from "@reduxjs/toolkit";

const fleetDashboardSidebarSlice = createSlice({
  name: "fleetDashboardSidebar",
  initialState: {
    fleetDashboardSidebarState: false,
  },
  reducers: {
    setFleetDashboardSidebarState: (state, action) => {
      state.fleetDashboardSidebarState = action.payload;
    },
  },
});

export const { setFleetDashboardSidebarState } =
  fleetDashboardSidebarSlice.actions;
export default fleetDashboardSidebarSlice.reducer;
