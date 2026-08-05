import AnalyticsCharts from "../../components/fleet/AnalyticsCharts/AnalyticsCharts";
import AnalyticsInsightCard from "../../components/fleet/AnalyticsInsightCard";
import StatAnalyticsCard from "../../components/fleet/StatAnalyticsCard";

export default function FleetAnalyticsPage() {
  return (
    <>
      <main className="grow w-full px-page-margin py-8 container">
        {/* <!-- Page Header --> */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="font-display-lg text-display-lg text-primary">
              Analytics
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-surface-container-high border border-outline-variant rounded px-3 py-2 cursor-pointer hover:border-primary-fixed-dim transition-colors">
              <span className="material-symbols-outlined text-on-surface-variant mr-2 text-[18px]">
                calendar_today
              </span>
              <span className="font-body-md text-on-surface">Last 30 days</span>
              <span className="material-symbols-outlined text-on-surface-variant ml-4 text-[18px]">
                expand_more
              </span>
            </div>
            <button className="flex items-center gap-2 bg-primary-fixed-dim text-on-primary-fixed px-4 py-2 rounded font-label-sm text-label-sm font-bold hover:bg-primary-fixed transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-sm">
                download
              </span>
              Export Report
            </button>
          </div>
        </div>
        {/* <!-- Dashboard Grid Layout --> */}
        <div className="flex flex-col gap-widget-gap">
          {/* <!-- 1. Metric Cards (Top Row) --> */}
          <section className="grid grid-cols-1 md:grid-cols-4 gap-widget-gap">
            {/* <!-- Total Routes --> */}
            <StatAnalyticsCard
              title="Total Routes"
              precent="12"
              count={142}
              symbol="route"
              precentSymbol="%"
              active
            />
            {/* <!-- Avg Risk Score --> */}
            <StatAnalyticsCard
              title="Avg Risk Score"
              precent="-0.6"
              symbol="speed"
              count={3.4}
              countOf="/10"
              active
            />
            {/* <!-- Weather Delays --> */}
            <StatAnalyticsCard
              title="Weather Delays"
              count="8%"
              symbol="rainy"
              active
            />
            {/* <!-- Fuel Impact --> */}

            <StatAnalyticsCard
              title="Fuel Impact"
              count="+8%"
              symbol="local_gas_station"
              active={false}
            />
          </section>
          {/* <!-- 2. Charts (Middle Sections) --> */}
          <section className="grid grid-cols-1 lg:grid-cols-2  gap-widget-gap mb-2">
            <AnalyticsCharts />
          </section>
          {/* <!-- 3. Insight Cards (Bottom Row) --> */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-widget-gap mb-25">
            {/* <!-- Key Finding --> */}

            <AnalyticsInsightCard
              title="Key Finding"
              text="75% of high-risk routes occur between 12PM-5PM"
              symbol="search"
              active
            />
            {/* <!-- Alert --> */}

            <AnalyticsInsightCard
              title="Alert"
              text="Trucks show 1.8x higher risk than cars across all corridors"
              symbol="warning"
            />
            {/* <!-- Insight --> */}

            <AnalyticsInsightCard
              title="Insight"
              text="Cairo-Hurghada corridor is the most affected by weather events"
              symbol="lightbulb"
              active
            />
          </section>
        </div>
      </main>

      <footer class="bottom-0 border-t border-outline-variant fixed left-0 w-full z-50 flex items-center justify-between px-page-margin bg-surface-container-low text-primary-fixed-dim flex-col xl:flex-row h-auto xl:h-bottom-bar-height py-2">
        <div class="font-label-sm text-label-sm text-on-surface-variant text-center xl:text-left mb-1">
          © 2026 S-Winds Fleet Intelligence
        </div>
        <div class="flex items-center gap-2 xl:gap-6 flex-wrap justify-center xl:justify-end space-y-1">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-primary-fixed-dim"></span>
            <span class="font-label-sm text-label-sm text-on-surface-variant">
              Active Vehicles:
            </span>
            <span class="font-data-lg text-[16px] font-bold">256</span>
          </div>
          <div class="w-px h-1 xl:h-4 bg-outline-variant hidden xl:block"></div>
          <div class="flex items-center gap-2">
            <span class="font-label-sm text-label-sm text-on-surface-variant">
              Routes Today:
            </span>
            <span class="font-data-lg text-[16px] font-bold text-primary">
              142
            </span>
          </div>
          <div class="w-px h-1 xl:h-4 bg-outline-variant hidden xl:block"></div>
          <div class="flex items-center gap-2">
            <span class="font-label-sm text-label-sm text-on-surface-variant">
              Alerts:
            </span>
            <span class="font-data-lg text-[16px] font-bold text-error">
              12
            </span>
          </div>
          <div class="w-px h-1 xl:h-4 bg-outline-variant hidden xl:block"></div>
          <div class="flex items-center gap-2">
            <span class="font-label-sm text-label-sm text-on-surface-variant">
              High Risk Routes:
            </span>
            <span class="font-data-lg text-[16px] font-bold text-error">
              18
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
