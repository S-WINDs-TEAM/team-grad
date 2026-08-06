import { COLORS } from "../../../../styles/theme";
import defaultColorForValue from "./defaultColorHelper";
import EmptyState from "./EmptyState";

export default function RiskHorizontalBarChart({
  data,
  maxValue,
  xAxisLabel = "Avg Risk Score",
  colorFn = defaultColorForValue,
  sortDescending = false,
}) {
  if (!data || data.length === 0) return <EmptyState />;

  const rows = sortDescending
    ? [...data].sort((a, b) => b.value - a.value)
    : data;
  const effectiveMax = maxValue || 10;

  const longestLabel = Math.max(...rows.map((r) => String(r.label).length));
  const left = Math.min(190, Math.max(90, 55 + longestLabel * 6));
  const right = 480,
    top = 15,
    bottom = 175;
  const n = rows.length;
  const rowH = (bottom - top) / n;
  const barH = Math.min(18, rowH * 0.55);

  const gridSteps = 5;
  const gridValues = Array.from(
    { length: gridSteps + 1 },
    (_, i) => (effectiveMax / gridSteps) * i,
  );

  return (
    <svg
      viewBox="0 0 500 205"
      width="100%"
      height="100%"
      preserveAspectRatio="none"
    >
      {gridValues.map((gv, i) => {
        const x = left + (gv / effectiveMax) * (right - left);
        return (
          <g key={i}>
            <line
              x1={x}
              x2={x}
              y1={top}
              y2={bottom}
              stroke={COLORS.grid}
              strokeWidth="1"
            />
            <text
              x={x}
              y={bottom + 15}
              textAnchor="middle"
              fontSize="10"
              fill={COLORS.textMuted}
            >
              {Math.round(gv * 10) / 10}
            </text>
          </g>
        );
      })}
      <text
        x={(left + right) / 2}
        y={bottom + 30}
        textAnchor="middle"
        fontSize="10"
        fill={COLORS.textMuted}
      >
        {xAxisLabel}
      </text>
      <line
        x1={left}
        x2={left}
        y1={top}
        y2={bottom}
        stroke={COLORS.textMuted}
        strokeWidth="1"
      />

      {rows.map((r, i) => {
        const y = top + i * rowH + (rowH - barH) / 2;
        const w = Math.max((r.value / effectiveMax) * (right - left), 2);
        const color = colorFn(r.value, effectiveMax);
        return (
          <g key={i}>
            <text
              x={left - 8}
              y={y + barH / 2 + 4}
              textAnchor="end"
              fontSize="10"
              fill={COLORS.textMuted}
            >
              {r.label}
            </text>
            <rect x={left} y={y} width={w} height={barH} fill={color} rx="2" />
            <text
              x={left + w - 6}
              y={y + barH / 2 + 4}
              textAnchor="end"
              fontSize="10"
              fontWeight="bold"
              fill="#fff"
            >
              {r.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
