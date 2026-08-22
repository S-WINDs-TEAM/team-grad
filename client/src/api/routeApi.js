import axiosInstance from "./axiosInstance";
const planRouteApi = (data) => axiosInstance.post('/routes/plan', data);
// Accept page and limit params for pagination support

const getHistoryApi = (page = 1, limit =10)=>
     axiosInstance.get('/routes/history', {params: {page, limit}});
const smartDepartureApi = (data)=> axiosInstance.post('/routes/smart-departure', data)
const getTripByIdApi = (tripId) => axiosInstance.get(`/routes/${tripId}`);

export {
    planRouteApi,
    smartDepartureApi,
    getHistoryApi,
    getTripByIdApi,
};