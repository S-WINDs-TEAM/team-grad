import axiosInstance from "./axiosInstance";
const planRouteApi = (data) => axiosInstance.post('/routes/plan', data);
const getHistoryApi = ()=> axiosInstance.get('/routes/history');
const smartDepartureApi = (data)=> axiosInstance.post('/routes/smart-departure', data)
export {
    planRouteApi,
    smartDepartureApi,
    getHistoryApi
};