import { AlertCircle } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer } from 'recharts';
import { kpis, sparklineData } from '../../data/dashboard';
import { Tooltip } from '../ui/Tooltip';

const tones = {
  cyan: { icon: 'text-[#00afc7]', value: 'text-white' },
  green: { icon: 'text-[#00afc7]', value: 'text-[#22c55e]' },
  red: { icon: 'text-[#ef4444]', value: 'text-[#ff5b5b]' },
  orange: { icon: 'text-[#f59e0b]', value: 'text-[#f59e0b]' },
};

export default function KpiGrid() {
  return (
    <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <article key={kpi.title} className="h-[122px] rounded-[7px] border border-[#17384b] bg-[#061725]/82 px-6 py-4 shadow-[0_14px_36px_rgba(0,0,0,.18)]">
            <div className="flex h-full items-center gap-5">
              <Tooltip label={kpi.title}>
                <Icon className={`h-12 w-12 shrink-0 ${tones[kpi.tone].icon}`} strokeWidth={1.9} />
              </Tooltip>
              <div className="min-w-0 flex-1">
                <div className="text-xs tracking-wide text-white">{kpi.title}</div>
                <div className="mt-1 flex items-end gap-2">
                  <span className={`text-[34px] font-bold leading-none ${tones[kpi.tone].value}`}>{kpi.value}</span>
                  {kpi.suffix && <span className="pb-1 text-xl text-white">{kpi.suffix}</span>}
                  {kpi.percent && <span className="ml-auto pb-1 text-[22px] font-bold text-[#22c55e]">{kpi.percent}</span>}
                </div>
                {kpi.percent ? (
                  <div className="mt-3 flex items-center gap-4">
                    <span className="text-sm text-white">vs 22 yesterday</span>
                    <span className="h-2 flex-1 rounded-full bg-[#17384b]"><span className="block h-full w-3/4 rounded-full bg-[#22c55e]" /></span>
                  </div>
                ) : kpi.title === 'AVG RISK SCORE' ? (
                  <div className="mt-2 flex items-end gap-3">
                    <span className="text-sm text-white">vs 3.8 yesterday</span>
                    <ResponsiveContainer width="48%" height={30}>
                      <LineChart data={sparklineData}>
                        <Line dataKey="v" type="monotone" stroke="#f59e0b" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className={`mt-2 flex items-center gap-1.5 text-sm ${kpi.tone === 'red' ? 'text-[#ff6b6b]' : kpi.tone === 'orange' ? 'text-[#fbbf24]' : 'text-[#fbbf24]'}`}>
                    {kpi.title === 'VEHICLES TO DEPLOY' && <AlertCircle className="h-4 w-4" />}
                    <span>{kpi.footer}</span>
                  </div>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
