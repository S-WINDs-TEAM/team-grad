import axiosInstance from './axiosInstance';

const sendChatApi = (data) => axiosInstance.post('/chat/send', data);
const getMyThreadApi = () => axiosInstance.get('/chat/thread/me');
const getThreadsApi = () => axiosInstance.get('/chat/threads');
const getThreadApi = (driverId) => axiosInstance.get(`/chat/thread/${driverId}`);
export { 
    sendChatApi,
    getMyThreadApi,
    getThreadApi,
    getThreadsApi,
     };