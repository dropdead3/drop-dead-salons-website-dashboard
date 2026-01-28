import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ScheduleHeader } from '@/components/dashboard/schedule/ScheduleHeader';
import { ScheduleActionBar } from '@/components/dashboard/schedule/ScheduleActionBar';
import { DayView } from '@/components/dashboard/schedule/DayView';
import { WeekView } from '@/components/dashboard/schedule/WeekView';
import { MonthView } from '@/components/dashboard/schedule/MonthView';
import { AgendaView } from '@/components/dashboard/schedule/AgendaView';
import { AppointmentDetailSheet } from '@/components/dashboard/schedule/AppointmentDetailSheet';
import { CheckoutSummarySheet } from '@/components/dashboard/schedule/CheckoutSummarySheet';
import { BookingWizard } from '@/components/dashboard/schedule/booking';
import { usePhorestCalendar, type PhorestAppointment, type CalendarView } from '@/hooks/usePhorestCalendar';
import { useCalendarPreferences } from '@/hooks/useCalendarPreferences';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEffectiveUserId } from '@/hooks/useEffectiveUser';
import { useActiveLocations } from '@/hooks/useLocations';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { CalendarFilterState } from '@/components/dashboard/schedule/CalendarFiltersPopover';
import { generateMockAppointments, isDemoAppointment } from '@/data/mockAppointments';

export default function Schedule() {
  const isMobile = useIsMobile();
  const { preferences } = useCalendarPreferences();
  const effectiveUserId = useEffectiveUserId();
  const { roles } = useAuth();
  const { data: locations = [] } = useActiveLocations();
  const { data: businessSettings } = useBusinessSettings();
  
  // Check if user is stylist or stylist_assistant (they get full calendar view access)
  const isStylistRole = roles.includes('stylist') || roles.includes('stylist_assistant');
  
  const {
    currentDate,
    setCurrentDate,
    view,
    setView,
    filters,
    setFilters,
    appointments: allAppointments,
    isLoading,
    lastSync,
    canCreate,
    triggerSync,
    updateStatus,
    isUpdating,
  } = usePhorestCalendar();

  // State for selections and sheets
  const [selectedAppointment, setSelectedAppointment] = useState<PhorestAppointment | null>(null);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [bookingDefaults, setBookingDefaults] = useState<{ date?: Date; stylistId?: string; time?: string }>({});
  const [calendarFilters, setCalendarFilters] = useState<CalendarFilterState>({
    clientTypes: [],
    confirmationStatus: [],
    leadSources: [],
  });
  const [demoMode, setDemoMode] = useState(false);

  // Set default location when locations load
  useEffect(() => {
    if (locations.length > 0 && !selectedLocation) {
      setSelectedLocation(locations[0].id);
    }
  }, [locations, selectedLocation]);

  // Handle multi-select staff change
  const handleStaffToggle = (staffId: string) => {
    if (staffId === 'all') {
      setSelectedStaffIds([]);
    } else {
      setSelectedStaffIds(prev => 
        prev.includes(staffId) 
          ? prev.filter(id => id !== staffId)
          : [...prev, staffId]
      );
    }
  };

  // Filter appointments by location, staff, and calendar filters
  const appointments = useMemo(() => {
    let filtered = allAppointments;
    
    // Filter by location
    if (selectedLocation) {
      filtered = filtered.filter(apt => apt.location_id === selectedLocation);
    }
    
    // Filter by selected staff (if any are selected)
    if (selectedStaffIds.length > 0) {
      filtered = filtered.filter(apt => 
        apt.stylist_user_id && selectedStaffIds.includes(apt.stylist_user_id)
      );
    }

    // Filter by client type (new/returning)
    if (calendarFilters.clientTypes.length > 0) {
      filtered = filtered.filter(apt => {
        const isNew = apt.is_new_client;
        if (calendarFilters.clientTypes.includes('new') && isNew) return true;
        if (calendarFilters.clientTypes.includes('returning') && !isNew) return true;
        return false;
      });
    }

    // Filter by confirmation status
    if (calendarFilters.confirmationStatus.length > 0) {
      filtered = filtered.filter(apt => {
        const isConfirmed = apt.status === 'confirmed' || apt.status === 'checked_in' || apt.status === 'completed';
        if (calendarFilters.confirmationStatus.includes('confirmed') && isConfirmed) return true;
        if (calendarFilters.confirmationStatus.includes('unconfirmed') && !isConfirmed) return true;
        return false;
      });
    }

    // Note: Lead source filtering requires client data which would need a join query
    // For now, the infrastructure is in place; actual filtering will work once
    // appointment sync populates phorest_client_id and client lead_source is set
    
    return filtered;
  }, [allAppointments, selectedLocation, selectedStaffIds, calendarFilters]);

  // Calculate today's appointment count for the selected location
  const todayAppointmentCount = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return allAppointments.filter(apt => 
      apt.appointment_date === today && 
      apt.location_id === selectedLocation &&
      !['cancelled', 'no_show'].includes(apt.status)
    ).length;
  }, [allAppointments, selectedLocation]);

  // Get the phorest_branch_id and effective tax rate for the selected location
  const selectedLocationData = useMemo(() => {
    return locations.find(l => l.id === selectedLocation);
  }, [locations, selectedLocation]);

  const selectedBranchId = selectedLocationData?.phorest_branch_id || null;

  // Calculate effective tax rate for the selected location
  const effectiveTaxRate = useMemo(() => {
    return selectedLocationData?.tax_rate ?? businessSettings?.default_tax_rate ?? 0.08;
  }, [selectedLocationData, businessSettings]);

  // Fetch stylists for DayView - filter by selected location's branch
  const { data: allStylists = [] } = useQuery({
    queryKey: ['schedule-stylists-with-mapping', selectedBranchId],
    queryFn: async () => {
      let query = supabase
        .from('phorest_staff_mapping')
        .select(`
          user_id,
          phorest_branch_id,
          employee_profiles!phorest_staff_mapping_user_id_fkey(
            user_id,
            display_name,
            full_name,
            photo_url
          )
        `)
        .eq('is_active', true)
        .eq('show_on_calendar', true);
      
      // Filter by branch if selected
      if (selectedBranchId) {
        query = query.eq('phorest_branch_id', selectedBranchId);
      }
      
      const { data } = await query;
      
      // Deduplicate by user_id (staff may be mapped to multiple locations)
      const uniqueStylists = new Map<string, { user_id: string; display_name: string | null; full_name: string; photo_url: string | null }>();
      
      (data || []).forEach((d: any) => {
        if (!uniqueStylists.has(d.user_id)) {
          uniqueStylists.set(d.user_id, {
            user_id: d.user_id,
            display_name: d.employee_profiles?.display_name || null,
            full_name: d.employee_profiles?.full_name || 'Unknown',
            photo_url: d.employee_profiles?.photo_url || null,
          });
        }
      });
      
      return Array.from(uniqueStylists.values());
    },
  });

  // Filter stylists based on staff selection (for day view columns)
  const displayedStylists = selectedStaffIds.length === 0
    ? allStylists 
    : allStylists.filter(s => selectedStaffIds.includes(s.user_id));

  // Generate mock appointments when demo mode is enabled
  const mockAppointments = useMemo(() => {
    if (!demoMode) return [];
    return generateMockAppointments({
      date: currentDate,
      stylistIds: allStylists.map(s => s.user_id),
      locationId: selectedLocation,
    });
  }, [demoMode, currentDate, allStylists, selectedLocation]);

  // Combine real and mock appointments for display
  const displayAppointments = useMemo(() => {
    return [...appointments, ...mockAppointments];
  }, [appointments, mockAppointments]);

  // Handle demo mode toggle
  const handleDemoModeToggle = () => {
    const newMode = !demoMode;
    setDemoMode(newMode);
    if (newMode) {
      toast.success('Demo mode enabled - showing sample appointments');
    } else {
      toast.info('Demo mode disabled');
    }
  };
  // Auto-switch to agenda view on mobile
  useEffect(() => {
    if (isMobile && view !== 'agenda') {
      setView('agenda');
    }
  }, [isMobile]);

  const handleAppointmentClick = (apt: PhorestAppointment) => {
    setSelectedAppointment(apt);
    // Don't auto-open detail sheet - just select it
  };

  const handleSlotClick = (dateOrStylistId: Date | string, time: string) => {
    if (typeof dateOrStylistId === 'string') {
      // From DayView - stylistId
      setBookingDefaults({ date: currentDate, stylistId: dateOrStylistId, time });
    } else {
      // From WeekView - date
      setBookingDefaults({ date: dateOrStylistId, time });
    }
    setBookingOpen(true);
  };

  const handleDayClick = (date: Date) => {
    setCurrentDate(date);
    setView('day');
  };

  // Handler for double-clicking a day in week view
  const handleDayDoubleClick = (date: Date) => {
    setCurrentDate(date);
    setView('day');
  };

  const handleNewBooking = () => {
    setBookingDefaults({});
    setBookingOpen(true);
  };

  const handleStatusChange = (status: any, options?: { rebooked_at_checkout?: boolean }) => {
    if (selectedAppointment) {
      updateStatus({ appointmentId: selectedAppointment.id, status, ...options });
    }
  };

  // Action bar handlers
  const handleCheckIn = () => handleStatusChange('checked_in');
  const handleConfirm = () => handleStatusChange('confirmed');
  const handlePay = () => {
    if (selectedAppointment) {
      setCheckoutOpen(true);
    }
  };
  const handleCheckoutConfirm = (tipAmount: number, rebooked: boolean) => {
    // Tip amount is logged for future reporting
    console.log('Checkout completed with tip:', tipAmount, 'rebooked:', rebooked);
    handleStatusChange('completed', { rebooked_at_checkout: rebooked });
    setCheckoutOpen(false);
    setSelectedAppointment(null);
  };
  const handleRemove = () => {
    if (selectedAppointment) {
      // For now, cancel the appointment
      handleStatusChange('cancelled');
      toast.success('Appointment cancelled');
    }
  };
  const handleNotes = () => {
    if (selectedAppointment) {
      setDetailOpen(true);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="px-4 pt-4">
          <ScheduleHeader
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            view={view}
            setView={setView}
            selectedStaffIds={selectedStaffIds}
            onStaffToggle={handleStaffToggle}
            stylists={allStylists}
            selectedLocation={selectedLocation}
            onLocationChange={setSelectedLocation}
            locations={locations}
            onNewBooking={handleNewBooking}
            canCreate={canCreate}
            calendarFilters={calendarFilters}
            onCalendarFiltersChange={setCalendarFilters}
            demoMode={demoMode}
            onDemoModeToggle={handleDemoModeToggle}
          />
        </div>

        {/* Calendar View */}
        <div className="flex-1 p-4 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {view === 'day' && (
                <DayView
                  date={currentDate}
                  appointments={displayAppointments}
                  stylists={displayedStylists}
                  hoursStart={preferences.hours_start}
                  hoursEnd={preferences.hours_end}
                  onAppointmentClick={handleAppointmentClick}
                  onSlotClick={handleSlotClick}
                  selectedAppointmentId={selectedAppointment?.id}
                />
              )}
              
              {view === 'week' && (
                <WeekView
                  currentDate={currentDate}
                  appointments={displayAppointments}
                  hoursStart={preferences.hours_start}
                  hoursEnd={preferences.hours_end}
                  onAppointmentClick={handleAppointmentClick}
                  onSlotClick={handleSlotClick}
                  selectedLocationId={selectedLocation}
                  onDayDoubleClick={handleDayDoubleClick}
                />
              )}
              
              {view === 'month' && (
                <MonthView
                  currentDate={currentDate}
                  appointments={displayAppointments}
                  onDayClick={handleDayClick}
                  onAppointmentClick={handleAppointmentClick}
                />
              )}
              
              {view === 'agenda' && (
                <AgendaView
                  currentDate={currentDate}
                  appointments={displayAppointments}
                  onAppointmentClick={handleAppointmentClick}
                />
              )}
            </>
          )}
        </div>

        {/* Action Bar */}
        {(view === 'day' || view === 'week') && (
          <ScheduleActionBar
            selectedAppointment={selectedAppointment}
            onCheckIn={handleCheckIn}
            onPay={handlePay}
            onRemove={handleRemove}
            onNotes={handleNotes}
            onConfirm={handleConfirm}
            isUpdating={isUpdating}
            todayAppointmentCount={todayAppointmentCount}
          />
        )}
      </div>

      <AppointmentDetailSheet
        appointment={selectedAppointment}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onStatusChange={(_, status) => handleStatusChange(status)}
        isUpdating={isUpdating}
      />

      <CheckoutSummarySheet
        appointment={selectedAppointment}
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        onConfirm={handleCheckoutConfirm}
        isUpdating={isUpdating}
        taxRate={effectiveTaxRate}
        businessSettings={businessSettings || null}
        locationName={selectedLocationData?.name || ''}
        locationAddress={selectedLocationData?.address}
        locationPhone={selectedLocationData?.phone}
      />

      <BookingWizard
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        defaultDate={bookingDefaults.date}
        defaultStylistId={bookingDefaults.stylistId}
        defaultTime={bookingDefaults.time}
      />
    </DashboardLayout>
  );
}
