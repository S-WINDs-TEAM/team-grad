import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { mapRoutes, vehicles } from '../data/dashboard';

export function useFleet() {
  const [selectedVehicleId, setSelectedVehicleId] = useState('SW-TRK-005');
  const [selectedDeparture, setSelectedDeparture] = useState('7:00 AM');

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? vehicles[0],
    [selectedVehicleId],
  );

  const selectedRoute = useMemo(
    () => mapRoutes.find((route) => route.vehicleId === selectedVehicleId) ?? mapRoutes[2],
    [selectedVehicleId],
  );

  const selectVehicle = useCallback((vehicleId) => {
    setSelectedVehicleId(vehicleId);
  }, []);

  const selectRoute = useCallback((vehicleId) => {
    setSelectedVehicleId(vehicleId);
  }, []);

  const setDeparture = useCallback((time) => {
    setSelectedDeparture(time);
    toast.success('Departure time changed');
  }, []);

  const updateDecision = useCallback((decision) => {
    if (decision === 'Approved') toast.success('Route approved');
    if (decision === 'Blocked') toast.error('Route blocked');
    if (decision === 'Review') toast.warning('Route sent for review');
  }, []);

  return {
    selectedDeparture,
    selectedRoute,
    selectedVehicle,
    selectedVehicleId,
    selectRoute,
    selectVehicle,
    setDeparture,
    updateDecision,
  };
}
