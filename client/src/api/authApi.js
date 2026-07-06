import axiosInstance from "./axiosInstance";

const registerApi = (data) => axiosInstance.post('/auth/register', data);
const loginApi = (data) => axiosInstance.post('/auth/login', data);
const logoutApi = () => axiosInstance.post('/auth/logout'); // data params removed 
const getMeApi = () => axiosInstance.get('/auth/me');

export {
    registerApi,
    loginApi,
    logoutApi,
    getMeApi
};