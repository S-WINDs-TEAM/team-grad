import { createSlice } from '@reduxjs/toolkit';

const fleetSlice = createSlice({
    name: 'fleet',
    initialState: {
        vehicles: [],     // company_admin: full fleet snapshot (REST) + live updates (socket)
        alerts: [],       // recent fleet:alert events received
        myVehicle: null,  // company_driver: their own assigned vehicle
        connected: false, // socket connection status, shown in the UI ("Real-time Tracking" dot)
    },
    reducers: {
        setVehicles: (state, action) => {
            state.vehicles = action.payload;
        },
        // called on both the initial REST snapshot merge and every 'fleet:update' socket event
        upsertVehicle: (state, action) => {
            const updated = action.payload;
            const idx = state.vehicles.findIndex((v) => v._id === updated._id);
            if (idx >= 0) state.vehicles[idx] = updated;
            else state.vehicles.push(updated);
        },
        addAlert: (state, action) => {
            state.alerts.unshift(action.payload);
            state.alerts = state.alerts.slice(0, 20); // keep the panel light, last 20 only
        },
        setMyVehicle: (state, action) => {
            state.myVehicle = action.payload;
        },
        setConnected: (state, action) => {
            state.connected = action.payload;
        },
    },
});

export const { setVehicles, upsertVehicle, addAlert, setMyVehicle, setConnected } = fleetSlice.actions;
export default fleetSlice.reducer;