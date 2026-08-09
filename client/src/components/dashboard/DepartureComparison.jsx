import { Info } from 'lucide-react';
import { departures } from '../../data/dashboard';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';

export default function DepartureComparison({ sectionRef, selectedDeparture, setDeparture }) {
  const ticks = ['6 AM', '8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM', '10 PM'];
  return (
    <section ref={sectionRef} className="rounded-[7px] border border-[#17384b] bg-[#061725]/82 p-4">
      <div className="mb-5 flex items-center gap-2">
        <h2 className="text-lg font-semibold">COMPARE DEPARTURE TIMES</h2>
        <Tooltip label="Compare risk by departure hour"><Info className="h-4 w-4 text-[#cbd5e1]" /></Tooltip>
      </div>
      <div className="relative mb-7 h-[50px] px-2">
        <div className="absolute left-4 right-4 top-[28px] h-1 rounded-full bg-gradient-to-r from-[#22c55e] via-[#f59e0b] to-[#7f1d1d]" />
        <div className="grid grid-cols-9 text-center text-xs text-white">
          {ticks.map((tick) => <div key={tick}><span className="mx-auto mb-4 block h-2 w-2 rounded-full bg-[#cbd5e1]" />{tick}</div>)}
        </div>
        <span className="absolute left-[13%] top-[-6px] rounded bg-[#14532d] px-2 text-xs text-[#dcfce7]">7:00 AM</span>
        <span className="absolute left-[57%] top-[-6px] rounded bg-[#3b1113] px-2 text-xs text-[#fecaca]">2:00 PM</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {departures.map((departure) => {
          const Icon = departure.icon;
          const isGreen = departure.tone === 'green';
          return (
            <article key={departure.time} className={`rounded-[6px] border p-4 ${isGreen ? 'border-[#15803d] bg-[#0a2c22]' : 'border-[#7f1d1d] bg-[#1c1117]'}`}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xl">{departure.time}</h3>
                {departure.badge && <Badge tone="green">{departure.badge}</Badge>}
              </div>
              <div className="grid grid-cols-[52px_1fr_auto] items-center gap-4">
                <Icon className={`h-11 w-11 ${isGreen ? 'text-[#f59e0b]' : 'text-[#94a3b8]'}`} />
                <div>
                  <div className="text-xs text-[#9aaab6]">Risk Score</div>
                  <div className={`text-3xl font-bold ${isGreen ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>{departure.riskScore}<span className="text-base font-normal text-white"> /10</span></div>
                </div>
                <Badge tone={isGreen ? 'green' : 'red'}>{departure.risk}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 border-t border-[#17384b] pt-3">
                <div><div className="text-xs text-[#9aaab6]">Duration</div><div className="text-lg">{departure.duration}</div></div>
                <div><div className="text-xs text-[#9aaab6]">Avg Speed</div><div className="text-lg">{departure.speed}</div></div>
              </div>
              {isGreen ? (
                <Button variant={selectedDeparture === departure.time ? 'green' : 'default'} className="mt-4 h-11 w-full" onClick={() => setDeparture(departure.time)}>Set as departure</Button>
              ) : (
                <button type="button" className="mt-5 text-[#81f6ff]">See details -&gt;</button>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
