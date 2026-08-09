import { Fragment } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { AlertTriangle, CheckCircle, ChevronRight, MoreVertical, X, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { decisionIcons, vehicles, weatherDetails } from '../../data/dashboard';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';

const toneFor = { LOW: 'green', MEDIUM: 'orange', HIGH: 'red' };
const decisionVariant = { Approved: 'green', Review: 'orange', Blocked: 'red' };

function RouteMini({ vehicle }) {
  return (
    <div className="route-mini relative h-[180px] overflow-hidden rounded-[5px] border border-[#17384b] bg-[#061725]">
      <div className="absolute inset-0 opacity-70" />
      <svg viewBox="0 0 220 160" className="absolute inset-0 h-full w-full">
        <path d="M96 42 C105 64 105 77 116 92 C128 110 137 128 152 146" fill="none" stroke="#ef4444" strokeWidth="7" strokeLinecap="round" />
        <path d="M96 42 C105 64 105 77 116 92 C128 110 137 128 152 146" fill="none" stroke="#ffffff" strokeDasharray="4 8" strokeWidth="2" />
        <circle cx="96" cy="42" r="6" fill="#061725" stroke="#fff" strokeWidth="3" />
        <circle cx="152" cy="146" r="6" fill="#061725" stroke="#fff" strokeWidth="3" />
      </svg>
      <span className="absolute left-[70px] top-[32px] text-sm text-white">Cairo</span>
      <span className="absolute bottom-7 right-9 text-sm text-white">{vehicle.to}</span>
    </div>
  );
}

function ExpandedDetails({ vehicle, onCompare }) {
  return (
    <tr>
      <td colSpan={7} className="border-b border-[#123044] bg-[#061b2a] px-10 py-4">
        <div className="grid grid-cols-[220px_1fr_160px] gap-8">
          <div>
            <h3 className="mb-2 text-sm tracking-wide text-[#dce9ee]">ROUTE OVERVIEW</h3>
            <RouteMini vehicle={vehicle} />
          </div>
          <div>
            <h3 className="mb-5 text-sm tracking-wide text-[#dce9ee]">WEATHER DETAILS</h3>
            <div className="grid grid-cols-4 gap-5">
              {weatherDetails.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.time} className="border-r border-[#17384b] last:border-r-0">
                    <div className="text-base text-white">{item.time}</div>
                    <Icon className={`my-3 h-9 w-9 ${item.detail === 'Clear' ? 'text-[#f59e0b]' : item.detail === 'Rain' || item.detail === 'Storms' ? 'text-[#7dd3fc]' : 'text-[#cbd5e1]'}`} />
                    <div className="text-xl text-white">{item.temp}</div>
                    <div className="text-sm text-[#9aaab6]">{item.detail}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col justify-between">
            <div>
              <div className="text-xs text-[#9aaab6]">EST. DURATION</div>
              <div className="mb-6 text-xl text-white">{vehicle.duration}</div>
              <div className="text-xs text-[#9aaab6]">EST. DISTANCE</div>
              <div className="text-xl text-white">{vehicle.distance}</div>
            </div>
            <Button className="h-11 w-full" onClick={onCompare}>Compare Times</Button>
          </div>
        </div>
      </td>
    </tr>
  );
}

function ReviewDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button variant="orange" className="h-10"><AlertTriangle className="h-4 w-4" />Review All (3)</Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[950] bg-black/70" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[960] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-[8px] border border-[#17384b] bg-[#061725] p-5 text-white shadow-2xl">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">Review All (3)</Dialog.Title>
            <Dialog.Close className="text-[#9aaab6] hover:text-white"><X className="h-5 w-5" /></Dialog.Close>
          </div>
          <Dialog.Description className="mt-3 text-sm text-[#9aaab6]">Review vehicles SW-TRK-003, SW-TRK-004, and SW-TRK-005 before dispatch approval.</Dialog.Description>
          <div className="mt-5 flex justify-end gap-3">
            <Dialog.Close asChild><Button variant="ghost">Cancel</Button></Dialog.Close>
            <Dialog.Close asChild><Button variant="orange" onClick={() => toast.warning('Routes sent for review')}>Start Review</Button></Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default function FleetDispatchBoard({ selectedVehicleId, selectVehicle, selectedVehicle, updateDecision, onCompare }) {
  return (
    <section className="rounded-[7px] border border-[#17384b] bg-[#061725]/82">
      <div className="flex h-[58px] items-center justify-between border-b border-[#123044] px-5">
        <h2 className="text-xl font-semibold">FLEET DISPATCH BOARD</h2>
        <div className="flex items-center gap-3">
          <ReviewDialog />
          <Button variant="green" className="h-10" onClick={() => toast.success('Route approved')}><CheckCircle className="h-4 w-4" />Approve Safe (18)</Button>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="grid h-10 w-10 place-items-center text-white" aria-label="Open board menu"><MoreVertical /></button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content align="end" className="z-[900] rounded border border-[#17384b] bg-[#061725] p-2 text-sm text-white">
                <DropdownMenu.Item className="rounded px-3 py-2 outline-none hover:bg-[#09283b]">Export board</DropdownMenu.Item>
                <DropdownMenu.Item className="rounded px-3 py-2 outline-none hover:bg-[#09283b]">Refresh statuses</DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
      <div className="overflow-x-auto px-1 py-3">
        <table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-left">
          <thead>
            <tr className="text-xs text-[#c5d1d8]">
              {['VEHICLE ID', 'ROUTE', 'RISK', 'DEPARTURE', 'ETA', 'WEATHER', 'DECISION'].map((head) => (
                <th key={head} className="px-4 py-2 font-normal">{head}{head === 'RISK' && <div className="text-[10px] text-white">Click to compare</div>}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle) => {
              const selected = selectedVehicleId === vehicle.id;
              const WeatherIcon = vehicle.weather.icon;
              const DecisionIcon = decisionIcons[vehicle.decision] ?? XCircle;
              const dotColor = vehicle.status === 'green' ? '#22c55e' : vehicle.status === 'orange' ? '#f59e0b' : '#ef4444';
              return (
                <Fragment key={vehicle.id}>
                  <tr key={vehicle.id} onClick={() => selectVehicle(vehicle.id)} className={`cursor-pointer rounded-[6px] text-sm text-white transition ${selected ? 'row-selected' : ''}`}>
                    <td className="rounded-l-[6px] border-y border-l border-[#17384b] bg-[#071a28] px-4 py-3">
                      <div className="flex items-center gap-3"><span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: dotColor }} />{vehicle.id}</div>
                    </td>
                    <td className="border-y border-[#17384b] bg-[#071a28] px-4 py-3">{vehicle.route}</td>
                    <td className="border-y border-[#17384b] bg-[#071a28] px-4 py-3"><Tooltip label={`${vehicle.risk} risk indicator`}><span><Badge tone={toneFor[vehicle.risk]}>{vehicle.risk}</Badge></span></Tooltip></td>
                    <td className="border-y border-[#17384b] bg-[#071a28] px-4 py-3">{vehicle.departure}</td>
                    <td className="border-y border-[#17384b] bg-[#071a28] px-4 py-3">{vehicle.eta}</td>
                    <td className="border-y border-[#17384b] bg-[#071a28] px-4 py-3">
                      <div className="flex items-center gap-2"><WeatherIcon className={`h-6 w-6 ${vehicle.status === 'orange' || vehicle.status === 'red' ? 'text-[#f8c34a]' : 'text-[#f59e0b]'}`} />{vehicle.weather.temp}</div>
                    </td>
                    <td className="rounded-r-[6px] border-y border-r border-[#17384b] bg-[#071a28] px-4 py-3">
                      <Button variant={decisionVariant[vehicle.decision]} className="h-9 px-2.5 text-xs" onClick={(event) => { event.stopPropagation(); updateDecision(vehicle.decision); }}>
                        <DecisionIcon className="h-4 w-4" />{vehicle.decision}<ChevronRight className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                  {selected && <ExpandedDetails vehicle={selectedVehicle} onCompare={onCompare} />}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
