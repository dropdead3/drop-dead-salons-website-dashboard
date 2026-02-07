import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, User, CheckCircle, XCircle, Loader2, ExternalLink, ClipboardList, MessageSquareMore } from 'lucide-react';
import { AccountabilityOverview } from '@/components/coaching/AccountabilityOverview';
import { ManagerMeetingRequest } from '@/components/coaching/ManagerMeetingRequest';
import { PendingMeetingRequests } from '@/components/coaching/PendingMeetingRequests';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectiveRoles } from '@/hooks/useEffectiveUser';
import { useAvailableCoaches, useOneOnOneMeetings, useCreateMeeting, useUpdateMeetingStatus } from '@/hooks/useOneOnOneMeetings';
import { format, parseISO } from 'date-fns';

const meetingTypes = [
  { value: 'coaching', label: 'Coaching Session' },
  { value: 'check_in', label: 'Check-in' },
  { value: 'feedback', label: 'Feedback Review' },
  { value: 'sas', label: 'Success Alignment Session (SAS)' },
  { value: 'other', label: 'Other' },
];

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00',
];

export default function ScheduleMeeting() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const roles = useEffectiveRoles();
  const isCoach = roles.includes('admin') || roles.includes('manager') || roles.includes('super_admin');
  const { data: coaches = [], isLoading: loadingCoaches } = useAvailableCoaches();
  const { data: meetings = [], isLoading: loadingMeetings } = useOneOnOneMeetings();
  const createMeeting = useCreateMeeting();
  const updateStatus = useUpdateMeetingStatus();

  const [selectedCoach, setSelectedCoach] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [meetingType, setMeetingType] = useState('coaching');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCoach || !meetingDate || !startTime) return;

    // Calculate end time (30 min meeting)
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = minutes >= 30 ? hours + 1 : hours;
    const endMinutes = minutes >= 30 ? '00' : '30';
    const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes}`;

    createMeeting.mutate({
      coach_id: selectedCoach,
      meeting_date: meetingDate,
      start_time: startTime,
      end_time: endTime,
      meeting_type: meetingType,
      notes: notes || undefined,
    }, {
      onSuccess: () => {
        setSelectedCoach('');
        setMeetingDate('');
        setStartTime('');
        setMeetingType('coaching');
        setNotes('');
      },
    });
  };

  const myMeetings = meetings.filter(m => m.requester_id === user?.id);
  const coachMeetings = isCoach ? meetings.filter(m => m.coach_id === user?.id) : [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'confirmed':
        return <Badge className="bg-green-600">Confirmed</Badge>;
      case 'completed':
        return <Badge variant="outline">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const MeetingCard = ({ meeting, showActions = false }: { meeting: typeof meetings[0]; showActions?: boolean }) => (
    <Card key={meeting.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate(`/dashboard/meeting/${meeting.id}`)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {format(parseISO(meeting.meeting_date), 'EEEE, MMMM d, yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                {meeting.start_time.slice(0, 5)} - {meeting.end_time.slice(0, 5)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                {showActions 
                  ? `With: ${meeting.requester?.display_name || meeting.requester?.full_name || 'Unknown'}`
                  : `Coach: ${meeting.coach?.display_name || meeting.coach?.full_name || 'Unknown'}`
                }
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {meetingTypes.find(t => t.value === meeting.meeting_type)?.label || meeting.meeting_type}
              </Badge>
              {getStatusBadge(meeting.status)}
            </div>
            {meeting.notes && (
              <p className="text-sm text-muted-foreground mt-2">{meeting.notes}</p>
            )}
          </div>
          
          <div className="flex flex-col gap-2 items-end">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/meeting/${meeting.id}`); }}
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Open
            </Button>
            
            {showActions && meeting.status === 'pending' && (
              <>
                <Button
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ id: meeting.id, status: 'confirmed' }); }}
                  disabled={updateStatus.isPending}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Confirm
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ id: meeting.id, status: 'cancelled' }); }}
                  disabled={updateStatus.isPending}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Decline
                </Button>
              </>
            )}
            
            {!showActions && meeting.status === 'pending' && meeting.requester_id === user?.id && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ id: meeting.id, status: 'cancelled' }); }}
                disabled={updateStatus.isPending}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-medium mb-2">Schedule 1:1 Meeting</h1>
          <p className="text-muted-foreground">
            Book time with a coach or manager for feedback, check-ins, or support.
          </p>
        </div>

        <Tabs defaultValue="schedule" className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="schedule">Schedule New</TabsTrigger>
            <TabsTrigger value="my-meetings">My Meetings</TabsTrigger>
            {isCoach && <TabsTrigger value="requests">Requests</TabsTrigger>}
            {isCoach && (
              <TabsTrigger value="commitments" className="flex items-center gap-1">
                <ClipboardList className="h-4 w-4" />
                My Commitments
              </TabsTrigger>
            )}
            <TabsTrigger value="meeting-requests" className="flex items-center gap-1">
              <MessageSquareMore className="h-4 w-4" />
              Meeting Requests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>Request a Meeting</CardTitle>
                <CardDescription>
                  Select a coach and time that works for you.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="coach">Select Coach</Label>
                    <Select value={selectedCoach} onValueChange={setSelectedCoach}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a coach or manager..." />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingCoaches ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : coaches.length === 0 ? (
                          <SelectItem value="none" disabled>No coaches available</SelectItem>
                        ) : (
                          coaches.map(coach => (
                            <SelectItem key={coach.user_id} value={coach.user_id}>
                              {coach.display_name || coach.full_name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={meetingDate}
                        onChange={(e) => setMeetingDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="time">Time</Label>
                      <Select value={startTime} onValueChange={setStartTime}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select time..." />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map(time => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Meeting Type</Label>
                    <Select value={meetingType} onValueChange={setMeetingType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {meetingTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="What would you like to discuss?"
                      rows={3}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={!selectedCoach || !meetingDate || !startTime || createMeeting.isPending}
                    className="w-full"
                  >
                    {createMeeting.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Request Meeting'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="my-meetings">
            <div className="space-y-4">
              {loadingMeetings ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  </CardContent>
                </Card>
              ) : myMeetings.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No meetings scheduled yet. Request a meeting above!
                  </CardContent>
                </Card>
              ) : (
                myMeetings.map(meeting => (
                  <MeetingCard key={meeting.id} meeting={meeting} />
                ))
              )}
            </div>
          </TabsContent>

          {isCoach && (
            <TabsContent value="requests">
              <div className="space-y-4">
                {loadingMeetings ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                    </CardContent>
                  </Card>
                ) : coachMeetings.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                      No meeting requests yet.
                    </CardContent>
                  </Card>
                ) : (
                  coachMeetings.map(meeting => (
                    <MeetingCard key={meeting.id} meeting={meeting} showActions />
                  ))
                )}
              </div>
            </TabsContent>
          )}

          {isCoach && (
            <TabsContent value="commitments">
              <AccountabilityOverview />
            </TabsContent>
          )}

          <TabsContent value="meeting-requests">
            <div className="space-y-4">
              {isCoach && (
                <div className="flex justify-end">
                  <ManagerMeetingRequest />
                </div>
              )}
              <PendingMeetingRequests viewAs={isCoach ? 'manager' : 'team_member'} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
