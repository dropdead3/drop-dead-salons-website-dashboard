import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PlatformPageContainer } from '@/components/platform/ui/PlatformPageContainer';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ManagerMeetingRequest } from '@/components/coaching/ManagerMeetingRequest';
import { PendingMeetingRequests } from '@/components/coaching/PendingMeetingRequests';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectiveRoles } from '@/hooks/useEffectiveUser';

export default function MeetingInbox() {
  const { user } = useAuth();
  const roles = useEffectiveRoles();
  const isCoach = roles.includes('admin') || roles.includes('manager') || roles.includes('super_admin');

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
            <h1 className="font-display text-3xl lg:text-4xl">Meeting Inbox</h1>
            <p className="text-muted-foreground mt-1">
              Manager-initiated meeting requests and your pending requests.
            </p>
          </div>

          <div className="space-y-4">
            {isCoach && (
              <div className="flex justify-end">
                <ManagerMeetingRequest />
              </div>
            )}
            <PendingMeetingRequests viewAs={isCoach ? 'manager' : 'team_member'} />
          </div>
        </div>
      </PlatformPageContainer>
    </DashboardLayout>
  );
}
