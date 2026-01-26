import { HiringCapacityCard } from '@/components/dashboard/HiringCapacityCard';
import { StaffingTrendChart } from '@/components/dashboard/StaffingTrendChart';
import { StylistWorkloadCard } from '@/components/dashboard/StylistWorkloadCard';
import { StaffWorkload } from '@/hooks/useStaffUtilization';

interface StaffingContentProps {
  workload: StaffWorkload[];
  isLoading: boolean;
}

export function StaffingContent({ workload, isLoading }: StaffingContentProps) {
  return (
    <>
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
    </>
  );
}
