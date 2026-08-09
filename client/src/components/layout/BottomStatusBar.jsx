import { RefreshCw } from 'lucide-react';

export default function BottomStatusBar() {
  return (
    <footer className="mt-4 flex h-[72px] items-center rounded-[7px] border border-[#17384b] bg-[#061725]/90 px-4 text-[#d8e5eb]">
      <div className="flex flex-1 items-center gap-3">
        <span className="h-4 w-4 rounded-full bg-[#22c55e]" />
        <span>All Systems Operational</span>
      </div>
      <div className="flex flex-1 items-center justify-center gap-6 text-lg">
        <span>16 routes completed today</span>
        <span className="text-[#647786]">|</span>
        <span>Avg safety score 7.2/10</span>
      </div>
      <div className="flex flex-1 items-center justify-end gap-3">
        <RefreshCw className="h-5 w-5" />
        <span>Last updated: 07:18 AM</span>
      </div>
    </footer>
  );
}
