import { AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { weatherSummary } from '../../data/dashboard';

export default function WeatherImpactSummary() {
  return (
    <section className="rounded-[7px] border border-[#17384b] bg-[#061725]/82 p-4">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold">WEATHER IMPACT SUMMARY</h2>
        <ChevronDown className="h-5 w-5" />
      </div>
      <div className="weather-line grid grid-cols-4 gap-3">
        {weatherSummary.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.time} className="relative text-center">
              <div className="mb-2 text-sm text-white">{item.time}</div>
              <Icon className={`mx-auto h-9 w-9 ${item.detail === 'Clear' && item.time !== '8 PM' ? 'text-[#f59e0b]' : item.detail === 'Rain' ? 'text-[#7dd3fc]' : 'text-[#cbd5e1]'}`} />
              <div className="mt-1 text-base text-white">{item.temp}</div>
              <div className="text-xs text-[#c2cbd2]">{item.detail}</div>
            </div>
          );
        })}
      </div>
      <button className="mt-6 flex w-full items-center gap-3 rounded-[6px] border border-[#7f1d1d] bg-[#451517]/60 p-4 text-left text-sm text-[#ffe2e2]" type="button">
        <AlertTriangle className="h-6 w-6 shrink-0 text-[#ef4444]" />
        <span className="flex-1">
          <span className="block">3 vehicles affected between 12PM-5PM</span>
          <span className="mt-2 block text-xs text-white">Affected Routes:</span>
          <span className="mt-2 flex flex-wrap gap-2">
            {['Cairo -> Hurghada', 'Cairo -> Asyut', 'Cairo -> Damanhur'].map((route) => (
              <span key={route} className="rounded bg-[#6f2524]/80 px-2 py-1 text-xs">{route}</span>
            ))}
          </span>
        </span>
        <ChevronRight className="h-5 w-5" />
      </button>
    </section>
  );
}
