export default function StatAnalyticsCard({
  title,
  precent,
  count,
  symbol,
  countOf,
  precentSymbol,
  active,
}) {
  return (
    <article className="bg-surface border border-outline-variant rounded-lg p-4 flex items-center gap-4">
      <div
        className={`w-12 h-12 rounded-full border-2 ${active ? "border-primary-fixed-dim" : "border-[#ffb74d]"} flex items-center justify-center`}
      >
        <span
          className={`material-symbols-outlined ${active ? "text-primary-fixed-dim" : "text-[#ffb74d]"}`}
        >
          {symbol}
        </span>
      </div>
      <div className="grow">
        <p className="font-body-md text-on-surface-variant">{title}</p>
        <div className="flex items-baseline justify-between">
          <span
            className={`font-data-lg text-data-lg ${active ? "text-primary" : "text-[#ffb74d]"}`}
          >
            {count}
            <span className="font-body-md text-on-surface-variant text-body-md">
              {countOf}
            </span>
          </span>
          {!precent ? (
            ""
          ) : Number(precent) > 0 ? (
            <span
              className={`font-body-md ${active ? "text-primary-fixed-dim" : "text-[#ffb74d]"} flex items-center`}
            >
              <span className="material-symbols-outlined text-[16px]">
                arrow_upward
              </span>
              {precent}
              {precentSymbol}
            </span>
          ) : (
            <span className="font-body-md text-error flex items-center">
              <span className="material-symbols-outlined text-[16px]">
                arrow_downward
              </span>
              {precent}
              {precentSymbol}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
