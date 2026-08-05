import { COLORS } from "../../../styles/theme";

export default function defaultColorForValue(value, max) {
  const pct = max > 0 ? value / max : 0;
  if (pct >= 0.65) return COLORS.red;
  if (pct >= 0.35) return COLORS.orange;
  return COLORS.green;
}
