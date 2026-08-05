/*  Area / trend chart  */

import { COLORS } from "../../../styles/theme";
import EmptyState from "./EmptyState";

// Used for "Risk Trend (Last 30 Days)"
export default function RiskTrendChart({
  data,
  maxValue,
  color = COLORS.teal,
  yAxisLabel = "Avg  Risk  Score",
  maxLabels = 9,
}) {
  if (!data || data.length === 0) return <EmptyState />;

  const values = data.map((d) => d.value);
  const effectiveMax = maxValue || 10;
  const left = 44,
    right = 480,
    top = 20,
    bottom = 175;
  const n = data.length;

  const points = data.map((d, i) => {
    const x =
      n === 1 ? (left + right) / 2 : left + (i * (right - left)) / (n - 1);
    const y =
      bottom -
      (Math.min(Math.max(d.value, 0), effectiveMax) / effectiveMax) *
        (bottom - top);
    return { x, y, ...d };
  });

  // Smooth-ish path using midpoint cubic control points (no library needed)
  let linePath = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1],
      p = points[i];
    const midX = (prev.x + p.x) / 2;
    linePath += ` C ${midX} ${prev.y}, ${midX} ${p.y}, ${p.x} ${p.y}`;
  }
  const areaPath = `${linePath} L ${points[n - 1].x} ${bottom} L ${points[0].x} ${bottom} Z`;

  const gridSteps = 5;
  const gridValues = Array.from(
    { length: gridSteps + 1 },
    (_, i) => (effectiveMax / gridSteps) * i,
  );

  const labelStride = Math.max(1, Math.ceil(n / maxLabels));
  const labelIndices = points
    .map((_, i) => i)
    .filter((i) => i % labelStride === 0 || i === n - 1);

  let maxIdx = 0;
  values.forEach((v, i) => {
    if (v > values[maxIdx]) maxIdx = i;
  });
  const calloutIdx = new Set([0, n - 1]);
  if (maxIdx !== 0 && maxIdx !== n - 1) calloutIdx.add(maxIdx);

  const gradId = `grad-10`;

  return (
    <svg
      viewBox="0 0 500 210"
      width="100%"
      height="100%"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {gridValues.map((gv, i) => {
        const y = bottom - (gv / effectiveMax) * (bottom - top);
        return (
          <g key={i}>
            <line
              x1={left}
              x2={right}
              y1={y}
              y2={y}
              stroke={COLORS.grid}
              strokeWidth="1"
            />
            <text
              x={left - 10}
              y={y + 4}
              textAnchor="end"
              fontSize="10"
              fill={COLORS.textMuted}
            >
              {Math.round(gv * 10) / 10}
            </text>
          </g>
        );
      })}

      <text
        fontSize="10"
        fill={COLORS.textMuted}
        transform={`translate(14, ${(top + bottom) / 2}) rotate(-90)`}
        textAnchor="middle"
      >
        {yAxisLabel}
      </text>

      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" />

      {points.map((p, i) => (
        <g key={i}>
          <circle
            cx={p.x}
            cy={p.y}
            r={calloutIdx.has(i) ? 3.5 : 2}
            fill={color}
          />
          {calloutIdx.has(i) && (
            <text
              x={p.x}
              y={p.y - 10}
              textAnchor={i === n - 1 ? "end" : i === 0 ? "start" : "middle"}
              fontSize="11"
              fontWeight="bold"
              fill={color}
            >
              {p.value}
            </text>
          )}
        </g>
      ))}

      {labelIndices.map((i) => (
        <text
          key={i}
          x={points[i].x}
          y={bottom + 18}
          textAnchor="middle"
          fontSize="9"
          fill={COLORS.textMuted}
        >
          {data[i].label}
        </text>
      ))}
    </svg>
  );
}
