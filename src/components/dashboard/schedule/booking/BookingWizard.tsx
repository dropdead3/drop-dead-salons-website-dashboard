import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useServicesByCategory } from '@/hooks/usePhorestServices';
import { useLocations } from '@/hooks/useLocations';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

import { BookingHeader } from './BookingHeader';
import { ClientStep } from './ClientStep';
import { ServiceStep } from './ServiceStep';
import { StylistStep } from './StylistStep';
import { ConfirmStep } from './ConfirmStep';
import { NewClientDialog } from '../NewClientDialog';

export interface PhorestClient {
  id: string;
  phorest_client_id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export type BookingStep = 'service' | 'client' | 'stylist' | 'confirm';

interface BookingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: Date;
  defaultTime?: string;
  defaultStylistId?: string;
}

export function BookingWizard({
  open,
  onOpenChange,
  defaultDate = new Date(),
  defaultTime = '09:00',
  defaultStylistId,
}: BookingWizardProps) {
  const queryClient = useQueryClient();
  const { user, roles } = useAuth();

  // Step state
  const [step, setStep] = useState<BookingStep>('service');
  const [showNewClientDialog, setShowNewClientDialog] = useState(false);

  // Form state
  const [selectedClient, setSelectedClient] = useState<PhorestClient | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedStylist, setSelectedStylist] = useState(defaultStylistId || '');
  const [selectedDate, setSelectedDate] = useState<Date>(defaultDate);
  const [selectedTime, setSelectedTime] = useState(defaultTime);
  const [notes, setNotes] = useState('');

  // Data fetching
  const { data: locations = [] } = useLocations();
  const { data: servicesByCategory, services = [], isLoading: isLoadingServices } = useServicesByCategory(selectedLocation || undefined);

  const canViewAllClients = roles.some(r => ['admin', 'manager', 'super_admin', 'receptionist'].includes(r));

  // Fetch clients
  const { data: clients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ['booking-clients', clientSearch, user?.id, canViewAllClients],
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
    enabled: !!user?.id,
  });

  // Fetch stylists
  const { data: stylists = [] } = useQuery({
    queryKey: ['booking-stylists', selectedLocation],
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

      const startDateTime = `${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}:00Z`;

      const response = await supabase.functions.invoke('create-phorest-booking', {
        body: {
          branch_id: selectedLocation,
          client_id: selectedClient.phorest_client_id,
          staff_id: stylistMapping.phorest_staff_id,
          service_ids: selectedServices,
          start_time: startDateTime,
          notes: notes || undefined,
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
    setSelectedLocation('');
    setSelectedServices([]);
    setSelectedStylist(defaultStylistId || '');
    setSelectedDate(defaultDate);
    setSelectedTime(defaultTime);
    setNotes('');
    onOpenChange(false);
  };

  const handleServicesComplete = () => {
    setStep('client');
  };

  const handleSelectClient = (client: PhorestClient) => {
    setSelectedClient(client);
    setStep('stylist');
  };

  const handleStylistComplete = () => {
    setStep('confirm');
  };

  const handleBack = () => {
    switch (step) {
      case 'client':
        setStep('service');
        break;
      case 'stylist':
        setStep('client');
        break;
      case 'confirm':
        setStep('stylist');
        break;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'client':
        return 'Select Client';
      case 'service':
        return 'Choose Services';
      case 'stylist':
        return 'Pick Stylist & Time';
      case 'confirm':
        return 'Confirm Booking';
    }
  };

  const getStylistName = () => {
    const stylist = stylists.find(s => s.user_id === selectedStylist);
    return stylist?.employee_profiles?.display_name || stylist?.employee_profiles?.full_name || '';
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent 
          side="right" 
          className="w-full sm:max-w-md p-0 flex flex-col gap-0 [&>button]:hidden"
        >
          <BookingHeader
            step={step}
            title={getStepTitle()}
            subtitle={
              step !== 'service' && selectedServices.length > 0
                ? `${selectedServices.length} service${selectedServices.length > 1 ? 's' : ''} selected`
                : format(selectedDate, 'EEEE, MMM d') + ' at ' + formatTime12h(selectedTime)
            }
            onClose={handleClose}
            onBack={step !== 'service' ? handleBack : undefined}
          />

          <div className="flex-1 overflow-hidden">
            {step === 'client' && (
              <ClientStep
                clients={clients}
                isLoading={isLoadingClients}
                searchQuery={clientSearch}
                onSearchChange={setClientSearch}
                onSelectClient={handleSelectClient}
                onNewClient={() => setShowNewClientDialog(true)}
              />
            )}

            {step === 'service' && (
              <ServiceStep
                locations={locations}
                selectedLocation={selectedLocation}
                onLocationChange={setSelectedLocation}
                servicesByCategory={servicesByCategory}
                selectedServices={selectedServices}
                onToggleService={(serviceId) => {
                  setSelectedServices(prev =>
                    prev.includes(serviceId)
                      ? prev.filter(id => id !== serviceId)
                      : [...prev, serviceId]
                  );
                }}
                totalDuration={totalDuration}
                totalPrice={totalPrice}
                onContinue={handleServicesComplete}
                canContinue={!!selectedLocation}
                isLoadingServices={isLoadingServices}
              />
            )}

            {step === 'stylist' && (
              <StylistStep
                stylists={stylists}
                selectedStylist={selectedStylist}
                onStylistChange={setSelectedStylist}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                selectedTime={selectedTime}
                onTimeChange={setSelectedTime}
                onContinue={handleStylistComplete}
                canContinue={!!selectedStylist && !!selectedTime}
              />
            )}

            {step === 'confirm' && (
              <ConfirmStep
                client={selectedClient}
                services={selectedServiceDetails}
                stylistName={getStylistName()}
                date={selectedDate}
                time={selectedTime}
                totalDuration={totalDuration}
                totalPrice={totalPrice}
                notes={notes}
                onNotesChange={setNotes}
                onConfirm={() => createBooking.mutate()}
                isLoading={createBooking.isPending}
                locationName={locations.find(l => l.id === selectedLocation)?.name || ''}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <NewClientDialog
        open={showNewClientDialog}
        onOpenChange={setShowNewClientDialog}
        onClientCreated={(client) => {
          const newClient: PhorestClient = {
            id: client.id,
            phorest_client_id: client.phorest_client_id,
            name: client.name,
            email: client.email,
            phone: client.phone,
          };
          setSelectedClient(newClient);
          setShowNewClientDialog(false);
          setStep('service');
        }}
      />
    </>
  );
}

function formatTime12h(time: string) {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}
