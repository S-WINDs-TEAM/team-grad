import { useRef } from 'react';
import DepartureComparison from '../components/dashboard/DepartureComparison';
import FleetDispatchBoard from '../components/dashboard/FleetDispatchBoard';
import KpiGrid from '../components/dashboard/KpiGrid';
import QuickActions from '../components/dashboard/QuickActions';
import RiskAnalytics from '../components/dashboard/RiskAnalytics';
import RouteMap from '../components/dashboard/RouteMap';
import WeatherImpactSummary from '../components/dashboard/WeatherImpactSummary';
import DashboardLayout from '../components/layout/DashboardLayout';
import { TooltipProvider } from '../components/ui/Tooltip';
import { useFleet } from '../hooks/useFleet';

export default function Dashboard() {
  const comparisonRef = useRef(null);
  const fleet = useFleet();

  const scrollToComparison = () => {
    comparisonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <TooltipProvider>
      <DashboardLayout>
        <KpiGrid />
        <div className="mt-3 grid grid-cols-1 gap-3 2xl:grid-cols-[1.34fr_.82fr_.72fr]">
          <FleetDispatchBoard
            selectedVehicleId={fleet.selectedVehicleId}
            selectedVehicle={fleet.selectedVehicle}
            selectVehicle={fleet.selectVehicle}
            updateDecision={fleet.updateDecision}
            onCompare={scrollToComparison}
          />
          <div className="space-y-3">
            <RouteMap selectedRoute={fleet.selectedRoute} selectRoute={fleet.selectRoute} />
            <DepartureComparison sectionRef={comparisonRef} selectedDeparture={fleet.selectedDeparture} setDeparture={fleet.setDeparture} />
          </div>
          <div className="space-y-3">
            <WeatherImpactSummary />
            <RiskAnalytics />
            <QuickActions />
          </div>
        </div>
      </DashboardLayout>
    </TooltipProvider>
  );
}
