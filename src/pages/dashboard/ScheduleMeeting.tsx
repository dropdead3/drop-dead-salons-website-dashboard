import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PlatformPageContainer } from '@/components/platform/ui/PlatformPageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectiveRoles } from '@/hooks/useEffectiveUser';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import {
  CalendarPlus,
  Calendar,
  Inbox,
  ClipboardList,
  MessageSquareMore,
  ChevronRight,
  Clock,
  AlertCircle,
} from 'lucide-react';

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
  colorClass: string;
}

function StatCard({ icon: Icon, value, label, colorClass }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 flex items-center justify-center rounded-lg", colorClass)}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-display font-medium">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </Card>
  );
}

function formatMeetingDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'MMM d');
}

function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':');
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  return format(date, 'h:mm a');
}

interface ProfileInfo {
  user_id: string;
  full_name: string;
  display_name: string | null;
}

interface MeetingWithCoach {
  id: string;
  meeting_date: string;
  start_time: string;
  meeting_type: string | null;
  coach_id: string;
  status: string;
  coach?: ProfileInfo;
}

interface RequestWithRequester {
  id: string;
  meeting_date: string;
  start_time: string;
  meeting_type: string | null;
  requester_id: string;
  requester?: ProfileInfo;
}

interface CommitmentWithMember {
  id: string;
  title: string;
  due_date: string | null;
  team_member_id: string;
  priority: string;
  teamMember?: ProfileInfo;
}

export default function ScheduleMeeting() {
  const { user } = useAuth();
  const roles = useEffectiveRoles();
  const isCoach = roles.includes('admin') || roles.includes('manager') || roles.includes('super_admin');

  // Fetch dashboard data
  const { data } = useQuery({
    queryKey: ['meeting-dashboard-data', user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      // Fetch upcoming meetings (as requester) with coach info
      const { data: upcomingMeetings } = await supabase
        .from('one_on_one_meetings')
        .select('id, meeting_date, start_time, meeting_type, coach_id, status')
        .eq('requester_id', user!.id)
        .gte('meeting_date', today)
        .in('status', ['pending', 'confirmed'])
        .order('meeting_date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(5);

      // Get coach profiles for upcoming meetings
      const coachIds = [...new Set(upcomingMeetings?.map(m => m.coach_id) || [])];
      const { data: coachProfiles } = coachIds.length > 0
        ? await supabase
            .from('employee_profiles')
            .select('user_id, full_name, display_name')
            .in('user_id', coachIds)
        : { data: [] as ProfileInfo[] };

      const coachMap = new Map<string, ProfileInfo>(
        (coachProfiles || []).map(p => [p.user_id, p])
      );

      // Fetch pending requests (as coach)
      const { data: pendingRequests, count: pendingCount } = await supabase
        .from('one_on_one_meetings')
        .select('id, meeting_date, start_time, meeting_type, requester_id', { count: 'exact' })
        .eq('coach_id', user!.id)
        .eq('status', 'pending')
        .order('meeting_date', { ascending: true })
        .limit(3);

      // Get requester profiles
      const requesterIds = [...new Set(pendingRequests?.map(m => m.requester_id) || [])];
      const { data: requesterProfiles } = requesterIds.length > 0
        ? await supabase
            .from('employee_profiles')
            .select('user_id, full_name, display_name')
            .in('user_id', requesterIds)
        : { data: [] as ProfileInfo[] };

      const requesterMap = new Map<string, ProfileInfo>(
        (requesterProfiles || []).map(p => [p.user_id, p])
      );

      // Fetch active commitments (as coach)
      const { data: activeCommitments, count: commitmentsCount } = await supabase
        .from('accountability_items')
        .select('id, title, due_date, team_member_id, priority', { count: 'exact' })
        .eq('coach_id', user!.id)
        .eq('status', 'pending')
        .order('due_date', { ascending: true, nullsFirst: false })
        .limit(3);

      // Get team member profiles for commitments
      const teamMemberIds = [...new Set(activeCommitments?.map(c => c.team_member_id) || [])];
      const { data: teamMemberProfiles } = teamMemberIds.length > 0
        ? await supabase
            .from('employee_profiles')
            .select('user_id, full_name, display_name')
            .in('user_id', teamMemberIds)
        : { data: [] as ProfileInfo[] };

      const teamMemberMap = new Map<string, ProfileInfo>(
        (teamMemberProfiles || []).map(p => [p.user_id, p])
      );

      // Fetch meeting inbox count
      const { count: inboxCount } = await supabase
        .from('meeting_requests')
        .select('*', { count: 'exact', head: true })
        .eq('team_member_id', user!.id)
        .eq('status', 'pending');

      return {
        upcomingMeetings: (upcomingMeetings || []).map(m => ({
          ...m,
          coach: coachMap.get(m.coach_id),
        })) as MeetingWithCoach[],
        upcomingCount: upcomingMeetings?.length || 0,
        pendingRequests: (pendingRequests || []).map(m => ({
          ...m,
          requester: requesterMap.get(m.requester_id),
        })) as RequestWithRequester[],
        pendingCount: pendingCount || 0,
        activeCommitments: (activeCommitments || []).map(c => ({
          ...c,
          teamMember: teamMemberMap.get(c.team_member_id),
        })) as CommitmentWithMember[],
        commitmentsCount: commitmentsCount || 0,
        inboxCount: inboxCount || 0,
      };
    },
    enabled: !!user,
  });

  const stats = {
    upcomingMeetings: data?.upcomingCount || 0,
    pendingRequests: data?.pendingCount || 0,
    activeCommitments: data?.commitmentsCount || 0,
    inboxPending: data?.inboxCount || 0,
  };

  return (
    <DashboardLayout>
      <PlatformPageContainer>
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="font-display text-3xl lg:text-4xl">Meetings & Accountability</h1>
            <p className="text-muted-foreground mt-1">
              Schedule 1:1 meetings, track commitments, and manage meeting requests.
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Calendar}
              value={stats.upcomingMeetings}
              label="Upcoming Meetings"
              colorClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
            />
            {isCoach && (
              <StatCard
                icon={Inbox}
                value={stats.pendingRequests}
                label="Pending Requests"
                colorClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
              />
            )}
            {isCoach && (
              <StatCard
                icon={ClipboardList}
                value={stats.activeCommitments}
                label="Active Commitments"
                colorClass="bg-purple-500/10 text-purple-600 dark:text-purple-400"
              />
            )}
            <StatCard
              icon={MessageSquareMore}
              value={stats.inboxPending}
              label="Inbox Pending"
              colorClass="bg-green-500/10 text-green-600 dark:text-green-400"
            />
          </div>

          {/* Upcoming Meetings Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-display uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Upcoming Meetings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data?.upcomingMeetings && data.upcomingMeetings.length > 0 ? (
                <div className="space-y-0 divide-y divide-border">
                  {data.upcomingMeetings.map((meeting) => (
                    <div key={meeting.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {formatMeetingDate(meeting.meeting_date)} at {formatTime(meeting.start_time)}
                          </span>
                          <span className="text-xs text-muted-foreground capitalize">
                            {meeting.meeting_type?.replace('_', ' ') || 'Meeting'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          with {meeting.coach?.display_name || meeting.coach?.full_name || 'Coach'}
                        </span>
                        <Badge variant={meeting.status === 'confirmed' ? 'default' : 'secondary'} className="text-xs">
                          {meeting.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No upcoming meetings scheduled
                </p>
              )}
              <Link to="/dashboard/schedule-meeting/my-meetings">
                <Button variant="ghost" className="w-full mt-4 text-muted-foreground hover:text-foreground">
                  View All Meetings <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Coaching Section - Only for coaches */}
          {isCoach && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Pending Requests Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-display uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                    <Inbox className="w-4 h-4" />
                    Pending Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data?.pendingRequests && data.pendingRequests.length > 0 ? (
                    <div className="space-y-0 divide-y divide-border">
                      {data.pendingRequests.map((request) => (
                        <div key={request.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">
                              {request.requester?.display_name || request.requester?.full_name || 'Team Member'}
                            </span>
                            <span className="text-xs text-muted-foreground capitalize">
                              {request.meeting_type?.replace('_', ' ') || 'Meeting'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            {formatMeetingDate(request.meeting_date)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No pending requests
                    </p>
                  )}
                  <Link to="/dashboard/schedule-meeting/requests">
                    <Button variant="ghost" className="w-full mt-4 text-muted-foreground hover:text-foreground">
                      View All Requests <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Active Commitments Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-display uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                    <ClipboardList className="w-4 h-4" />
                    Active Commitments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data?.activeCommitments && data.activeCommitments.length > 0 ? (
                    <div className="space-y-0 divide-y divide-border">
                      {data.activeCommitments.map((item) => {
                        const isOverdue = item.due_date && isPast(new Date(item.due_date));
                        return (
                          <div key={item.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                            <div className="flex flex-col">
                              <span className="font-medium text-sm line-clamp-1">{item.title}</span>
                              <span className="text-xs text-muted-foreground">
                                For {item.teamMember?.display_name || item.teamMember?.full_name || 'Team Member'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {item.due_date && (
                                <span className={cn(
                                  "text-xs flex items-center gap-1",
                                  isOverdue ? "text-destructive" : "text-muted-foreground"
                                )}>
                                  {isOverdue && <AlertCircle className="w-3 h-3" />}
                                  {format(new Date(item.due_date), 'MMM d')}
                                </span>
                              )}
                              {item.priority === 'high' && (
                                <Badge variant="destructive" className="text-xs">High</Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No active commitments
                    </p>
                  )}
                  <Link to="/dashboard/schedule-meeting/commitments">
                    <Button variant="ghost" className="w-full mt-4 text-muted-foreground hover:text-foreground">
                      View All Commitments <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <Link to="/dashboard/schedule-meeting/new">
              <Button className="gap-2">
                <CalendarPlus className="w-4 h-4" />
                Schedule Meeting
              </Button>
            </Link>
            <Link to="/dashboard/schedule-meeting/inbox">
              <Button variant="outline" className="gap-2">
                <MessageSquareMore className="w-4 h-4" />
                Meeting Inbox
                {stats.inboxPending > 0 && (
                  <Badge variant="secondary" className="ml-1">{stats.inboxPending}</Badge>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </PlatformPageContainer>
    </DashboardLayout>
  );
}
