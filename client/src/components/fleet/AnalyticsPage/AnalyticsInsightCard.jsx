export default function AnalyticsInsightCard({ title, symbol, text, active }) {
  return (
    <article className="bg-surface border border-outline-variant rounded-lg p-4 flex items-center gap-4">
      <div
        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shrink-0 ${active ? "border-primary-fixed-dim" : "border-[#ffb74d]"}`}
      >
        <span
          className={`material-symbols-outlined ${active ? "text-primary-fixed-dim" : "text-[#ffb74d]"}`}
        >
          {symbol}
        </span>
      </div>
      <div>
        <h3
          className={`font-title-lg text-title-lg ${active ? "text-primary-fixed-dim" : "text-[#ffb74d]"} mb-1`}
        >
          {title}
        </h3>
        <p className="font-body-md text-on-surface">{text}</p>
      </div>
    </article>
  );
}
