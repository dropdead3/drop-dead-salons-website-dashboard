import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useStylistAvailability, formatAvailability } from '@/hooks/useStylistAvailability';

interface WalkInDialogProps {
  locationId?: string;
  onSuccess?: () => void;
}

export function WalkInDialog({ locationId, onSuccess }: WalkInDialogProps) {
  const [open, setOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [stylistId, setStylistId] = useState('');
  const queryClient = useQueryClient();

  // Fetch available services
  const { data: services } = useQuery({
    queryKey: ['phorest-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('phorest_services')
        .select('*')
        .eq('is_active', true)
        .order('category')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  // Get selected service duration for availability calculation
  const selectedService = services?.find(s => s.id === serviceId);
  const serviceDuration = selectedService?.duration_minutes || 60;

  // Fetch available stylists using the smart availability hook
  const { data: availableStylists, isLoading: stylistsLoading } = useStylistAvailability(
    locationId,
    serviceDuration
  );

  // Create walk-in appointment
  const createWalkIn = useMutation({
    mutationFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const now = format(new Date(), 'HH:mm');
      
      // Get service details
      const service = services?.find(s => s.id === serviceId);
      
      
      // Calculate end time (assume 60 minutes if no duration)
      const durationMinutes = service?.duration_minutes || 60;
      const [hours, mins] = now.split(':').map(Number);
      const endMinutes = hours * 60 + mins + durationMinutes;
      const endHour = Math.floor(endMinutes / 60);
      const endMin = endMinutes % 60;
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;

      const { error } = await supabase
        .from('phorest_appointments')
        .insert({
          phorest_id: `walk-in-${Date.now()}`,
          appointment_date: today,
          start_time: now,
          end_time: endTime,
          client_name: clientName || 'Walk-in',
          client_phone: clientPhone || null,
          service_name: service?.name || 'Walk-in Service',
          service_category: service?.category || null,
          status: 'checked_in',
          total_price: service?.price || null,
          stylist_user_id: stylistId || null,
          location_id: locationId !== 'all' ? locationId : null,
          is_new_client: true,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Walk-in added to queue');
      queryClient.invalidateQueries({ queryKey: ['todays-queue'] });
      setOpen(false);
      resetForm();
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error('Failed to create walk-in', { description: error.message });
    },
  });

  const resetForm = () => {
    setClientName('');
    setClientPhone('');
    setServiceId('');
    setStylistId('');
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClientPhone(formatPhoneNumber(e.target.value));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <UserPlus className="w-4 h-4" />
          Quick Walk-In
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-display">Add Walk-In Client</DialogTitle>
          <DialogDescription>
            Create a walk-in appointment and add them directly to the queue.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="clientName">Client Name (optional)</Label>
            <Input
              id="clientName"
              placeholder="Guest"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="clientPhone">Phone Number (optional)</Label>
            <Input
              id="clientPhone"
              placeholder="(555) 555-5555"
              value={clientPhone}
              onChange={handlePhoneChange}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="service">Service</Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {services?.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name} {service.price ? `- $${service.price}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="stylist">Assign to Stylist</Label>
            <Select value={stylistId} onValueChange={setStylistId}>
              <SelectTrigger>
                <SelectValue placeholder={stylistsLoading ? "Loading..." : "Select a stylist"} />
              </SelectTrigger>
              <SelectContent>
                {availableStylists?.length === 0 && !stylistsLoading && (
                  <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                    No stylists available for this service today
                  </div>
                )}
                {availableStylists?.map((stylist) => (
                  <SelectItem key={stylist.user_id} value={stylist.user_id}>
                    <div className="flex items-center justify-between w-full gap-3">
                      <span>{stylist.display_name || stylist.full_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatAvailability(stylist.availableMinutes)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => createWalkIn.mutate()}
            disabled={createWalkIn.isPending}
          >
            {createWalkIn.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Add to Queue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
