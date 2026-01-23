import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Clock, 
  DollarSign,
  Check,
  Loader2,
  UserPlus,
  X,
  CalendarPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useServicesByCategory } from '@/hooks/usePhorestServices';
import { useLocations } from '@/hooks/useLocations';
import { NewClientDialog } from './NewClientDialog';
import { useAuth } from '@/contexts/AuthContext';

interface QuickBookingPopoverProps {
  date: Date;
  time: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface PhorestClient {
  id: string;
  phorest_client_id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

type Step = 'client' | 'details';

export function QuickBookingPopover({
  date,
  time,
  open,
  onOpenChange,
  children,
}: QuickBookingPopoverProps) {
  const queryClient = useQueryClient();
  const { user, roles } = useAuth();
  const [step, setStep] = useState<Step>('client');
  const [showNewClientDialog, setShowNewClientDialog] = useState(false);
  
  // Form state
  const [selectedClient, setSelectedClient] = useState<PhorestClient | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedStylist, setSelectedStylist] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  const { data: locations = [] } = useLocations();
  const { data: servicesByCategory, services = [] } = useServicesByCategory(selectedLocation || undefined);

  // Check if user can view all clients (admins, managers, super_admin)
  const canViewAllClients = roles.some(r => ['admin', 'manager', 'super_admin'].includes(r));

  // Fetch clients - stylists only see their own clients via RLS + preferred_stylist_id filter
  const { data: clients = [] } = useQuery({
    queryKey: ['phorest-clients-booking', clientSearch, user?.id, canViewAllClients],
    queryFn: async () => {
      let query = supabase
        .from('phorest_clients')
        .select('id, phorest_client_id, name, email, phone, preferred_stylist_id')
        .order('name')
        .limit(20);
      
      // Stylists only see their own clients
      if (!canViewAllClients && user?.id) {
        query = query.eq('preferred_stylist_id', user.id);
      }
      
      if (clientSearch) {
        query = query.or(`name.ilike.%${clientSearch}%,phone.ilike.%${clientSearch}%,email.ilike.%${clientSearch}%`);
      }
      
      const { data } = await query;
      return data as PhorestClient[];
    },
    enabled: !!user?.id,
  });

  // Fetch stylists
  const { data: stylists = [] } = useQuery({
    queryKey: ['booking-stylists'],
    queryFn: async () => {
      const { data } = await supabase
        .from('phorest_staff_mapping')
        .select(`
          phorest_staff_id,
          user_id,
          employee_profiles!phorest_staff_mapping_user_id_fkey(
            display_name,
            full_name,
            photo_url
          )
        `)
        .eq('is_active', true);
      return data || [];
    },
  });

  // Calculate totals
  const selectedServiceDetails = useMemo(() => {
    return services.filter(s => selectedServices.includes(s.phorest_service_id));
  }, [services, selectedServices]);

  const totalDuration = useMemo(() => {
    return selectedServiceDetails.reduce((sum, s) => sum + s.duration_minutes, 0);
  }, [selectedServiceDetails]);

  const totalPrice = useMemo(() => {
    return selectedServiceDetails.reduce((sum, s) => sum + (s.price || 0), 0);
  }, [selectedServiceDetails]);

  // Create booking mutation
  const createBooking = useMutation({
    mutationFn: async () => {
      const stylistMapping = stylists.find(s => s.user_id === selectedStylist);
      if (!stylistMapping || !selectedClient) throw new Error('Missing required data');

      const startDateTime = `${format(date, 'yyyy-MM-dd')}T${time}:00Z`;

      const response = await supabase.functions.invoke('create-phorest-booking', {
        body: {
          branch_id: selectedLocation,
          client_id: selectedClient.phorest_client_id,
          staff_id: stylistMapping.phorest_staff_id,
          service_ids: selectedServices,
          start_time: startDateTime,
        },
      });

      if (response.error) throw response.error;
      if (!response.data?.success) throw new Error(response.data?.error || 'Booking failed');

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phorest-appointments'] });
      toast.success('Booking created!');
      handleClose();
    },
    onError: (error: Error) => {
      toast.error('Failed to create booking', { description: error.message });
    },
  });

  const handleClose = () => {
    setStep('client');
    setSelectedClient(null);
    setClientSearch('');
    setSelectedServices([]);
    setSelectedStylist('');
    setSelectedLocation('');
    onOpenChange(false);
  };

  const formatTime12h = (t: string) => {
    const [hours, minutes] = t.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const canBook = selectedClient && selectedServices.length > 0 && selectedStylist && selectedLocation;

  return (
    <>
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          {children}
        </PopoverTrigger>
        <PopoverContent 
          side="right" 
          align="start" 
          className="w-80 p-0 shadow-xl border-border"
          sideOffset={8}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <CalendarPlus className="h-4 w-4 text-primary" />
              <div>
                <div className="font-medium text-sm">New Booking</div>
                <div className="text-xs text-muted-foreground">
                  {format(date, 'EEE, MMM d')} at {formatTime12h(time)}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="max-h-[400px]">
            {/* Step 1: Client Selection */}
            {step === 'client' && (
              <div className="p-3 space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search clients..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="pl-8 h-8 text-sm"
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setShowNewClientDialog(true)}
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="space-y-1">
                  {clients.slice(0, 6).map((client) => (
                    <div
                      key={client.id}
                      className={cn(
                        'p-2 rounded-md cursor-pointer transition-colors flex items-center gap-2',
                        selectedClient?.id === client.id 
                          ? 'bg-primary/10 border border-primary/30' 
                          : 'hover:bg-muted/50'
                      )}
                      onClick={() => setSelectedClient(client)}
                    >
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-xs">{client.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{client.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {client.phone || client.email || 'No contact'}
                        </div>
                      </div>
                      {selectedClient?.id === client.id && (
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>

                {selectedClient && (
                  <Button 
                    className="w-full" 
                    size="sm"
                    onClick={() => setStep('details')}
                  >
                    Continue with {selectedClient.name.split(' ')[0]}
                  </Button>
                )}
              </div>
            )}

            {/* Step 2: Service & Stylist Selection */}
            {step === 'details' && (
              <div className="p-3 space-y-3">
                {/* Selected Client */}
                <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">{selectedClient?.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{selectedClient?.name}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="ml-auto h-6 px-2 text-xs"
                    onClick={() => setStep('client')}
                  >
                    Change
                  </Button>
                </div>

                {/* Location */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Location</Label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Stylist */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Stylist</Label>
                  <Select value={selectedStylist} onValueChange={setSelectedStylist}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Select stylist" />
                    </SelectTrigger>
                    <SelectContent>
                      {stylists.map((s) => (
                        <SelectItem key={s.user_id} value={s.user_id}>
                          {s.employee_profiles?.display_name || s.employee_profiles?.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Services */}
                {selectedLocation && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Services</Label>
                    <ScrollArea className="h-[140px] border border-border rounded-md">
                      <div className="p-2 space-y-1">
                        {servicesByCategory && Object.entries(servicesByCategory).map(([category, categoryServices]) => (
                          <div key={category}>
                            <div className="text-xs font-medium text-muted-foreground mb-1">{category}</div>
                            {categoryServices.map((service) => (
                              <div
                                key={service.id}
                                className={cn(
                                  'p-1.5 rounded cursor-pointer transition-colors text-sm flex items-center justify-between',
                                  selectedServices.includes(service.phorest_service_id)
                                    ? 'bg-primary/10'
                                    : 'hover:bg-muted/50'
                                )}
                                onClick={() => {
                                  setSelectedServices(prev =>
                                    prev.includes(service.phorest_service_id)
                                      ? prev.filter(id => id !== service.phorest_service_id)
                                      : [...prev, service.phorest_service_id]
                                  );
                                }}
                              >
                                <span className="truncate">{service.name}</span>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
                                  <span className="flex items-center gap-0.5">
                                    <Clock className="h-3 w-3" />
                                    {service.duration_minutes}m
                                  </span>
                                  {service.price && (
                                    <span className="flex items-center gap-0.5">
                                      <DollarSign className="h-3 w-3" />
                                      {service.price}
                                    </span>
                                  )}
                                  {selectedServices.includes(service.phorest_service_id) && (
                                    <Check className="h-3 w-3 text-primary" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Summary & Book */}
                {selectedServices.length > 0 && (
                  <div className="p-2 bg-muted/30 rounded-md text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>{selectedServices.length} service(s)</span>
                      <span>{totalDuration} min</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Estimated Total</span>
                      <span>${totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <Button 
                  className="w-full" 
                  size="sm"
                  disabled={!canBook || createBooking.isPending}
                  onClick={() => createBooking.mutate()}
                >
                  {createBooking.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Booking'
                  )}
                </Button>
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      <NewClientDialog
        open={showNewClientDialog}
        onOpenChange={setShowNewClientDialog}
        onClientCreated={(client) => {
          setSelectedClient({
            id: client.id,
            phorest_client_id: client.phorest_client_id,
            name: client.name,
            email: client.email,
            phone: client.phone,
          });
        }}
      />
    </>
  );
}
