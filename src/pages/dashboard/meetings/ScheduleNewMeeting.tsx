import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PlatformPageContainer } from '@/components/platform/ui/PlatformPageContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAvailableCoaches, useCreateMeeting } from '@/hooks/useOneOnOneMeetings';

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

export default function ScheduleNewMeeting() {
  const { data: coaches = [], isLoading: loadingCoaches } = useAvailableCoaches();
  const createMeeting = useCreateMeeting();

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

  return (
    <DashboardLayout>
      <PlatformPageContainer maxWidth="narrow">
        <div className="space-y-6">
          <div>
            <Link to="/dashboard/schedule-meeting">
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Meetings Hub
              </Button>
            </Link>
            <h1 className="font-display text-3xl lg:text-4xl">Schedule Meeting</h1>
            <p className="text-muted-foreground mt-1">
              Request a 1:1 with a coach or manager.
            </p>
          </div>

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
        </div>
      </PlatformPageContainer>
    </DashboardLayout>
  );
}
