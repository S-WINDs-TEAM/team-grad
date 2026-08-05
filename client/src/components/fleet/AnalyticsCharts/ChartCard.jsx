import { COLORS } from "../../../styles/theme";

export default function ChartCard({ title, children }) {
  return (
    <article
      style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
      className="rounded-lg p-7 flex flex-col h-80"
    >
      <h3
        style={{ color: COLORS.textPrimary }}
        className="text-base font-semibold mb-1"
      >
        {title}
      </h3>
      <div className="grow relative w-full h-full">{children}</div>
    </article>
  );
}
