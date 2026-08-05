import { COLORS } from "../../../styles/theme";
import defaultColorForValue from "./defaultColorHelper";
import EmptyState from "./EmptyState";

export default function RiskVerticalBarChart({
  data,
  maxValue,
  xAxisLabel,
  yAxisLabel = "Avg Risk Score",
  colorFn = defaultColorForValue,
}) {
  if (!data || data.length === 0) return <EmptyState />;

  const effectiveMax = maxValue || 10;
  const left = 44,
    right = 480,
    top = 20,
    bottom = 165;
  const n = data.length;
  const colW = (right - left) / n;
  const barW = Math.min(50, colW * 0.5);

  const gridSteps = 5;
  const gridValues = Array.from(
    { length: gridSteps + 1 },
    (_, i) => (effectiveMax / gridSteps) * i,
  );

  return (
    <svg
      viewBox="0 0 500 215"
      width="100%"
      height="100%"
      preserveAspectRatio="none"
    >
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

      {data.map((d, i) => {
        const cx = left + colW * i + colW / 2;
        const h = Math.max((d.value / effectiveMax) * (bottom - top), 2);
        const y = bottom - h;
        const color = colorFn(d.value, effectiveMax);
        return (
          <g key={i}>
            <rect
              x={cx - barW / 2}
              y={y}
              width={barW}
              height={h}
              fill={color}
              rx="2"
            />
            <text
              x={cx}
              y={y - 6}
              textAnchor="middle"
              fontSize="10"
              fontWeight="bold"
              fill="#fff"
              style={{
                paintOrder: "stroke",
                stroke: COLORS.card,
                strokeWidth: 3,
              }}
            >
              {d.value}
            </text>
            <text
              x={cx}
              y={bottom + 18}
              textAnchor="middle"
              fontSize="10"
              fill={COLORS.textMuted}
            >
              {d.label}
            </text>
          </g>
        );
      })}

      {xAxisLabel && (
        <text
          x={(left + right) / 2}
          y={bottom + 34}
          textAnchor="middle"
          fontSize="10"
          fill={COLORS.textMuted}
        >
          {xAxisLabel}
        </text>
      )}
    </svg>
  );
}
