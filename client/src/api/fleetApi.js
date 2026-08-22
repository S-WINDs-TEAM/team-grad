import axiosInstance from './axiosInstance';

// company_admin
const getFleetStatusApi = () => axiosInstance.get('/fleet/status');
const getFleetDashboardApi =()=> axiosInstance.get('fleet/dashboard');
const getDriversApi = () => axiosInstance.get('/fleet/drivers');
const addVehicleApi = (data) => axiosInstance.post('/fleet/vehicles', data);
const inviteDriverApi = (data) => axiosInstance.post('/fleet/drivers/invite', data);
const sendAlertApi = (data) => axiosInstance.post('/fleet/alert', data);
const getMyTripApi = () => axiosInstance.get('/fleet-admin/my-trip');
const assignDriverApi = (vehicleId, driverId) =>
    axiosInstance.put(`/fleet/vehicles/${vehicleId}/assign`, { driverId });
const uploadVehiclePhotoApi = (vehicleId, formData) =>
    axiosInstance.post(`/fleet/vehicles/${vehicleId}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

// company_driver
const getMyVehicleApi = () => axiosInstance.get('/fleet/my-vehicle');

export {
    getFleetStatusApi,
    getFleetDashboardApi,
    getDriversApi,
    addVehicleApi,
    inviteDriverApi,
    sendAlertApi,
    uploadVehiclePhotoApi,
    getMyVehicleApi,
    assignDriverApi,
    getMyTripApi,
};