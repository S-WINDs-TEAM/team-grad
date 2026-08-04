import axiosInstance from "./axiosInstance";
const planRouteApi = (data) => axiosInstance.post('/routes/plan', data);
const getHistoryApi = ()=> axiosInstance.get('/routes/history');
<<<<<<< HEAD

export {
    planRouteApi,
    getHistoryApi
=======
const smartDepartureApi = (data)=> axiosInstance.post('/routes/smart-departure', data)
const getTripByIdApi = (tripId) => axiosInstance.get(`/routes/${tripId}`);

export {
    planRouteApi,
    smartDepartureApi,
    getHistoryApi,
    getTripByIdApi,
>>>>>>> origin/ElSayed
};