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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-widget-gap">
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
          </div>
          {/* <!-- 2. Charts (Middle Sections) --> */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-widget-gap">
            {/* <!-- Risk Trend (Last 30 Days) --> */}
            <div className="bg-surface border border-outline-variant rounded-lg p-container-padding flex flex-col h-75">
              <h3 className="font-title-lg text-title-lg text-primary mb-4">
                Risk Trend (Last 30 Days)
              </h3>
              <div className="grow relative w-full h-full">
                <svg
                  height="100%"
                  preserveAspectRatio="none"
                  viewBox="0 0 500 200"
                  width="100%"
                >
                  {/* <!-- Y Axis Grid --> */}
                  <line
                    className="grid-line"
                    x1="40"
                    x2="480"
                    y1="20"
                    y2="20"
                  ></line>
                  <text
                    className="text-xs-custom text-right"
                    textAnchor="end"
                    x="30"
                    y="24"
                  >
                    10
                  </text>
                  <line
                    className="grid-line"
                    x1="40"
                    x2="480"
                    y1="56"
                    y2="56"
                  ></line>
                  <text
                    className="text-xs-custom text-right"
                    textAnchor="end"
                    x="30"
                    y="60"
                  >
                    8
                  </text>
                  <line
                    className="grid-line"
                    x1="40"
                    x2="480"
                    y1="92"
                    y2="92"
                  ></line>
                  <text
                    className="text-xs-custom text-right"
                    textAnchor="end"
                    x="30"
                    y="96"
                  >
                    6
                  </text>
                  <line
                    className="grid-line"
                    x1="40"
                    x2="480"
                    y1="128"
                    y2="128"
                  ></line>
                  <text
                    className="text-xs-custom text-right"
                    textAnchor="end"
                    x="30"
                    y="132"
                  >
                    4
                  </text>
                  <line
                    className="grid-line"
                    x1="40"
                    x2="480"
                    y1="164"
                    y2="164"
                  ></line>
                  <text
                    className="text-xs-custom text-right"
                    textAnchor="end"
                    x="30"
                    y="168"
                  >
                    2
                  </text>
                  <line
                    stroke="#83958c"
                    strokeWidth="1"
                    x1="40"
                    x2="480"
                    y1="200"
                    y2="200"
                  ></line>
                  <text
                    className="text-xs-custom text-right"
                    textAnchor="end"
                    x="30"
                    y="204"
                  >
                    0
                  </text>
                  {/* <!-- Y Axis Label --> */}
                  <text
                    className="text-xs-custom"
                    transform="rotate(-90)"
                    x="-110"
                    y="15"
                  >
                    Avg Risk Score
                  </text>
                  {/* <!-- Area Chart --> */}
                  <defs>
                    <lineargradient
                      id="trendGradient"
                      x1="0"
                      x2="0"
                      y1="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#00e1ab"
                        stopOpacity="0.3"
                      ></stop>
                      <stop
                        offset="100%"
                        stopColor="#00e1ab"
                        stopOpacity="0"
                      ></stop>
                    </lineargradient>
                  </defs>
                  <path
                    d="M40 124.4 C 100 130, 150 140, 240 146 C 300 130, 380 140, 480 131.6 L480 200 L40 200 Z"
                    fill="url(#trendGradient)"
                  ></path>
                  <path
                    d="M40 124.4 C 100 130, 150 140, 240 146 C 300 130, 380 140, 480 131.6"
                    fill="none"
                    stroke="#00e1ab"
                    strokeWidth="2"
                  ></path>
                  {/* <!-- Points and Labels --> */}
                  <circle cx="40" cy="124.4" fill="#00e1ab" r="3"></circle>
                  <text
                    className="text-xs-custom font-bold"
                    fill="#00e1ab"
                    x="50"
                    y="118"
                  >
                    4.2
                  </text>
                  <circle cx="240" cy="146" fill="#00e1ab" r="3"></circle>
                  <text
                    className="text-xs-custom font-bold"
                    fill="#00e1ab"
                    x="250"
                    y="140"
                  >
                    3.0
                  </text>
                  <circle cx="480" cy="131.6" fill="#00e1ab" r="3"></circle>
                  <text
                    className="text-xs-custom font-bold"
                    fill="#00e1ab"
                    textAnchor="end"
                    x="470"
                    y="125"
                  >
                    3.8
                  </text>
                  {/* <!-- X Axis Labels --> */}
                  <text
                    className="text-xs-custom"
                    textAnchor="middle"
                    x="40"
                    y="215"
                  >
                    Jan 1
                  </text>
                  <text
                    className="text-xs-custom"
                    textAnchor="middle"
                    x="95"
                    y="215"
                  >
                    Jan 4
                  </text>
                  <text
                    className="text-xs-custom"
                    textAnchor="middle"
                    x="150"
                    y="215"
                  >
                    Jan 7
                  </text>
                  <text
                    className="text-xs-custom"
                    textAnchor="middle"
                    x="205"
                    y="215"
                  >
                    Jan 10
                  </text>
                  <text
                    className="text-xs-custom"
                    textAnchor="middle"
                    x="260"
                    y="215"
                  >
                    Jan 13
                  </text>
                  <text
                    className="text-xs-custom"
                    textAnchor="middle"
                    x="315"
                    y="215"
                  >
                    Jan 16
                  </text>
                  <text
                    className="text-xs-custom"
                    textAnchor="middle"
                    x="370"
                    y="215"
                  >
                    Jan 19
                  </text>
                  <text
                    className="text-xs-custom"
                    textAnchor="middle"
                    x="425"
                    y="215"
                  >
                    Jan 22
                  </text>
                  <text
                    className="text-xs-custom"
                    textAnchor="middle"
                    x="480"
                    y="215"
                  >
                    Jan 28
                  </text>
                </svg>
              </div>
            </div>
            {/* <!-- Most Risky Corridors --> */}
            <div className="bg-surface border border-outline-variant rounded-lg p-container-padding flex flex-col h-75">
              <h3 className="font-title-lg text-title-lg text-primary mb-4">
                Most Risky Corridors
              </h3>
              <div className="grow relative w-full h-full">
                <svg
                  height="100%"
                  preserveAspectRatio="none"
                  viewBox="0 0 500 200"
                  width="100%"
                >
                  {/* <!-- X Axis Grid --> */}
                  <line
                    className="grid-line"
                    x1="120"
                    x2="120"
                    y1="20"
                    y2="180"
                  ></line>
                  <text
                    className="text-xs-custom"
                    textAnchor="middle"
                    x="120"
                    y="195"
                  >
                    0
                  </text>
                  <line
                    className="grid-line"
                    x1="192"
                    x2="192"
                    y1="20"
                    y2="180"
                  ></line>
                  <text
                    className="text-xs-custom"
                    textAnchor="middle"
                    x="192"
                    y="195"
                  >
                    2
                  </text>
                  <line
                    className="grid-line"
                    x1="264"
                    x2="264"
                    y1="20"
                    y2="180"
                  ></line>
                  <text
                    className="text-xs-custom"
                    textAnchor="middle"
                    x="264"
                    y="195"
                  >
                    4
                  </text>
                  <line
                    className="grid-line"
                    x1="336"
                    x2="336"
                    y1="20"
                    y2="180"
                  ></line>
                  <text
                    className="text-xs-custom"
                    textAnchor="middle"
                    x="336"
                    y="195"
                  >
                    6
                  </text>
                  <line
                    className="grid-line"
                    x1="408"
                    x2="408"
                    y1="20"
                    y2="180"
                  ></line>
                  <text
                    className="text-xs-custom"
                    textAnchor="middle"
                    x="408"
                    y="195"
                  >
                    8
                  </text>
                  <line
                    className="grid-line"
                    x1="480"
                    x2="480"
                    y1="20"
                    y2="180"
                  ></line>
                  <text
                    className="text-xs-custom"
                    textAnchor="middle"
                    x="480"
                    y="195"
                  >
                    10
                  </text>
                  {/* <!-- X Axis Label --> */}
                  <text
                    className="text-xs-custom"
                    textAnchor="middle"
                    x="300"
                    y="210"
                  >
                    Avg Risk Score
                  </text>
                  {/* <!-- Y Axis Line --> */}
                  <line
                    stroke="#83958c"
                    strokeWidth="1"
                    x1="120"
                    x2="120"
                    y1="20"
                    y2="180"
                  ></line>
                  {/* <!-- Bars --> */}
                  {/* <!-- Cairo->Hurghada --> */}
                  <text
                    className="text-xs-custom text-right"
                    textAnchor="end"
                    x="110"
                    y="35"
                  >
                    Cairo→Hurghada
                  </text>
                  <rect
                    fill="#f44336"
                    height="15"
                    width="259.2"
                    x="120"
                    y="25"
                  ></rect>
                  <text
                    className="text-xs-custom font-bold"
                    fill="#fff"
                    x="385"
                    y="36"
                  >
                    7.2
                  </text>
                  {/* <!-- Cairo->Asyut --> */}
                  <text
                    className="text-xs-custom text-right"
                    textAnchor="end"
                    x="110"
                    y="60"
                  >
                    Cairo→Asyut
                  </text>
                  <rect
                    fill="#f44336"
                    height="15"
                    width="244.8"
                    x="120"
                    y="50"
                  ></rect>
                  <text
                    className="text-xs-custom font-bold"
                    fill="#fff"
                    x="370"
                    y="61"
                  >
                    6.8
                  </text>
                  {/* <!-- Cairo->Suez --> */}
                  <text
                    className="text-xs-custom text-right"
                    textAnchor="end"
                    x="110"
                    y="85"
                  >
                    Cairo→Suez
                  </text>
                  <rect
                    fill="#ffb74d"
                    height="15"
                    width="162"
                    x="120"
                    y="75"
                  ></rect>
                  <text
                    className="text-xs-custom font-bold"
                    fill="#fff"
                    x="288"
                    y="86"
                  >
                    4.5
                  </text>
                  {/* <!-- Cairo->Damanhur --> */}
                  <text
                    className="text-xs-custom text-right"
                    textAnchor="end"
                    x="110"
                    y="110"
                  >
                    Cairo→Damanhur
                  </text>
                  <rect
                    fill="#ffb74d"
                    height="15"
                    width="187.2"
                    x="120"
                    y="100"
                  ></rect>
                  <text
                    className="text-xs-custom font-bold"
                    fill="#fff"
                    x="313"
                    y="111"
                  >
                    5.2
                  </text>
                  {/* <!-- Cairo->Alexandria --> */}
                  <text
                    className="text-xs-custom text-right"
                    textAnchor="end"
                    x="110"
                    y="135"
                  >
                    Cairo→Alexandria
                  </text>
                  <rect
                    fill="#4caf50"
                    height="15"
                    width="75.6"
                    x="120"
                    y="125"
                  ></rect>
                  <text
                    className="text-xs-custom font-bold"
                    fill="#fff"
                    x="202"
                    y="136"
                  >
                    2.1
                  </text>
                  {/* <!-- Cairo->Port Said --> */}
                  <text
                    className="text-xs-custom text-right"
                    textAnchor="end"
                    x="110"
                    y="160"
                  >
                    Cairo→Port Said
                  </text>
                  <rect
                    fill="#4caf50"
                    height="15"
                    width="64.8"
                    x="120"
                    y="150"
                  ></rect>
                  <text
                    className="text-xs-custom font-bold"
                    fill="#fff"
                    x="191"
                    y="161"
                  >
                    1.8
                  </text>
                </svg>
              </div>
            </div>
            {/* <!-- Risk by Time of Day --> */}
            <div className="bg-surface border border-outline-variant rounded-lg p-container-padding flex flex-col h-75">
              <h3 className="font-title-lg text-title-lg text-primary mb-4">
                Risk by Time of Day
              </h3>
              <div className="grow relative w-full h-full">
                <svg
                  height="100%"
                  preserveAspectRatio="none"
                  viewBox="0 0 500 200"
                  width="100%"
                >
                  {/* <!-- Y Axis Grid --> */}
                  <line
                    className="grid-line"
                    x1="40"
                    x2="480"
                    y1="20"
                    y2="20"
                  ></line>
                  <text
                    className="text-xs-custom text-right"
                    textAnchor="end"
                    x="30"
                    y="24"
                  >
                    10
                  </text>
                  <line
                    className="grid-line"
                    x1="40"
                    x2="480"
                    y1="56"
                    y2="56"
                  ></line>
                  <text
                    className="text-xs-custom text-right"
                    textAnchor="end"
                    x="30"
                    y="60"
                  >
                    8
                  </text>
                  <line
                    className="grid-line"
                    x1="40"
                    x2="480"
                    y1="92"
                    y2="92"
                  ></line>
                  <text
                    className="text-xs-custom text-right"
                    textAnchor="end"
                    x="30"
                    y="96"
                  >
                    6
                  </text>
                  <line
                    className="grid-line"
                    x1="40"
                    x2="480"
                    y1="128"
                    y2="128"
                  ></line>
                  <text
                    className="text-xs-custom text-right"
                    textAnchor="end"
                    x="30"
                    y="132"
                  >
                    4
                  </text>
                  <line
                    className="grid-line"
                    x1="40"
                    x2="480"
                    y1="164"
                    y2="164"
                  ></line>
                  <text
                    className="text-xs-custom text-right"
                    textAnchor="end"
                    x="30"
                    y="168"
                  >
                    2
                  </text>
                  <line
                    stroke="#83958c"
                    strokeWidth="1"
                    x1="40"
                    x2="480"
                    y1="200"
                    y2="200"
                  ></line>
                  <text
                    className="text-xs-custom text-right"
                    textAnchor="end"
                    x="30"
                    y="204"
                  >
                    0
                  </text>
                  {/* <!-- Y Axis Label --> */}
                  <text
                    className="text-xs-custom"
                    transform="rotate(-90)"
                    x="-110"
                    y="15"
                  >
                    Avg Risk Score
                  </text>
                  {/* <!-- Bars --> */}
                  {/* <!-- 6AM --> */}
                  <rect
                    fill="#4caf50"
                    height="37.8"
                    width="30"
                    x="70"
                    y="162.2"
                  ></rect>
                  <text
                    className="text-xs-custom font-bold"
                    fill="#fff"
                    textAnchor="middle"
                    x="85"
                    y="157"
                  >
                    2.1
                  </text>
                  <text
                    className="text-xs-custom"
                    textAnchor="middle"
                    x="85"
                    y="215"
                  >
                    6AM
                  </text>
                  {/* <!-- 8AM --> */}
                  <rect
                    fill="#4caf50"
                    height="45"
                    width="30"
                    x="125"
                    y="155"
                  ></rect>
                  <text
                    className="text-xs-custom font-bold"
                    fill="#fff"
                    textAnchor="middle"
                    x="140"
                    y="150"
                  >
                    2.5
                  </text>
                  <text
                    className="text-xs-custom"
                    textAnchor="middle"
                    x="140"
                    y="215"
                  >
                    8AM
                  </text>
                  {/* <!-- 10AM --> */}
                  <rect
                    fill="#4caf50"
                    height="57.6"
                    width="30"
                    x="180"
                    y="142.4"
                  ></rect>
                  <text
                    className="text-xs-custom font-bold"
                    fill="#fff"
                    textAnchor="middle"
                    x="195"
                    y="137"
                  >
                    3.2
                  </text>
                  <text
                    className="text-xs-custom"
                    textAnchor="middle"
                    x="195"
                    y="215"
                  >
                    10AM
                  </text>
                  {/* <!-- 12PM --> */}
                  <rect
                    fill="#ffb74d"
                    height="104.4"
                    width="30"
                    x="235"
                    y="95.6"
                  ></rect>
                  <text
                    className="text-xs-custom font-bold"
                    fill="#fff"
                    textAnchor="middle"
                    x="250"
                    y="90"
                  >
                    5.8
                  </text>
                  <text
                    className="text-xs-custom"
                    textAnchor="middle"
                    x="250"
                    y="215"
                  >
                    12PM
                  </text>
                  <text
                    className="text-xs-custom"
                    textAnchor="middle"
                    x="250"
                    y="230"
                  >
                    Time of Day
                  </text>
                  {/* <!-- 2PM --> */}
                  <rect
                    fill="#f44336"
                    height="140.4"
                    width="30"
                    x="290"
                    y="59.6"
                  ></rect>
                  <text
                    className="text-xs-custom font-bold"
                    fill="#fff"
                    textAnchor="middle"
                    x="305"
                    y="54"
                  >
                    7.8
                  </text>
                  <text
                    className="text-xs-custom"
                    textAnchor="middle"
                    x="305"
                    y="215"
                  >
                    2PM
                  </text>
                  {/* <!-- 4PM --> */}
                  <rect
                    fill="#ffb74d"
                    height="91.8"
                    width="30"
                    x="345"
                    y="108.2"
                  ></rect>
                  <text
                    className="text-xs-custom font-bold"
                    fill="#fff"
                    textAnchor="middle"
                    x="360"
                    y="103"
                  >
                    5.1
                  </text>
                  <text
                    className="text-xs-custom"
                    textAnchor="middle"
                    x="360"
                    y="215"
                  >
                    4PM
                  </text>
                  {/* <!-- 6PM --> */}
                  <rect
                    fill="#4caf50"
                    height="54"
                    width="30"
                    x="400"
                    y="146"
                  ></rect>
                  <text
                    className="text-xs-custom font-bold"
                    fill="#fff"
                    textAnchor="middle"
                    x="415"
                    y="141"
                  >
                    3.0
                  </text>
                  <text
                    className="text-xs-custom"
                    textAnchor="middle"
                    x="415"
                    y="215"
                  >
                    6PM
                  </text>
                  {/* <!-- 8PM --> */}
                  <rect
                    fill="#4caf50"
                    height="39.6"
                    width="30"
                    x="455"
                    y="160.4"
                  ></rect>
                  <text
                    className="text-xs-custom font-bold"
                    fill="#fff"
                    textAnchor="middle"
                    x="470"
                    y="155"
                  >
                    2.2
                  </text>
                  <text
                    className="text-xs-custom"
                    textAnchor="middle"
                    x="470"
                    y="215"
                  >
                    8PM
                  </text>
                </svg>
              </div>
            </div>
          </div>
          {/* <!-- 3. Insight Cards (Bottom Row) --> */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-widget-gap mb-10">
            {/* <!-- Key Finding --> */}
            <div className="bg-surface border border-outline-variant rounded-lg p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-primary-fixed-dim flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary-fixed-dim">
                  search
                </span>
              </div>
              <div>
                <p className="font-title-lg text-title-lg text-primary-fixed-dim mb-1">
                  Key Finding
                </p>
                <p className="font-body-md text-on-surface">
                  75% of high-risk routes occur between 12PM-5PM
                </p>
              </div>
            </div>
            {/* <!-- Alert --> */}
            <div className="bg-surface border border-outline-variant rounded-lg p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-[#ffb74d] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#ffb74d]">
                  warning
                </span>
              </div>
              <div>
                <p className="font-title-lg text-title-lg text-[#ffb74d] mb-1">
                  Alert
                </p>
                <p className="font-body-md text-on-surface">
                  Trucks show 1.8x higher risk than cars across all corridors
                </p>
              </div>
            </div>
            {/* <!-- Insight --> */}
            <div className="bg-surface border border-outline-variant rounded-lg p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-primary-fixed-dim flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary-fixed-dim">
                  lightbulb
                </span>
              </div>
              <div>
                <p className="font-title-lg text-title-lg text-primary-fixed-dim mb-1">
                  Insight
                </p>
                <p className="font-body-md text-on-surface">
                  Cairo-Hurghada corridor is the most affected by weather events
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="docked full-width border-t border-outline-variant flat no shadows fixed bottom-0 left-0 w-full z-50 flex items-center justify-between px-page-margin py-2 h-bottom-bar-height bg-surface-container-low text-primary-fixed-dim">
        <div className="font-label-sm text-label-sm text-on-surface-variant">
          © 2025 S-Winds Fleet Intelligence
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary-fixed-dim"></span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Active Vehicles:
            </span>
            <span className="font-data-lg text-[16px] font-bold">256</span>
          </div>
          <div className="w-px h-4 bg-outline-variant"></div>
          <div className="flex items-center gap-2">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Routes Today:
            </span>
            <span className="font-data-lg text-[16px] font-bold text-primary">
              142
            </span>
          </div>
          <div className="w-px h-4 bg-outline-variant"></div>
          <div className="flex items-center gap-2">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Alerts:
            </span>
            <span className="font-data-lg text-[16px] font-bold text-error">
              12
            </span>
          </div>
          <div className="w-px h-4 bg-outline-variant"></div>
          <div className="flex items-center gap-2">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              High Risk Routes:
            </span>
            <span className="font-data-lg text-[16px] font-bold text-error">
              18
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
