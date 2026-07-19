// vehicle status -> color, mirrors the pattern in utils/riskColors.js but for FleetVehicle.status
const getFleetStatusColor = (status) => {
    const colors = {
        active: '#10B981',  // theme.accentGreen
        idle: '#F59E0B',    // theme.accentOrange
        offline: '#EF4444', // theme.accentRed
    };
    return colors[status] || '#64748B';
};

const getFleetStatusLabel = (status) => {
    const labels = {
        active: 'On the Move',
        idle: 'Idle',
        offline: 'Offline',
    };
    return labels[status] || 'Unknown';
};

export { getFleetStatusColor, getFleetStatusLabel };