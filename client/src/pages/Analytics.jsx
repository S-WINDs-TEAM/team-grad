import DashboardLayout from '../components/layout/DashboardLayout';
import { TooltipProvider } from '../components/ui/Tooltip';

export default function Analytics() {
  return (
    <TooltipProvider>
      <DashboardLayout>
        <div className="rounded-[7px] border border-[#17384b] bg-[#061725] p-8">
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="mt-2 text-[#9aaab6]">Fleet risk analytics and safety trends.</p>
        </div>
      </DashboardLayout>
    </TooltipProvider>
  );
}
