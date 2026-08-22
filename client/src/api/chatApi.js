import axiosInstance from './axiosInstance';

const sendChatApi = (data) => axiosInstance.post('/chat/send', data);
const getMyThreadApi = () => axiosInstance.get('/chat/thread/me');

export { sendChatApi, getMyThreadApi };