import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { ChevronDown } from 'lucide-react';
import { insights, riskAnalytics } from '../../data/dashboard';

export default function RiskAnalytics() {
  return (
    <section className="rounded-[7px] border border-[#17384b] bg-[#061725]/82 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">RISK ANALYTICS</h2>
        <ChevronDown className="h-5 w-5" />
      </div>
      <div className="grid grid-cols-[150px_1fr] items-center gap-5">
        <div className="relative h-[150px]">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={riskAnalytics} innerRadius={48} outerRadius={70} paddingAngle={2} dataKey="value">
                {riskAnalytics.map((item) => <Cell key={item.name} fill={item.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div><div className="text-3xl font-bold">75%</div><div className="text-xs text-[#b7c5cd]">Low Risk</div></div>
          </div>
        </div>
        <div className="space-y-4 text-sm">
          {riskAnalytics.map((item) => (
            <div key={item.name} className="grid grid-cols-[14px_1fr_auto] items-center gap-2">
              <span className="h-3 w-3 rounded-[3px]" style={{ backgroundColor: item.color }} />
              <span>{item.name}</span>
              <span>{item.value}% <span className="text-[#9aaab6]">({item.routes})</span></span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 border-t border-[#17384b] pt-4">
        <h3 className="mb-3 text-sm text-white">TOP INSIGHTS</h3>
        <div className="space-y-2 text-sm text-[#d7e3e9]">
          {insights.map((item) => <div key={item} className="flex gap-2"><span className="mt-1.5 h-2 w-2 rounded-full bg-[#00afc7]" />{item}</div>)}
        </div>
      </div>
    </section>
  );
}
