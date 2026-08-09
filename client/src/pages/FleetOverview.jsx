import DashboardLayout from '../components/layout/DashboardLayout';
import { TooltipProvider } from '../components/ui/Tooltip';

export default function FleetOverview() {
  return (
    <TooltipProvider>
      <DashboardLayout>
        <div className="rounded-[7px] border border-[#17384b] bg-[#061725] p-8">
          <h1 className="text-2xl font-semibold">Fleet Overview</h1>
          <p className="mt-2 text-[#9aaab6]">Fleet summary workspace coming online.</p>
        </div>
      </DashboardLayout>
    </TooltipProvider>
  );
}
