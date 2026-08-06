import axiosInstance from "./axiosInstance";
const planRouteApi = (data) => axiosInstance.post('/routes/plan', data);
const getHistoryApi = (page = 1 , limit = 10)=>
     axiosInstance.get('/routes/history', 
        { params: { page, limit } });

export {
    planRouteApi,
    getHistoryApi
};