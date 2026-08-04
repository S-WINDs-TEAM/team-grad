import { createSlice } from "@reduxjs/toolkit";
// create the reducer
const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    isAuthenticated: false,
    loading: false,
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const { setLoading, clearUser, setUser } = authSlice.actions;
// NOTE: "authSlice.reducer" is the correct Redux Toolkit property name
// (it was already spelled right here). The store imports it as
// "import authReducer from './authSlice'", so this default export must match.
export default authSlice.reducer;
