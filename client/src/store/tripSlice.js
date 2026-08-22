import { createSlice } from "@reduxjs/toolkit";

const tripSlice = createSlice({
    name: 'trip',
    initialState: {
        currentTrip: null,
        history: [],
        loading: false,
        error: null,
    },
    reducers: {
        setCurrentTrip: (state, action) => {
            state.currentTrip = action.payload;

        },
        clearCurrentTrip: (state) => {
            state.currentTrip = null;
        },
        setHistory: (state, action) => {
            state.history = action.payload;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
    },
});

export const {setCurrentTrip, clearCurrentTrip, setHistory, setLoading, setError} = tripSlice.actions;
export default tripSlice.reducer;