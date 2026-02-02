import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { LeaderboardContent } from '@/components/dashboard/LeaderboardContent';

export default function Leaderboard() {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl lg:text-4xl mb-2">
              TEAM LEADERBOARD
            </h1>
            <p className="text-muted-foreground font-sans">
              See how the team is performing this week.
            </p>
          </div>
        </div>
        <LeaderboardContent />
      </div>
    </DashboardLayout>
  );
}
