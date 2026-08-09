import DashboardLayout from '../components/layout/DashboardLayout';
import { TooltipProvider } from '../components/ui/Tooltip';

export default function Trips() {
  return (
    <TooltipProvider>
      <DashboardLayout>
        <div className="rounded-[7px] border border-[#17384b] bg-[#061725] p-8">
          <h1 className="text-2xl font-semibold">Trip History</h1>
          <p className="mt-2 text-[#9aaab6]">Completed fleet routes, safety scores, and archived dispatch decisions.</p>
        </div>
      </DashboardLayout>
    </TooltipProvider>
  );
}
