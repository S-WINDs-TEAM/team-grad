import { COLORS } from "../../../../styles/theme";

export default function EmptyState() {
  return (
    <div
      className="flex items-center justify-center h-full text-sm"
      style={{ color: COLORS.textMuted }}
    >
      No data available
    </div>
  );
}
