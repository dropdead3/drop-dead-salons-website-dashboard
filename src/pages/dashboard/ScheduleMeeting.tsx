import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PlatformPageContainer } from '@/components/platform/ui/PlatformPageContainer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectiveRoles } from '@/hooks/useEffectiveUser';
import {
  CalendarPlus,
  Calendar,
  Inbox,
  ClipboardList,
  MessageSquareMore,
  ChevronRight,
} from 'lucide-react';

interface MeetingCardProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  stat?: string | number | null;
  statLabel?: string;
  colorClass?: string;
}

function MeetingCard({ href, icon: Icon, title, description, stat, statLabel, colorClass = 'bg-primary/10 text-primary' }: MeetingCardProps) {
  return (
    <Link to={href}>
      <Card className="group hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer h-full border-border/50">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={cn("p-2.5 rounded-xl shrink-0", colorClass)}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-sm truncate">{title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {stat !== null && stat !== undefined && (
                <Badge variant="secondary" className="text-xs">
                  {stat} {statLabel}
                </Badge>
              )}
              <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

interface CategorySectionProps {
  title: string;
  children: React.ReactNode;
}

function CategorySection({ title, children }: CategorySectionProps) {
  return (
    <div className="space-y-3">
      <h2 className="font-display text-sm tracking-wide text-muted-foreground uppercase">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </div>
  );
}

export default function ScheduleMeeting() {
  const { user } = useAuth();
  const roles = useEffectiveRoles();
  const isCoach = roles.includes('admin') || roles.includes('manager') || roles.includes('super_admin');

  // Fetch stats for badges
  const { data: stats } = useQuery({
    queryKey: ['meeting-hub-stats', user?.id],
    queryFn: async () => {
      // Fetch upcoming meetings count (as requester)
      const today = new Date().toISOString().split('T')[0];
      const upcomingMeetingsResult = await supabase
        .from('one_on_one_meetings')
        .select('*', { count: 'exact', head: true })
        .eq('requester_id', user!.id)
        .gte('meeting_date', today)
        .in('status', ['pending', 'confirmed']);

      // Fetch pending requests (as coach)
      const pendingRequestsResult = await supabase
        .from('one_on_one_meetings')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', user!.id)
        .eq('status', 'pending');

      // Fetch active accountability items (as coach)
      const activeCommitmentsResult = await supabase
        .from('accountability_items')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', user!.id)
        .eq('status', 'pending');

      // Fetch meeting inbox count (pending meeting requests)
      const inboxResult = await supabase
        .from('meeting_requests')
        .select('*', { count: 'exact', head: true })
        .eq('team_member_id', user!.id)
        .eq('status', 'pending');

      return {
        upcomingMeetings: upcomingMeetingsResult.count || 0,
        pendingRequests: pendingRequestsResult.count || 0,
        activeCommitments: activeCommitmentsResult.count || 0,
        inboxPending: inboxResult.count || 0,
      };
    },
    enabled: !!user,
  });

  return (
    <DashboardLayout>
      <PlatformPageContainer>
        <div className="space-y-8">
          <div>
            <h1 className="font-display text-3xl lg:text-4xl">Meetings & Accountability</h1>
            <p className="text-muted-foreground mt-1">
              Schedule 1:1 meetings, track commitments, and manage meeting requests.
            </p>
          </div>

          {/* Schedule & Meetings */}
          <CategorySection title="Schedule & Meetings">
            <MeetingCard
              href="/dashboard/schedule-meeting/new"
              icon={CalendarPlus}
              title="Schedule Meeting"
              description="Request a 1:1 with a coach or manager"
              colorClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
            />
            <MeetingCard
              href="/dashboard/schedule-meeting/my-meetings"
              icon={Calendar}
              title="My Meetings"
              description="View your scheduled and past meetings"
              stat={stats?.upcomingMeetings || null}
              statLabel="upcoming"
              colorClass="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
            />
            <MeetingCard
              href="/dashboard/schedule-meeting/inbox"
              icon={MessageSquareMore}
              title="Meeting Inbox"
              description="View meeting requests from managers"
              stat={stats?.inboxPending || null}
              statLabel="pending"
              colorClass="bg-green-500/10 text-green-600 dark:text-green-400"
            />
          </CategorySection>

          {/* Coaching Section - Only for coaches */}
          {isCoach && (
            <CategorySection title="Coaching">
              <MeetingCard
                href="/dashboard/schedule-meeting/requests"
                icon={Inbox}
                title="Incoming Requests"
                description="Review and respond to meeting requests"
                stat={stats?.pendingRequests || null}
                statLabel="pending"
                colorClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
              />
              <MeetingCard
                href="/dashboard/schedule-meeting/commitments"
                icon={ClipboardList}
                title="My Commitments"
                description="Track promises made to team members"
                stat={stats?.activeCommitments || null}
                statLabel="active"
                colorClass="bg-purple-500/10 text-purple-600 dark:text-purple-400"
              />
            </CategorySection>
          )}
        </div>
      </PlatformPageContainer>
    </DashboardLayout>
  );
}
