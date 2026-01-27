import { HiringCapacityCard } from '@/components/dashboard/HiringCapacityCard';
import { StaffingTrendChart } from '@/components/dashboard/StaffingTrendChart';
import { StylistWorkloadCard } from '@/components/dashboard/StylistWorkloadCard';
import { StaffRevenueLeaderboard } from '@/components/dashboard/analytics/StaffRevenueLeaderboard';
import { StaffOverviewCard, StylistsOverviewCard } from '@/components/dashboard/StylistsOverviewCard';

import { StaffWorkload } from '@/hooks/useStaffUtilization';

interface StaffingContentProps {
  workload: StaffWorkload[];
  isLoading: boolean;
  locationId?: string;
}

export function StaffingContent({ workload, isLoading, locationId }: StaffingContentProps) {
  return (
    <>
      {/* Team Overview Cards */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <StaffOverviewCard />
        <StylistsOverviewCard />
      </div>


      {/* Hiring Capacity and Staffing Trends */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <HiringCapacityCard />
        <StaffingTrendChart />
      </div>

      {/* Stylist Workload Distribution */}
      <StylistWorkloadCard 
        workload={workload}
        isLoading={isLoading}
      />

      {/* Staff Revenue Leaderboard */}
      <StaffRevenueLeaderboard locationId={locationId} />
    </>
  );
}
