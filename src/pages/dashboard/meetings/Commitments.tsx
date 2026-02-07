import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PlatformPageContainer } from '@/components/platform/ui/PlatformPageContainer';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { AccountabilityOverview } from '@/components/coaching/AccountabilityOverview';

export default function Commitments() {
  return (
    <DashboardLayout>
      <PlatformPageContainer>
        <div className="space-y-6">
          <div>
            <Link to="/dashboard/schedule-meeting">
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Meetings Hub
              </Button>
            </Link>
            <h1 className="font-display text-3xl lg:text-4xl">My Commitments</h1>
            <p className="text-muted-foreground mt-1">
              Track promises and accountability items made to team members.
            </p>
          </div>

          <AccountabilityOverview />
        </div>
      </PlatformPageContainer>
    </DashboardLayout>
  );
}
