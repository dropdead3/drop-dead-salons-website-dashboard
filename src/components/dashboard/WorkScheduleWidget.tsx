import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Clock, Send, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { useLocations } from '@/hooks/useLocations';
import { 
  useLocationSchedule, 
  useUpsertLocationSchedule, 
  useCreateScheduleChangeRequest,
  useMyScheduleChangeRequests 
} from '@/hooks/useLocationSchedules';
import { cn } from '@/lib/utils';

const DAYS_OF_WEEK = [
  { key: 'Mon', label: 'Monday' },
  { key: 'Tue', label: 'Tuesday' },
  { key: 'Wed', label: 'Wednesday' },
  { key: 'Thu', label: 'Thursday' },
  { key: 'Fri', label: 'Friday' },
  { key: 'Sat', label: 'Saturday' },
  { key: 'Sun', label: 'Sunday' },
];

export function WorkScheduleWidget() {
  const { data: profile } = useEmployeeProfile();
  const { data: locations } = useLocations();
  const { data: myRequests } = useMyScheduleChangeRequests();
  
  const userLocations = locations?.filter(loc => 
    profile?.location_ids?.includes(loc.id) || profile?.location_id === loc.id
  ) || [];

  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requestedDays, setRequestedDays] = useState<string[]>([]);
  const [reason, setReason] = useState('');

  const { data: currentSchedule, isLoading } = useLocationSchedule(selectedLocationId);
  const upsertSchedule = useUpsertLocationSchedule();
  const createRequest = useCreateScheduleChangeRequest();

  // Set default location when data loads
  useEffect(() => {
    if (userLocations.length > 0 && !selectedLocationId) {
      setSelectedLocationId(userLocations[0].id);
    }
  }, [userLocations, selectedLocationId]);

  // Initialize requested days when opening dialog
  useEffect(() => {
    if (requestDialogOpen && currentSchedule) {
      setRequestedDays(currentSchedule.work_days || []);
    }
  }, [requestDialogOpen, currentSchedule]);

  const toggleDay = (day: string) => {
    setRequestedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day) 
        : [...prev, day]
    );
  };

  const handleSubmitRequest = async () => {
    if (!selectedLocationId) return;
    
    await createRequest.mutateAsync({
      locationId: selectedLocationId,
      currentDays: currentSchedule?.work_days || [],
      requestedDays,
      reason,
    });

    setRequestDialogOpen(false);
    setReason('');
  };

  const pendingRequest = myRequests?.find(
    r => r.location_id === selectedLocationId && r.status === 'pending'
  );

  const selectedLocation = locations?.find(l => l.id === selectedLocationId);

  if (userLocations.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Preferred Work Schedule
          </CardTitle>
          <CardDescription className="mt-1">
            Your general availability, not day-to-day schedule
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No locations assigned. Please update your profile with your work locations.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Preferred Work Schedule
            </CardTitle>
            <CardDescription className="mt-1">
              Your general availability preferences, not day-to-day schedule
            </CardDescription>
          </div>
          <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" disabled={!!pendingRequest}>
                <Send className="w-4 h-4 mr-2" />
                Request Change
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Preference Change</DialogTitle>
                <DialogDescription>
                  Submit a request to update your preferred work days at {selectedLocation?.name}. 
                  This reflects your general availability, not specific dates. Leadership will review your request.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Select your preferred work days</label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <Button
                        key={day.key}
                        type="button"
                        variant={requestedDays.includes(day.key) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleDay(day.key)}
                        className={cn(
                          "min-w-[60px]",
                          requestedDays.includes(day.key) && "bg-primary text-primary-foreground"
                        )}
                      >
                        {day.key}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {requestedDays.length} days selected
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Reason (optional)</label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Explain why you'd like to change your schedule..."
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setRequestDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitRequest}
                  disabled={createRequest.isPending}
                >
                  {createRequest.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Location selector */}
        {userLocations.length > 1 && (
          <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {userLocations.map(loc => (
                <SelectItem key={loc.id} value={loc.id}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {userLocations.length === 1 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            {userLocations[0].name}
          </div>
        )}

        {/* Pending request banner */}
        {pendingRequest && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span className="text-sm text-amber-700 dark:text-amber-400">
              You have a pending schedule change request
            </span>
          </div>
        )}

        {/* Current schedule display */}
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const isWorking = currentSchedule?.work_days?.includes(day.key);
                return (
                  <Badge
                    key={day.key}
                    variant={isWorking ? 'default' : 'outline'}
                    className={cn(
                      "min-w-[50px] justify-center py-1.5",
                      isWorking 
                        ? "bg-primary/90 text-primary-foreground" 
                        : "text-muted-foreground"
                    )}
                  >
                    {day.key}
                  </Badge>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentSchedule?.work_days?.length || 0} days per week
            </p>
          </div>
        )}

        {/* Recent requests */}
        {myRequests && myRequests.filter(r => r.location_id === selectedLocationId).length > 0 && (
          <div className="pt-3 border-t">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Recent Requests</h4>
            <div className="space-y-2">
              {myRequests
                .filter(r => r.location_id === selectedLocationId)
                .slice(0, 3)
                .map(request => (
                  <div key={request.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {request.requested_days.join(', ')}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        request.status === 'approved' && "text-green-600 border-green-600",
                        request.status === 'denied' && "text-red-600 border-red-600",
                        request.status === 'pending' && "text-amber-600 border-amber-600"
                      )}
                    >
                      {request.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {request.status === 'denied' && <XCircle className="w-3 h-3 mr-1" />}
                      {request.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                      {request.status}
                    </Badge>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
