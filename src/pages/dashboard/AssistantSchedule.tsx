import { useState } from 'react';
import { format, parseISO, isToday, isTomorrow, isPast } from 'date-fns';
import { Plus, Clock, User, CheckCircle2, XCircle, Calendar, List, LayoutGrid, MapPin, Repeat } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RequestAssistantDialog } from '@/components/dashboard/RequestAssistantDialog';
import { ScheduleCalendar } from '@/components/dashboard/ScheduleCalendar';
import { useAssistantRequests, useUpdateRequestStatus, type AssistantRequest } from '@/hooks/useAssistantRequests';
import { useActiveLocations } from '@/hooks/useLocations';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

function formatTime(time: string) {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function formatDateLabel(dateStr: string) {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEEE, MMM d');
}

function RequestCard({ request, isStylistView }: { request: AssistantRequest; isStylistView: boolean }) {
  const updateStatus = useUpdateRequestStatus();
  const isPastRequest = isPast(parseISO(request.request_date + 'T' + request.end_time));

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    assigned: 'bg-green-100 text-green-800 border-green-200',
    completed: 'bg-blue-100 text-blue-800 border-blue-200',
    cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  const handleComplete = () => {
    updateStatus.mutate({ id: request.id, status: 'completed' });
  };

  const handleCancel = () => {
    updateStatus.mutate({ id: request.id, status: 'cancelled' });
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
                {request.status}
              </Badge>
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

          {request.status === 'assigned' && !isPastRequest && (
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
  // Group by date
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
            {formatDateLabel(date)}
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

export default function AssistantSchedule() {
  const { roles } = useAuth();
  const isStylist = roles.includes('stylist');
  const isAssistant = roles.includes('assistant');
  const isAdmin = roles.includes('admin') || roles.includes('manager');

  const [activeTab, setActiveTab] = useState<'my-requests' | 'my-assignments' | 'all'>(
    isStylist ? 'my-requests' : isAssistant ? 'my-assignments' : 'all'
  );
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [locationFilter, setLocationFilter] = useState<string>('all');

  const { data: locations = [] } = useActiveLocations();

  const effectiveLocationFilter = locationFilter === 'all' ? undefined : locationFilter;

  const { data: myRequests = [], isLoading: loadingMyRequests } = useAssistantRequests('stylist', effectiveLocationFilter);
  const { data: myAssignments = [], isLoading: loadingMyAssignments } = useAssistantRequests('assistant', effectiveLocationFilter);
  const { data: allRequests = [], isLoading: loadingAll } = useAssistantRequests('all', effectiveLocationFilter);

  // Filter to show upcoming/active requests
  const filterActive = (requests: AssistantRequest[]) => 
    requests.filter(r => r.status !== 'completed' && r.status !== 'cancelled');

  const filterCompleted = (requests: AssistantRequest[]) =>
    requests.filter(r => r.status === 'completed' || r.status === 'cancelled');

  // Get current requests based on active tab
  const getCurrentRequests = () => {
    if (activeTab === 'my-requests') return myRequests;
    if (activeTab === 'my-assignments') return myAssignments;
    return allRequests;
  };

  const currentIsStylistView = activeTab === 'my-requests';

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold">Assistant Schedule</h1>
            <p className="text-muted-foreground">
              {isStylist ? 'Request help from salon assistants' : 'View your assignments'}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Location Filter */}
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
          </div>
        </div>

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <Card className="mb-6">
            <CardContent className="p-4" style={{ height: '700px' }}>
              <ScheduleCalendar 
                requests={getCurrentRequests()} 
                isStylistView={currentIsStylistView} 
              />
            </CardContent>
          </Card>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="mb-6">
              {isStylist && <TabsTrigger value="my-requests">My Requests</TabsTrigger>}
              {isAssistant && <TabsTrigger value="my-assignments">My Assignments</TabsTrigger>}
              {isAdmin && <TabsTrigger value="all">All Requests</TabsTrigger>}
            </TabsList>

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

            {isAssistant && (
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

            {isAdmin && (
              <TabsContent value="all">
                <Card>
                  <CardHeader>
                    <CardTitle>All Requests</CardTitle>
                    <CardDescription>Overview of all assistant requests</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingAll ? (
                      <div className="text-center py-8 text-muted-foreground">Loading...</div>
                    ) : (
                      <RequestsList requests={filterActive(allRequests)} isStylistView={false} />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}