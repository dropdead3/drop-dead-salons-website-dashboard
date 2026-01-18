import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, User, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useSalonServices, useCreateAssistantRequest } from '@/hooks/useAssistantRequests';

interface RequestAssistantDialogProps {
  children: React.ReactNode;
}

export function RequestAssistantDialog({ children }: RequestAssistantDialogProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date>();
  const [serviceId, setServiceId] = useState('');
  const [clientName, setClientName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [notes, setNotes] = useState('');

  const { data: services = [], isLoading: servicesLoading } = useSalonServices();
  const createRequest = useCreateAssistantRequest();

  const selectedService = services.find(s => s.id === serviceId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !serviceId || !clientName || !startTime) return;

    await createRequest.mutateAsync({
      service_id: serviceId,
      client_name: clientName,
      request_date: format(date, 'yyyy-MM-dd'),
      start_time: startTime,
      notes: notes || undefined,
    });

    // Reset form
    setDate(undefined);
    setServiceId('');
    setClientName('');
    setStartTime('');
    setNotes('');
    setOpen(false);
  };

  // Generate time slots from 8 AM to 8 PM in 15-minute increments
  const timeSlots = [];
  for (let hour = 8; hour <= 20; hour++) {
    for (let min = 0; min < 60; min += 15) {
      const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      const displayTime = `${hour > 12 ? hour - 12 : hour}:${min.toString().padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
      timeSlots.push({ value: time, label: displayTime });
    }
  }

  // Group services by category
  const groupedServices = services.reduce((acc, service) => {
    const category = service.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(service);
    return acc;
  }, {} as Record<string, typeof services>);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Assistant</DialogTitle>
          <DialogDescription>
            Submit a request for assistant help during a service. An assistant will be automatically assigned.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Service Selection */}
          <div className="space-y-2">
            <Label htmlFor="service">Service Type</Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(groupedServices).map(([category, categoryServices]) => (
                  <div key={category}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      {category}
                    </div>
                    {categoryServices.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} ({service.duration_minutes} min)
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
            {selectedService && (
              <p className="text-xs text-muted-foreground">
                Duration: {selectedService.duration_minutes} minutes
              </p>
            )}
          </div>

          {/* Client Name */}
          <div className="space-y-2">
            <Label htmlFor="clientName">Client Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Enter client name"
                className="pl-9"
                required
              />
            </div>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label>Start Time</Label>
            <Select value={startTime} onValueChange={setStartTime}>
              <SelectTrigger>
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Select start time" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((slot) => (
                  <SelectItem key={slot.value} value={slot.value}>
                    {slot.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions..."
              rows={2}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!date || !serviceId || !clientName || !startTime || createRequest.isPending}
          >
            {createRequest.isPending ? 'Submitting...' : 'Submit Request'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}