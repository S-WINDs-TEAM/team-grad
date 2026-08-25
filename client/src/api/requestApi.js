import axiosInstance from './axiosInstance';

const createBreakRequestApi = (data) => axiosInstance.post('/requests/break', data);
const createRouteRequestApi = (data) => axiosInstance.post('/requests/route', data);
const createTripRequestApi = (data) => axiosInstance.post('/requests/trip', data);
const getInboxApi = (params) => axiosInstance.get('/requests/inbox', { params });
const getUnreadCountApi = () => axiosInstance.get('/requests/unread-count');
const decideRequestApi = (id, data) => axiosInstance.patch(`/requests/${id}/decide`, data);
const markReadApi = (id) => axiosInstance.patch(`/requests/${id}/read`);
const markAllReadApi = () => axiosInstance.patch('/requests/read-all');
export {
    createBreakRequestApi,
    createRouteRequestApi,
    createTripRequestApi,
    getInboxApi,
    getUnreadCountApi,
    decideRequestApi,
    markReadApi,
    markAllReadApi,
};