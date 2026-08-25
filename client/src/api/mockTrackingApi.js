import axiosInstance from './axiosInstance';

const startMockTrackingApi = () => axiosInstance.post('/fleet/mock-tracking/start');
const stopMockTrackingApi = () => axiosInstance.post('/fleet/mock-tracking/stop');

export { startMockTrackingApi, stopMockTrackingApi };