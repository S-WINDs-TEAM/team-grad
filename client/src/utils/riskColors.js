export const getRiskColor = (riskLevel) => {
  const colors = {
    low: "#10B981",
    medium: "#F59E0B",
    high: "#EF4444",
  };
  return colors[riskLevel] || "#64748B";
};

export const getRiskLabel = (riskLevel) => {
  const labels = {
    low: "🟢 Low Risk",
    medium: "🟡 Medium Risk",
    high: "🔴 High Risk",
  };
  return labels[riskLevel] || "⚪ Unknown";
};

export const getRiskPathColor = (riskLevel) => getRiskColor(riskLevel);
