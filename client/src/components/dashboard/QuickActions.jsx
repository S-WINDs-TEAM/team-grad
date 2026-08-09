import * as Dialog from '@radix-ui/react-dialog';
import { BarChart3, ChevronDown, ChevronRight, Clock, FileText, Map, X } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { planFields } from '../../data/dashboard';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';

export default function QuickActions() {
  const navigate = useNavigate();
  return (
    <section className="rounded-[7px] border border-[#17384b] bg-[#061725]/82 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">QUICK ACTIONS</h2>
        <ChevronDown className="h-5 w-5" />
      </div>
      <Dialog.Root>
        <Dialog.Trigger asChild>
          <Tooltip label="Plan New Route">
            <button className="flex h-[54px] w-full items-center rounded-[6px] border border-[#00afc7] bg-[#086274] px-6 text-white shadow-[inset_0_1px_24px_rgba(0,213,232,.18)]" type="button">
              <Map className="mr-4 h-6 w-6" /><span className="flex-1 text-base">Plan New Route</span><ChevronRight />
            </button>
          </Tooltip>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[950] bg-black/70" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[960] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-[8px] border border-[#17384b] bg-[#061725] p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-xl font-semibold">Plan New Route</Dialog.Title>
              <Dialog.Close className="text-[#9aaab6] hover:text-white"><X className="h-5 w-5" /></Dialog.Close>
            </div>
            <Dialog.Description className="sr-only">Create a fleet route with risk and weather previews.</Dialog.Description>
            <div className="mt-5 grid grid-cols-2 gap-4">
              {planFields.map((field) => (
                <label key={field} className="text-sm text-[#cbd5e1]">
                  {field}
                  <input className="mt-2 h-11 w-full rounded-[5px] border border-[#17384b] bg-[#03111d] px-3 text-white outline-none focus:border-[#00afc7]" />
                </label>
              ))}
              <div className="rounded border border-[#17384b] bg-[#071a28] p-3 text-sm"><div className="text-[#9aaab6]">Risk Preview</div><div className="mt-1 text-[#22c55e]">2.8 /10 LOW</div></div>
              <div className="rounded border border-[#17384b] bg-[#071a28] p-3 text-sm"><div className="text-[#9aaab6]">Weather Preview</div><div className="mt-1">Clear, 28°C</div></div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Dialog.Close asChild><Button variant="ghost">Cancel</Button></Dialog.Close>
              <Dialog.Close asChild><Button variant="cyan" onClick={() => toast.success('Route planned successfully')}>Plan Route</Button></Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Tooltip label="View Trip History">
          <Button className="h-[52px]" onClick={() => navigate('/trips')}><Clock className="h-5 w-5" />View Trip History</Button>
        </Tooltip>
        <Tooltip label="Generate Report">
          <Button className="h-[52px]" onClick={() => toast.success('Report generated successfully')}><BarChart3 className="h-5 w-5" />Generate Report</Button>
        </Tooltip>
      </div>
      <FileText className="sr-only" />
    </section>
  );
}
