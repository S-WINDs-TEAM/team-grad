const getRiskColor = (riskLevel)=> {
    const colors = {
        low : '#00e5cc',
        medium: '#f5a623',
        high: '#ff4d4d',

    };
    return colors[riskLevel] || '#8a93a3';
};

const getRiskLabel = (riskLevel) => {
    const labels = {
        low: "safe",
        medium: "caution",
        high: 'hazard',
    };
    return labels[riskLevel] || 'unknown';
};
const theme = {
    bg: '#0a0e14',
    cardBg: '#11151c',
    primaryAccent: '#d4ff00',
    textSecondary: '#8a93a3',
    border: 'rgba(212, 255, 0, 0.25)',
}

export  {getRiskColor, getRiskLabel, theme};