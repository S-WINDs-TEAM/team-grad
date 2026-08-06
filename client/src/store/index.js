import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
// import storage from 'redux-persist/lib/storage'; // web localstorage
import authReducer from "./authSlice";
import tripReducer from "./tripSlice";
import fleetReducer from "./fleetSlice";
import fleetDashboardSidebarReducer from "./fleetDashboardSidebarSlice";

const storage = {
  getItem: (key) => {
    const value = localStorage.getItem(key);
    return Promise.resolve(value ? JSON.parse(value) : null);
  },
  setItem: (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
    return Promise.resolve();
  },
  removeItem: (key) => {
    localStorage.removeItem(key);
    return Promise.resolve();
  },
};
const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth"],
};

const rootReducer = combineReducers({
  auth: authReducer,
  trip: tripReducer,
  fleet: fleetReducer,
  fleetDashboardSidebar: fleetDashboardSidebarReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
  // reducer: {
  //     auth: authReducer,
  //     trip: tripReducer,
  // },
});
export const persistor = persistStore(store);

export default store;
