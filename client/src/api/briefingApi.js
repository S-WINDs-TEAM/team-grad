import axiosInstance from './axiosInstance';

const getBriefingApi = () => axiosInstance.get('/briefing');

export { getBriefingApi };