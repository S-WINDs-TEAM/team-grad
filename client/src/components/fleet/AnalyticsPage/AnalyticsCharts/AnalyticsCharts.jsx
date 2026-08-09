import ChartCard from "./ChartCard";
import RiskHorizontalBarChart from "./RiskHorizontalBarChart";
import RiskTrendChart from "./RiskTrendChart";
import RiskVerticalBarChart from "./RiskVerticalBarChart";

export default function AnalyticsCharts() {
  return (
    <>
      {/* <!-- Risk Trend (Last 30 Days) --> */}
      <ChartCard title="Risk Trend (Last 30 Days)">
        <RiskTrendChart
          data={[
            { label: "Jan 1", value: 4.2 },
            { label: "Jan 4", value: 3.9 },
            { label: "Jan 7", value: 3.6 },
            { label: "Jan 10", value: 3.3 },
            { label: "Jan 13", value: 3.0 },
            { label: "Jan 16", value: 3.1 },
            { label: "Jan 19", value: 3.4 },
            { label: "Jan 22", value: 3.5 },
            { label: "Jan 25", value: 3.6 },
            { label: "Jan 28", value: 3.8 },
          ]}
        />
      </ChartCard>
      {/* <!-- Risk by Vehicle Type --> */}
      <ChartCard title="Risk by Vehicle Type">
        <RiskVerticalBarChart
          data={[
            { label: "Truck", value: 4.8 },
            { label: "Car", value: 2.6 },
            { label: "Motorcycle", value: 7.1 },
          ]}
        />
      </ChartCard>
      {/* <!-- Most Risky Corridors --> */}
      <ChartCard title="Most Risky Corridors">
        <RiskHorizontalBarChart
          data={[
            { label: "Cairo→Hurghada", value: 7.2 },
            { label: "Cairo→Asyut", value: 6.8 },
            { label: "Cairo→Damanhur", value: 5.2 },
            { label: "Cairo→Suez", value: 4.5 },
            { label: "Cairo→Alexandria", value: 2.1 },
            { label: "Cairo→Port Said", value: 1.8 },
          ]}
        />
      </ChartCard>
      {/* <!-- Risk by Time of Day --> */}
      <ChartCard title="Risk by Time of Day">
        <RiskVerticalBarChart
          data={[
            { label: "6AM", value: 2.1 },
            { label: "8AM", value: 2.5 },
            { label: "10AM", value: 3.2 },
            { label: "12PM", value: 5.8 },
            { label: "2PM", value: 7.8 },
            { label: "4PM", value: 5.1 },
            { label: "6PM", value: 3.0 },
            { label: "8PM", value: 2.2 },
          ]}
          xAxisLabel="Time of Day"
        />
      </ChartCard>
    </>
  );
}
