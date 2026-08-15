import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { upsertVehicle, addAlert, setConnected } from '../store/fleetSlice';

const SOCKET_URL = 'http://localhost:5000';

// connects to the fleet socket for company_admin and company_driver accounts only.
// auth is handled server-side via the httpOnly accessToken cookie (see socketManager.js) —
// withCredentials: true is what makes the browser attach it during the handshake, same as axiosInstance.
const useSocket = () => {
    const dispatch = useDispatch();
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const socketRef = useRef(null);

    useEffect(() => {
        if (!isAuthenticated || !user) return;
        if (user.role !== 'company_admin' && user.role !== 'company_driver') return;

        const socket = io(SOCKET_URL, { withCredentials: true });
        socketRef.current = socket;

        socket.on('connect', () => dispatch(setConnected(true)));
        socket.on('disconnect', () => dispatch(setConnected(false)));

        socket.on('fleet:update', (vehicle) => {
            dispatch(upsertVehicle(vehicle));
        });

        socket.on('fleet:alert', (alert) => {
            dispatch(addAlert(alert));
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [isAuthenticated, user, dispatch]);

    // company_driver's tracking screen calls this on every geolocation update
    const sendLocation = (lat, lng) => {
        socketRef.current?.emit('driver:location', { lat, lng });
    };

    // company_admin dashboard: send an alert via socket instead of a REST call
    const sendFleetAlert = ({ vehicleIds, message, alertType }) => {
        socketRef.current?.emit('fleet:alert', { vehicleIds, message, alertType });
    };

    return { sendLocation, sendFleetAlert };
};

export default useSocket;