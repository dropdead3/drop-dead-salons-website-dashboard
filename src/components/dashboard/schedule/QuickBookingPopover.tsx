import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Clock, 
  DollarSign,
  Check,
  Loader2,
  UserPlus,
  X,
  CalendarPlus,
  ChevronLeft,
  MapPin,
  Scissors
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAllServicesByCategory } from '@/hooks/usePhorestServices';
import { useLocations } from '@/hooks/useLocations';
import { NewClientDialog } from './NewClientDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useServiceCategoryColorsMap } from '@/hooks/useServiceCategoryColors';
import { getCategoryColor } from '@/utils/categoryColors';

interface QuickBookingPopoverProps {
  date: Date;
  time: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  defaultLocationId?: string;
}

interface PhorestClient {
  id: string;
  phorest_client_id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

type Step = 'service' | 'location' | 'client' | 'stylist' | 'confirm';

const STEPS: Step[] = ['service', 'location', 'client', 'stylist', 'confirm'];

// Sort categories with consultation first
const sortCategories = (categories: string[]): string[] => {
  return [...categories].sort((a, b) => {
    const aIsConsult = a.toLowerCase().includes('consult');
    const bIsConsult = b.toLowerCase().includes('consult');
    if (aIsConsult && !bIsConsult) return -1;
    if (!aIsConsult && bIsConsult) return 1;
    return a.localeCompare(b);
  });
};

export function QuickBookingPopover({
  date,
  time,
  open,
  onOpenChange,
  children,
  defaultLocationId,
}: QuickBookingPopoverProps) {
  const queryClient = useQueryClient();
  const { user, roles } = useAuth();
  const [step, setStep] = useState<Step>('service');
  const [showNewClientDialog, setShowNewClientDialog] = useState(false);
  
  // Form state
  const [selectedClient, setSelectedClient] = useState<PhorestClient | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedStylist, setSelectedStylist] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(defaultLocationId || '');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [serviceSearch, setServiceSearch] = useState('');

  // Sync location when popover opens with a new default
  useEffect(() => {
    if (open && defaultLocationId) {
      setSelectedLocation(defaultLocationId);
    }
  }, [open, defaultLocationId]);

  const { data: locations = [] } = useLocations();
  const { data: servicesByCategory, services = [], isLoading: isLoadingServices } = useAllServicesByCategory();
  const { colorMap: categoryColors } = useServiceCategoryColorsMap();

  // Get selected service details (for totals calculation)
  const selectedServiceDetails = useMemo(() => {
    return services.filter(s => selectedServices.includes(s.phorest_service_id));
  }, [services, selectedServices]);

  const canViewAllClients = roles.some(r => ['admin', 'manager', 'super_admin', 'receptionist'].includes(r));

  // Fetch clients
  const { data: clients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ['phorest-clients-booking', clientSearch, user?.id, canViewAllClients],
    queryFn: async () => {
      let query = supabase
        .from('phorest_clients')
        .select('id, phorest_client_id, name, email, phone, preferred_stylist_id')
        .order('name')
        .limit(50);
      
      if (!canViewAllClients && user?.id) {
        query = query.eq('preferred_stylist_id', user.id);
      }
      
      if (clientSearch) {
        query = query.or(`name.ilike.%${clientSearch}%,phone.ilike.%${clientSearch}%,email.ilike.%${clientSearch}%`);
      }
      
      const { data } = await query;
      return data as PhorestClient[];
    },
    enabled: !!user?.id && open,
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
    enabled: open,
  });

  // totalDuration and totalPrice use selectedServiceDetails defined above

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
      toast.success('Appointment booked successfully');
      handleClose();
    },
    onError: (error: Error) => {
      toast.error('Failed to create booking', { description: error.message });
    },
  });

  const handleClose = () => {
    setStep('service');
    setSelectedClient(null);
    setClientSearch('');
    setSelectedServices([]);
    setSelectedStylist('');
    setSelectedLocation('');
    setSelectedCategory(null);
    setServiceSearch('');
    onOpenChange(false);
  };

  const handleSelectClient = (client: PhorestClient) => {
    setSelectedClient(client);
    setStep('stylist');
  };

  const handleServicesComplete = () => {
    setStep('location');
  };

  const handleBack = () => {
    switch (step) {
      case 'location':
        setStep('service');
        break;
      case 'client':
        setStep('location');
        break;
      case 'stylist':
        setStep('client');
        break;
      case 'confirm':
        setStep('stylist');
        break;
    }
  };

  const formatTime12h = (t: string) => {
    const [hours, minutes] = t.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const formatPhone = (phone: string | null): string | null => {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `${digits.slice(0, 3)}${digits.slice(3, 6)}${digits.slice(6)}`;
    }
    if (digits.length === 11 && digits[0] === '1') {
      return `${digits.slice(1, 4)}${digits.slice(4, 7)}${digits.slice(7)}`;
    }
    return phone;
  };

  const currentStepIndex = STEPS.indexOf(step);
  const canBook = selectedClient && selectedServices.length > 0 && selectedStylist && selectedLocation;

  const getStylistName = () => {
    const stylist = stylists.find(s => s.user_id === selectedStylist);
    return stylist?.employee_profiles?.display_name || stylist?.employee_profiles?.full_name || '';
  };

  return (
    <>
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          {children}
        </PopoverTrigger>
        <PopoverContent 
          side="right" 
          align="start" 
          className="w-[380px] p-0 shadow-xl border-border rounded-xl overflow-hidden"
          sideOffset={8}
        >
          {/* Header */}
          <div className="bg-card border-b border-border">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                {step !== 'service' ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={handleBack}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                ) : (
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <CalendarPlus className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <h2 className="font-semibold text-sm">New Booking</h2>
                  <p className="text-xs text-muted-foreground">
                    {format(date, 'EEE, MMM d')} at {formatTime12h(time)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-muted"
                onClick={handleClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Progress bar */}
            <div className="flex px-4 pb-3 gap-1">
              {STEPS.map((s, i) => (
                <div
                  key={s}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-colors',
                    i <= currentStepIndex ? 'bg-primary' : 'bg-muted'
                  )}
                />
              ))}
            </div>
          </div>

          {/* Step 1: Client Selection */}
          {step === 'client' && (
            <div className="flex flex-col" style={{ height: '400px' }}>
              {/* Search bar */}
              <div className="p-3 border-b border-border">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search clients..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="pl-9 h-9 bg-muted/50 border-0 focus-visible:ring-1"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => setShowNewClientDialog(true)}
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Client list */}
              <ScrollArea className="flex-1">
                <div className="p-2">
                  {isLoadingClients ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : clients.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground text-sm">
                        {clientSearch ? 'No clients found' : 'Start typing to search'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      {clients.map((client) => (
                        <button
                          key={client.id}
                          className={cn(
                            'w-full flex items-center gap-3 p-2.5 rounded-lg text-left',
                            'hover:bg-muted/70 active:bg-muted transition-colors'
                          )}
                          onClick={() => handleSelectClient(client)}
                        >
                          <Avatar className="h-9 w-9 bg-muted">
                            <AvatarFallback className="text-xs font-medium text-muted-foreground bg-muted">
                              {getInitials(client.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{client.name}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {formatPhone(client.phone) || client.email || 'No contact info'}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Step 1: Service Selection (Category → Services) */}
          {step === 'service' && (
            <div className="flex flex-col" style={{ height: '400px' }}>
              {/* Sticky Back to Categories Header */}
              {selectedCategory && (
                <div className="sticky top-0 z-10 bg-popover border-b border-border px-3 py-2">
                  <button
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setSelectedCategory(null)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Back to categories</span>
                  </button>
                </div>
              )}
              
              {/* Category or Services View */}
              <ScrollArea className="flex-1">
                <div className="p-3">
                  {isLoadingServices ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : !selectedCategory ? (
                    // Category selection view
                    <>
                      {/* Search bar */}
                      <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search for a service"
                          value={serviceSearch}
                          onChange={(e) => setServiceSearch(e.target.value)}
                          className="pl-9 h-9 bg-muted/50 border border-border"
                        />
                      </div>
                      
                      {serviceSearch ? (
                        // Show filtered services across all categories
                        <div className="space-y-1">
                          {services
                            .filter(s => s.name.toLowerCase().includes(serviceSearch.toLowerCase()))
                            .slice(0, 15)
                            .map((service) => {
                              const isSelected = selectedServices.includes(service.phorest_service_id);
                              return (
                                <button
                                  key={service.id}
                                  className={cn(
                                    'w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all',
                                    isSelected
                                      ? 'bg-primary/10 ring-1 ring-primary/30'
                                      : 'hover:bg-muted/70'
                                  )}
                                  onClick={() => {
                                    setSelectedServices(prev =>
                                      prev.includes(service.phorest_service_id)
                                        ? prev.filter(id => id !== service.phorest_service_id)
                                        : [...prev, service.phorest_service_id]
                                    );
                                  }}
                                >
                                  <div className="flex-1 min-w-0 mr-2">
                                    <div className="font-medium text-sm truncate">{service.name}</div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        {service.duration_minutes}m
                                      </span>
                                      {service.price !== null && (
                                        <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                                          <DollarSign className="h-3 w-3" />
                                          {service.price.toFixed(0)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div
                                    className={cn(
                                      'w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                                      isSelected
                                        ? 'bg-primary border-primary text-primary-foreground'
                                        : 'border-muted-foreground/30'
                                    )}
                                  >
                                    {isSelected && <Check className="h-2.5 w-2.5" />}
                                  </div>
                                </button>
                              );
                            })}
                          {services.filter(s => s.name.toLowerCase().includes(serviceSearch.toLowerCase())).length === 0 && (
                            <div className="text-center py-4 text-muted-foreground text-sm">
                              No services match "{serviceSearch}"
                            </div>
                          )}
                        </div>
                      ) : servicesByCategory && Object.keys(servicesByCategory).length > 0 ? (
                        // Category list
                        <div className="space-y-1">
                          {sortCategories(Object.keys(servicesByCategory)).map((category) => {
                            const catColor = getCategoryColor(category, categoryColors);
                            const isConsultation = category.toLowerCase().includes('consult');
                            const selectedCount = (servicesByCategory[category] || []).filter(
                              s => selectedServices.includes(s.phorest_service_id)
                            ).length;
                            return (
                              <button
                                key={category}
                                className={cn(
                                  "w-full flex items-center gap-3 text-left transition-all -mx-3 w-[calc(100%+1.5rem)] px-4",
                                  isConsultation 
                                    ? "group relative overflow-hidden py-3.5 bg-gradient-to-r from-[hsl(38,25%,91%)] via-[hsl(38,22%,94%)] to-[hsl(38,25%,91%)] border-y border-[hsl(38,30%,82%)] hover:from-[hsl(38,28%,89%)] hover:to-[hsl(38,28%,89%)] mb-1"
                                    : "py-3 hover:bg-muted/60"
                                )}
                                onClick={() => setSelectedCategory(category)}
                              >
                                <div 
                                  className={cn(
                                    'w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium shrink-0',
                                    isConsultation && 'shadow-sm ring-2 ring-[hsl(38,28%,85%)]'
                                  )}
                                  style={{
                                    backgroundColor: catColor.bg,
                                    color: catColor.text,
                                  }}
                                >
                                  {catColor.abbr}
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className={cn(
                                    "text-sm truncate",
                                    isConsultation ? "font-medium text-[hsl(38,15%,25%)]" : "font-medium"
                                  )}>{category}</span>
                                  {isConsultation && (
                                    <span className="text-[10px] text-[hsl(38,15%,50%)] tracking-wide uppercase">
                                      Required for new guests
                                    </span>
                                  )}
                                </div>
                                {selectedCount > 0 && (
                                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-medium">
                                    {selectedCount} selected
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-6 space-y-2">
                          <Scissors className="h-8 w-8 mx-auto text-muted-foreground/50" />
                          <p className="text-muted-foreground text-sm">No services synced yet</p>
                          <p className="text-xs text-muted-foreground/70">
                            Services will appear after syncing from Phorest
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    // Services within selected category
                    <>

                      <div className="bg-muted -mx-3 px-3 py-1.5 mb-2">
                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          {selectedCategory}
                        </h4>
                      </div>

                      <div className="space-y-1">
                        {servicesByCategory?.[selectedCategory]?.map((service) => {
                          const isSelected = selectedServices.includes(service.phorest_service_id);
                          return (
                            <button
                              key={service.id}
                              className={cn(
                                'w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all',
                                isSelected
                                  ? 'bg-primary/10 ring-1 ring-primary/30'
                                  : 'hover:bg-muted/70'
                              )}
                              onClick={() => {
                                setSelectedServices(prev =>
                                  prev.includes(service.phorest_service_id)
                                    ? prev.filter(id => id !== service.phorest_service_id)
                                    : [...prev, service.phorest_service_id]
                                );
                              }}
                            >
                              <div className="flex-1 min-w-0 mr-2">
                                <div className="font-medium text-sm truncate">{service.name}</div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {service.duration_minutes}m
                                  </span>
                                  {service.price !== null && (
                                    <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                                      <DollarSign className="h-3 w-3" />
                                      {service.price.toFixed(0)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div
                                className={cn(
                                  'w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                                  isSelected
                                    ? 'bg-primary border-primary text-primary-foreground'
                                    : 'border-muted-foreground/30'
                                )}
                              >
                                {isSelected && <Check className="h-2.5 w-2.5" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>

              {/* Footer */}
              <div className="p-3 border-t border-border bg-card space-y-2">
                {selectedServices.length > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="rounded-full text-[10px] px-2 py-0">
                        {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''}
                      </Badge>
                      <span className="text-muted-foreground">{totalDuration}m</span>
                    </div>
                    <span className="font-semibold">${totalPrice.toFixed(0)}</span>
                  </div>
                )}
                <Button
                  className="w-full h-9"
                  onClick={() => setStep('location')}
                >
                  {selectedServices.length === 0 ? 'Skip Services' : 'Continue'}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Location Selection */}
          {step === 'location' && (
            <div className="flex flex-col" style={{ height: '400px' }}>
              <ScrollArea className="flex-1">
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Select Location</span>
                  </div>
                  
                  <div className="space-y-1">
                    {locations.map((loc) => {
                      const isSelected = selectedLocation === loc.id;
                      return (
                        <button
                          key={loc.id}
                          className={cn(
                            'w-full flex items-center justify-between p-3 rounded-lg text-left transition-all',
                            isSelected
                              ? 'bg-primary/10 ring-1 ring-primary/30'
                              : 'hover:bg-muted/70'
                          )}
                          onClick={() => setSelectedLocation(loc.id)}
                        >
                          <div className="flex-1 min-w-0 mr-2">
                            <div className="font-medium text-sm">{loc.name}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {loc.city}
                            </div>
                          </div>
                          <div
                            className={cn(
                              'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                              isSelected
                                ? 'bg-primary border-primary text-primary-foreground'
                                : 'border-muted-foreground/30'
                            )}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </ScrollArea>

              {/* Footer */}
              <div className="p-3 border-t border-border bg-card space-y-2">
                {selectedServices.length > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="rounded-full text-[10px] px-2 py-0">
                        {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''}
                      </Badge>
                      <span className="text-muted-foreground">{totalDuration}m</span>
                    </div>
                    <span className="font-semibold">${totalPrice.toFixed(0)}</span>
                  </div>
                )}
                <Button
                  className="w-full h-9"
                  disabled={!selectedLocation}
                  onClick={() => setStep('client')}
                >
                  Confirm location
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Stylist Selection */}
          {step === 'stylist' && (
            <div className="flex flex-col" style={{ height: '400px' }}>
              <ScrollArea className="flex-1">
                <div className="p-3">
                  <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Choose Stylist
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {stylists.map((stylist) => {
                      const name = stylist.employee_profiles?.display_name || stylist.employee_profiles?.full_name || 'Unknown';
                      const isSelected = selectedStylist === stylist.user_id;
                      return (
                        <button
                          key={stylist.user_id}
                          className={cn(
                            'flex flex-col items-center p-2.5 rounded-lg transition-all',
                            isSelected
                              ? 'bg-primary/10 ring-1 ring-primary/30'
                              : 'hover:bg-muted/70'
                          )}
                          onClick={() => setSelectedStylist(stylist.user_id)}
                        >
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={stylist.employee_profiles?.photo_url || undefined} />
                              <AvatarFallback className="bg-muted text-xs">
                                {name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {isSelected && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                <Check className="h-2.5 w-2.5 text-primary-foreground" />
                              </div>
                            )}
                          </div>
                          <span className="text-[11px] font-medium mt-1.5 text-center line-clamp-1">
                            {name.split(' ')[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </ScrollArea>

              {/* Footer */}
              <div className="p-3 border-t border-border bg-card">
                <Button
                  className="w-full h-9"
                  disabled={!selectedStylist}
                  onClick={() => setStep('confirm')}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 'confirm' && (
            <div className="flex flex-col" style={{ height: '400px' }}>
              <ScrollArea className="flex-1">
                <div className="p-3 space-y-3">
                  {/* Client */}
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                          {selectedClient?.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-sm">{selectedClient?.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {selectedClient?.phone || selectedClient?.email}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="bg-card border border-border rounded-lg divide-y divide-border">
                    <div className="flex items-center gap-2.5 p-2.5">
                      <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground">Location</div>
                        <div className="font-medium text-xs">{locations.find(l => l.id === selectedLocation)?.name}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 p-2.5">
                      <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center">
                        <CalendarPlus className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground">Date & Time</div>
                        <div className="font-medium text-xs">{format(date, 'EEE, MMM d')} at {formatTime12h(time)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 p-2.5">
                      <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground">Duration</div>
                        <div className="font-medium text-xs">{totalDuration} minutes</div>
                      </div>
                    </div>
                  </div>

                  {/* Services */}
                  <div>
                    <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                      Services
                    </h4>
                    <div className="bg-card border border-border rounded-lg divide-y divide-border">
                      {selectedServiceDetails.map((service) => (
                        <div key={service.id} className="flex items-center justify-between p-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                              <Scissors className="h-3 w-3 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium text-xs">{service.name}</div>
                              <div className="text-[10px] text-muted-foreground">{service.duration_minutes}m</div>
                            </div>
                          </div>
                          {service.price !== null && (
                            <span className="font-semibold text-xs">${service.price.toFixed(0)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stylist */}
                  <div>
                    <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                      Stylist
                    </h4>
                    <div className="bg-card border border-border rounded-lg p-2.5">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={stylists.find(s => s.user_id === selectedStylist)?.employee_profiles?.photo_url || undefined} />
                          <AvatarFallback className="bg-muted text-xs">
                            {getStylistName().slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{getStylistName()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              {/* Footer */}
              <div className="p-3 border-t border-border bg-card space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="text-lg font-bold">${totalPrice.toFixed(2)}</span>
                </div>
                <Button
                  className="w-full h-10 font-semibold"
                  disabled={!canBook || createBooking.isPending}
                  onClick={() => createBooking.mutate()}
                >
                  {createBooking.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    'Confirm Booking'
                  )}
                </Button>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>

      <NewClientDialog
        open={showNewClientDialog}
        onOpenChange={setShowNewClientDialog}
        onClientCreated={(client) => {
          handleSelectClient({
            id: client.id,
            phorest_client_id: client.phorest_client_id,
            name: client.name,
            email: client.email,
            phone: client.phone,
          });
          setShowNewClientDialog(false);
        }}
      />
    </>
  );
}
