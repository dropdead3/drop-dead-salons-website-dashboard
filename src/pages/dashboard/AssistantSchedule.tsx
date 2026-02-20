import { useState, useMemo } from 'react';
import { parseISO, isToday, isTomorrow, isPast, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { useFormatDate } from '@/hooks/useFormatDate';
import { Plus, Clock, User, CheckCircle2, XCircle, Calendar, List, LayoutGrid, MapPin, Repeat, Users, CalendarDays, TrendingUp, AlertCircle, UserCheck, UserPlus } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsTrigger, ResponsiveTabsList } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RequestAssistantDialog } from '@/components/dashboard/RequestAssistantDialog';
import { ScheduleCalendar } from '@/components/dashboard/ScheduleCalendar';
import { ResponseCountdown } from '@/components/dashboard/ResponseCountdown';
import { ManualAssignmentDialog } from '@/components/dashboard/ManualAssignmentDialog';
import { AssistantActivityCard } from '@/components/dashboard/AssistantActivityCard';
import { AssistantWorkloadChart } from '@/components/dashboard/AssistantWorkloadChart';
import { AssistantRequestsCalendar } from '@/components/dashboard/AssistantRequestsCalendar';
import { useAssistantRequests, useUpdateRequestStatus, useAcceptAssignment, useDeclineAssignment, type AssistantRequest } from '@/hooks/useAssistantRequests';
import { useActiveLocations } from '@/hooks/useLocations';
import { useActiveAssistants } from '@/hooks/useAssistantAvailability';
import { useAuth } from '@/contexts/AuthContext';
import { useViewAs } from '@/contexts/ViewAsContext';
import { cn } from '@/lib/utils';

function formatTime(time: string) {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function formatDateLabel(dateStr: string, formatDate: (d: Date | string | number, f: string) => string) {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return formatDate(date, 'EEEE, MMM d');
}

// --- Stat Card (reused from admin overview) ---
function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  description,
  variant = 'default' 
}: { 
  title: string; 
  value: number | string; 
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}) {
  const variantStyles = {
    default: 'bg-card',
    success: 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900',
    warning: 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900',
    danger: 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900',
  };

  const iconStyles = {
    default: 'text-muted-foreground',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-amber-600 dark:text-amber-400',
    danger: 'text-red-600 dark:text-red-400',
  };

  return (
    <Card className={cn('transition-all', variantStyles[variant])}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn('h-4 w-4', iconStyles[variant])} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-medium">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

// --- Admin Request Row ---
function AdminRequestRow({ request, onManualAssign }: { request: AssistantRequest; onManualAssign?: (req: AssistantRequest) => void }) {
  const { formatDate } = useFormatDate();
  const isAccepted = !!request.accepted_at;
  const declinedCount = request.declined_by?.length || 0;
  const needsAssignment = request.status === 'pending' || (request.status === 'assigned' && !request.accepted_at);

  const statusBadge = () => {
    if (request.status === 'completed') {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Completed</Badge>;
    }
    if (request.status === 'cancelled') {
      return <Badge variant="outline" className="text-muted-foreground">Cancelled</Badge>;
    }
    if (request.status === 'pending') {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending Assignment</Badge>;
    }
    if (isAccepted) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Accepted</Badge>;
    }
    return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Awaiting Response</Badge>;
  };

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{request.client_name}</span>
          {statusBadge()}
          {declinedCount > 0 && (
            <Badge variant="outline" className="text-destructive border-destructive/30">
              {declinedCount} decline{declinedCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          <span>{formatDate(parseISO(request.request_date), 'MMM d')} • </span>
          <span>{request.salon_services?.name}</span>
          {request.locations?.name && (
            <span className="flex items-center gap-1 inline-flex ml-2">
              <MapPin className="h-3 w-3" />
              {request.locations.name}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right text-sm">
          <div className="font-medium">
            {request.stylist_profile?.display_name || request.stylist_profile?.full_name || 'Unknown'}
          </div>
          {request.assistant_profile && (
            <div className="text-muted-foreground">
              → {request.assistant_profile.display_name || request.assistant_profile.full_name}
            </div>
          )}
        </div>
        {needsAssignment && onManualAssign && (
          <Button size="sm" variant="outline" onClick={() => onManualAssign(request)}>
            <UserPlus className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// --- Stylist/Assistant Request Card (original) ---
function RequestCard({ request, isStylistView }: { request: AssistantRequest; isStylistView: boolean }) {
  const updateStatus = useUpdateRequestStatus();
  const acceptAssignment = useAcceptAssignment();
  const declineAssignment = useDeclineAssignment();
  const isPastRequest = isPast(parseISO(request.request_date + 'T' + request.end_time));

  const isAccepted = !!request.accepted_at;
  const needsResponse = request.status === 'assigned' && !isAccepted && !isStylistView && !isPastRequest;

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    assigned: isAccepted ? 'bg-green-100 text-green-800 border-green-200' : 'bg-amber-100 text-amber-800 border-amber-200',
    completed: 'bg-blue-100 text-blue-800 border-blue-200',
    cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  const handleComplete = () => {
    updateStatus.mutate({ id: request.id, status: 'completed' });
  };

  const handleCancel = () => {
    updateStatus.mutate({ id: request.id, status: 'cancelled' });
  };

  const handleAccept = () => {
    acceptAssignment.mutate(request.id);
  };

  const handleDecline = () => {
    declineAssignment.mutate(request.id);
  };

  return (
    <Card className={cn(
      'transition-all',
      request.status === 'cancelled' && 'opacity-60'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {formatTime(request.start_time)} - {formatTime(request.end_time)}
              </span>
              <Badge className={cn('border', statusColors[request.status])}>
                {request.status === 'assigned' && !isAccepted ? 'Awaiting Response' : request.status}
              </Badge>
              {isAccepted && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Accepted
                </Badge>
              )}
            </div>

            <div className="grid gap-1 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Client: <strong>{request.client_name}</strong></span>
              </div>
              
              <div className="text-muted-foreground">
                Service: {request.salon_services?.name}
              </div>

              {request.locations?.name && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {request.locations.name}
                </div>
              )}

              {isStylistView && request.assistant_profile && (
                <div className="text-muted-foreground">
                  Assistant: {request.assistant_profile.display_name || request.assistant_profile.full_name}
                </div>
              )}

              {!isStylistView && request.stylist_profile && (
                <div className="text-muted-foreground">
                  Stylist: {request.stylist_profile.display_name || request.stylist_profile.full_name}
                </div>
              )}

              {request.notes && (
                <div className="text-muted-foreground italic">
                  Notes: {request.notes}
                </div>
              )}

              {request.parent_request_id && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Repeat className="h-3 w-3" />
                  <span className="text-xs">Recurring</span>
                </div>
              )}
            </div>
          </div>

          {needsResponse && (
            <div className="flex flex-col gap-2 items-end">
              {request.assigned_at && (
                <ResponseCountdown 
                  assignedAt={request.assigned_at} 
                  deadlineHours={request.response_deadline_hours || 2} 
                />
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAccept}
                  disabled={acceptAssignment.isPending || declineAssignment.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDecline}
                  disabled={acceptAssignment.isPending || declineAssignment.isPending}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Decline
                </Button>
              </div>
            </div>
          )}

          {request.status === 'assigned' && isAccepted && !isPastRequest && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleComplete}
                disabled={updateStatus.isPending}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Done
              </Button>
              {isStylistView && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={updateStatus.isPending}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {request.status === 'assigned' && !isAccepted && isStylistView && !isPastRequest && (
            <div className="flex flex-col items-end gap-2">
              {request.assigned_at && (
                <ResponseCountdown 
                  assignedAt={request.assigned_at} 
                  deadlineHours={request.response_deadline_hours || 2} 
                />
              )}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-amber-50 text-amber-700">
                  Awaiting assistant response
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={updateStatus.isPending}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {request.status === 'pending' && isStylistView && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              disabled={updateStatus.isPending}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function RequestsList({ requests, isStylistView }: { requests: AssistantRequest[]; isStylistView: boolean }) {
  const { formatDate } = useFormatDate();
  const groupedByDate = requests.reduce((acc, request) => {
    if (!acc[request.request_date]) acc[request.request_date] = [];
    acc[request.request_date].push(request);
    return acc;
  }, {} as Record<string, AssistantRequest[]>);

  const sortedDates = Object.keys(groupedByDate).sort();

  if (requests.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No requests found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sortedDates.map((date) => (
        <div key={date}>
          <h3 className="font-medium text-sm text-muted-foreground mb-3">
            {formatDateLabel(date, formatDate)}
          </h3>
          <div className="space-y-3">
            {groupedByDate[date].map((request) => (
              <RequestCard key={request.id} request={request} isStylistView={isStylistView} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function AssistantSchedule() {
  const { roles } = useAuth();
  const { viewAsRole, isViewingAs } = useViewAs();
  
  const effectiveRoles = isViewingAs && viewAsRole ? [viewAsRole] : roles;
  
  const isStylist = effectiveRoles.includes('stylist');
  const isStylistAssistant = effectiveRoles.includes('stylist_assistant') || effectiveRoles.includes('assistant');
  const isAdmin = effectiveRoles.includes('admin') || effectiveRoles.includes('manager') || effectiveRoles.includes('super_admin');

  const [activeTab, setActiveTab] = useState<string>(
    isStylist ? 'my-requests' : isStylistAssistant ? 'my-assignments' : 'overview'
  );
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<AssistantRequest | null>(null);
  const [manualAssignOpen, setManualAssignOpen] = useState(false);

  const { data: locations = [] } = useActiveLocations();
  const { data: assistants = [] } = useActiveAssistants();

  const effectiveLocationFilter = locationFilter === 'all' ? undefined : locationFilter;

  const { data: myRequests = [], isLoading: loadingMyRequests } = useAssistantRequests('stylist', effectiveLocationFilter);
  const { data: myAssignments = [], isLoading: loadingMyAssignments } = useAssistantRequests('assistant', effectiveLocationFilter);
  const { data: allRequests = [], isLoading: loadingAll } = useAssistantRequests('all', effectiveLocationFilter);

  // Filter assistants by location
  const filteredAssistants = useMemo(() => {
    if (locationFilter === 'all') return assistants;
    return assistants.filter(assistant =>
      assistant.schedules.some(s => s.location_id === locationFilter)
    );
  }, [assistants, locationFilter]);

  // Calculate admin statistics
  const stats = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
    
    const thisWeekRequests = allRequests.filter(r => {
      const requestDate = parseISO(r.request_date);
      return isWithinInterval(requestDate, { start: weekStart, end: weekEnd });
    });

    const total = allRequests.length;
    const thisWeek = thisWeekRequests.length;
    const pending = allRequests.filter(r => r.status === 'pending').length;
    const awaitingResponse = allRequests.filter(r => r.status === 'assigned' && !r.accepted_at).length;
    const accepted = allRequests.filter(r => r.accepted_at).length;
    const completed = allRequests.filter(r => r.status === 'completed').length;
    const cancelled = allRequests.filter(r => r.status === 'cancelled').length;
    const totalDeclines = allRequests.reduce((sum, r) => sum + (r.declined_by?.length || 0), 0);
    
    const assignedRequests = allRequests.filter(r => r.status === 'assigned' || r.status === 'completed');
    const acceptanceRate = assignedRequests.length > 0 
      ? Math.round((accepted / assignedRequests.length) * 100) 
      : 0;

    return { total, thisWeek, pending, awaitingResponse, accepted, completed, cancelled, totalDeclines, acceptanceRate };
  }, [allRequests]);

  // Filtered request views
  const pendingRequests = useMemo(() => 
    allRequests.filter(r => r.status === 'pending' || (r.status === 'assigned' && !r.accepted_at)),
    [allRequests]
  );

  const recentRequests = useMemo(() => 
    [...allRequests]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10),
    [allRequests]
  );

  const filterActive = (requests: AssistantRequest[]) => 
    requests.filter(r => r.status !== 'completed' && r.status !== 'cancelled');

  const filterCompleted = (requests: AssistantRequest[]) =>
    requests.filter(r => r.status === 'completed' || r.status === 'cancelled');

  const handleManualAssign = (request: AssistantRequest) => {
    setSelectedRequest(request);
    setManualAssignOpen(true);
  };

  // Non-admin views: keep the original calendar toggle
  const showCalendarToggle = !isAdmin;

  const getCurrentRequests = () => {
    if (activeTab === 'my-requests') return myRequests;
    if (activeTab === 'my-assignments') return myAssignments;
    return allRequests;
  };

  const currentIsStylistView = activeTab === 'my-requests';

  return (
    <DashboardLayout>
      <div className={cn("p-6 mx-auto", isAdmin ? "max-w-6xl" : "max-w-4xl")}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display">
              {isStylist ? 'Request An Assistant' : isStylistAssistant ? 'Assisting Requests' : 'Assistant Schedule'}
            </h1>
            <p className="text-muted-foreground">
              {isStylist ? 'Request help from salon assistants' : isStylistAssistant ? 'View and manage your assignments' : 'Overview of all assistant request activity'}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {locations.length > 1 && (
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-[180px]">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {isStylist && (
              <RequestAssistantDialog>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Request Assistant
                </Button>
              </RequestAssistantDialog>
            )}
            
            {showCalendarToggle && (
              <ToggleGroup 
                type="single" 
                value={viewMode} 
                onValueChange={(v) => v && setViewMode(v as 'list' | 'calendar')}
                className="border rounded-lg"
              >
                <ToggleGroupItem value="list" aria-label="List view" className="px-3">
                  <List className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="calendar" aria-label="Calendar view" className="px-3">
                  <LayoutGrid className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            )}
          </div>
        </div>

        {/* Non-admin Calendar View */}
        {showCalendarToggle && viewMode === 'calendar' && (
          <Card className="mb-6">
            <CardContent className="p-4" style={{ height: '700px' }}>
              <ScheduleCalendar 
                requests={getCurrentRequests()} 
                isStylistView={currentIsStylistView} 
              />
            </CardContent>
          </Card>
        )}

        {/* List / Tabs View */}
        {(isAdmin || viewMode === 'list') && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <ResponsiveTabsList onTabChange={setActiveTab}>
              {/* Stylist tab */}
              {isStylist && <TabsTrigger value="my-requests">My Requests</TabsTrigger>}
              
              {/* Stylist Assistant tab */}
              {isStylistAssistant && <TabsTrigger value="my-assignments">My Assignments</TabsTrigger>}
              
              {/* Admin tabs */}
              {isAdmin && (
                <>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="attention">
                    Needs Attention
                    {pendingRequests.length > 0 && (
                      <Badge variant="secondary" className="ml-2">{pendingRequests.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="assistants">
                    <UserCheck className="h-4 w-4 mr-1" />
                    Assistants ({filteredAssistants.length})
                  </TabsTrigger>
                  <TabsTrigger value="all">All Requests</TabsTrigger>
                  <TabsTrigger value="calendar">
                    <CalendarDays className="h-4 w-4 mr-1" />
                    Calendar
                  </TabsTrigger>
                </>
              )}
            </ResponsiveTabsList>

            {/* ===== ADMIN: Overview Tab ===== */}
            {isAdmin && (
              <TabsContent value="overview" className="space-y-6">
                {loadingAll ? (
                  <div className="text-center py-12 text-muted-foreground">Loading...</div>
                ) : (
                  <>
                    {/* Stats Grid */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <StatCard 
                        title="This Week" 
                        value={stats.thisWeek}
                        icon={CalendarDays}
                        description="Requests this week"
                      />
                      <StatCard 
                        title="Pending Assignment" 
                        value={stats.pending}
                        icon={Clock}
                        description="Waiting for assistant"
                        variant={stats.pending > 0 ? 'warning' : 'default'}
                      />
                      <StatCard 
                        title="Awaiting Response" 
                        value={stats.awaitingResponse}
                        icon={AlertCircle}
                        description="Assistant hasn't responded"
                        variant={stats.awaitingResponse > 0 ? 'warning' : 'default'}
                      />
                      <StatCard 
                        title="Acceptance Rate" 
                        value={`${stats.acceptanceRate}%`}
                        icon={TrendingUp}
                        description={`${stats.accepted} accepted`}
                        variant={stats.acceptanceRate >= 80 ? 'success' : stats.acceptanceRate >= 50 ? 'warning' : 'danger'}
                      />
                    </div>

                    {/* Summary row */}
                    <div className="grid gap-4 md:grid-cols-4">
                      <StatCard title="Total Requests" value={stats.total} icon={Users} />
                      <StatCard title="Completed" value={stats.completed} icon={CheckCircle2} variant="success" />
                      <StatCard title="Total Declines" value={stats.totalDeclines} icon={XCircle} variant={stats.totalDeclines > 5 ? 'danger' : 'default'} />
                      <StatCard title="Cancelled" value={stats.cancelled} icon={XCircle} />
                    </div>

                    {/* Assistant Activity */}
                    <AssistantActivityCard />

                    {/* Recent Requests */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Requests</CardTitle>
                        <CardDescription>Latest assistant request activity</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {recentRequests.length === 0 ? (
                          <p className="text-center py-8 text-muted-foreground">No requests yet</p>
                        ) : (
                          <div className="divide-y">
                            {recentRequests.map((request) => (
                              <AdminRequestRow key={request.id} request={request} onManualAssign={handleManualAssign} />
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>
            )}

            {/* ===== ADMIN: Needs Attention Tab ===== */}
            {isAdmin && (
              <TabsContent value="attention">
                <Card>
                  <CardHeader>
                    <CardTitle>Requests Needing Attention</CardTitle>
                    <CardDescription>Pending assignments and awaiting responses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pendingRequests.length === 0 ? (
                      <div className="text-center py-12">
                        <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
                        <p className="text-muted-foreground">All caught up! No pending requests.</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {pendingRequests.map((request) => (
                          <AdminRequestRow key={request.id} request={request} onManualAssign={handleManualAssign} />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* ===== ADMIN: Assistants Tab ===== */}
            {isAdmin && (
              <TabsContent value="assistants" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Active Assistants</CardTitle>
                    <CardDescription>Assistants and their location schedules</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {filteredAssistants.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">No active assistants found</p>
                    ) : (
                      <div className="space-y-4">
                        {filteredAssistants.map((assistant) => (
                          <div key={assistant.user_id} className="flex items-start gap-4 p-4 border rounded-lg">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={assistant.photo_url || undefined} />
                              <AvatarFallback>{(assistant.display_name || assistant.full_name).charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="font-medium">{assistant.display_name || assistant.full_name}</h4>
                              {assistant.schedules.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No schedule set</p>
                              ) : (
                                <div className="mt-2 space-y-2">
                                  {assistant.schedules.map((schedule) => {
                                    const location = locations.find(l => l.id === schedule.location_id);
                                    return (
                                      <div key={schedule.location_id} className="flex items-center gap-2 text-sm">
                                        <MapPin className="h-3 w-3 text-muted-foreground" />
                                        <span className="font-medium">{location?.name || schedule.location_id}:</span>
                                        <div className="flex gap-1">
                                          {DAYS_OF_WEEK.map(day => (
                                            <span
                                              key={day}
                                              className={cn(
                                                "px-1.5 py-0.5 rounded text-xs",
                                                schedule.work_days?.includes(day)
                                                  ? "bg-primary/10 text-primary font-medium"
                                                  : "text-muted-foreground/50"
                                              )}
                                            >
                                              {day}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Workload Distribution */}
                <AssistantWorkloadChart requests={allRequests} />
              </TabsContent>
            )}

            {/* ===== ADMIN: All Requests Tab ===== */}
            {isAdmin && (
              <TabsContent value="all">
                <Card>
                  <CardHeader>
                    <CardTitle>All Requests</CardTitle>
                    <CardDescription>Complete history of assistant requests</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingAll ? (
                      <div className="text-center py-8 text-muted-foreground">Loading...</div>
                    ) : allRequests.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">No requests yet</p>
                    ) : (
                      <div className="divide-y">
                        {allRequests.map((request) => (
                          <AdminRequestRow key={request.id} request={request} onManualAssign={handleManualAssign} />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* ===== ADMIN: Calendar Tab ===== */}
            {isAdmin && (
              <TabsContent value="calendar">
                <Card>
                  <CardContent className="p-4" style={{ height: '700px' }}>
                    <AssistantRequestsCalendar requests={allRequests} onSelectRequest={handleManualAssign} />
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* ===== STYLIST TABS (unchanged) ===== */}
            {isStylist && (
              <TabsContent value="my-requests">
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Requests</CardTitle>
                    <CardDescription>Your pending and assigned assistant requests</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingMyRequests ? (
                      <div className="text-center py-8 text-muted-foreground">Loading...</div>
                    ) : (
                      <RequestsList requests={filterActive(myRequests)} isStylistView={true} />
                    )}
                  </CardContent>
                </Card>

                {filterCompleted(myRequests).length > 0 && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Past Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RequestsList requests={filterCompleted(myRequests)} isStylistView={true} />
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            )}

            {/* ===== STYLIST ASSISTANT TABS (unchanged) ===== */}
            {isStylistAssistant && (
              <TabsContent value="my-assignments">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Assignments</CardTitle>
                    <CardDescription>Stylists you're scheduled to assist</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingMyAssignments ? (
                      <div className="text-center py-8 text-muted-foreground">Loading...</div>
                    ) : (
                      <RequestsList requests={filterActive(myAssignments)} isStylistView={false} />
                    )}
                  </CardContent>
                </Card>

                {filterCompleted(myAssignments).length > 0 && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Completed</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RequestsList requests={filterCompleted(myAssignments)} isStylistView={false} />
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            )}
          </Tabs>
        )}

        {/* Manual Assignment Dialog */}
        <ManualAssignmentDialog
          request={selectedRequest}
          open={manualAssignOpen}
          onOpenChange={setManualAssignOpen}
        />
      </div>
    </DashboardLayout>
  );
}
