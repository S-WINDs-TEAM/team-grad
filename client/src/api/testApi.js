import axiosInstance from './axiosInstance';

const enableHazardApi = (data) => axiosInstance.post('/test/hazard/on', data);
const disableHazardApi = () => axiosInstance.post('/test/hazard/off');
const getSimStatusApi = () => axiosInstance.get('/test/status');

export { enableHazardApi, disableHazardApi, getSimStatusApi };