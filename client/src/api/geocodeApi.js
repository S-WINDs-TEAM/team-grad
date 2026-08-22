import axiosInstance from './axiosInstance';

const geocodeSearchApi = (query) =>
  axiosInstance.get('/geocode/search', { params: { q: query } });

export default geocodeSearchApi;