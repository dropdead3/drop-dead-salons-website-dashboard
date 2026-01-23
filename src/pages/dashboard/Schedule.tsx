import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ScheduleHeader } from '@/components/dashboard/schedule/ScheduleHeader';
import { ScheduleActionBar } from '@/components/dashboard/schedule/ScheduleActionBar';
import { DayView } from '@/components/dashboard/schedule/DayView';
import { WeekView } from '@/components/dashboard/schedule/WeekView';
import { MonthView } from '@/components/dashboard/schedule/MonthView';
import { AgendaView } from '@/components/dashboard/schedule/AgendaView';
import { AppointmentDetailSheet } from '@/components/dashboard/schedule/AppointmentDetailSheet';
import { BookingWizard } from '@/components/dashboard/schedule/booking';
import { usePhorestCalendar, type PhorestAppointment, type CalendarView } from '@/hooks/usePhorestCalendar';
import { useCalendarPreferences } from '@/hooks/useCalendarPreferences';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEffectiveUserId } from '@/hooks/useEffectiveUser';
import { useActiveLocations } from '@/hooks/useLocations';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Schedule() {
  const isMobile = useIsMobile();
  const { preferences } = useCalendarPreferences();
  const effectiveUserId = useEffectiveUserId();
  const { roles } = useAuth();
  const { data: locations = [] } = useActiveLocations();
  
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
  const [bookingDefaults, setBookingDefaults] = useState<{ date?: Date; stylistId?: string; time?: string }>({});

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

  // Filter appointments by location first, then by selected staff
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
    
    return filtered;
  }, [allAppointments, selectedLocation, selectedStaffIds]);

  // Get the phorest_branch_id for the selected location
  const selectedBranchId = useMemo(() => {
    const loc = locations.find(l => l.id === selectedLocation);
    return loc?.phorest_branch_id || null;
  }, [locations, selectedLocation]);

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
        .eq('is_active', true);
      
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

  const handleNewBooking = () => {
    setBookingDefaults({});
    setBookingOpen(true);
  };

  const handleStatusChange = (status: any) => {
    if (selectedAppointment) {
      updateStatus({ appointmentId: selectedAppointment.id, status });
    }
  };

  // Action bar handlers
  const handleCheckIn = () => handleStatusChange('checked_in');
  const handleConfirm = () => handleStatusChange('confirmed');
  const handlePay = () => handleStatusChange('completed');
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
                  appointments={appointments}
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
                  appointments={appointments}
                  hoursStart={preferences.hours_start}
                  hoursEnd={preferences.hours_end}
                  onAppointmentClick={handleAppointmentClick}
                  onSlotClick={handleSlotClick}
                />
              )}
              
              {view === 'month' && (
                <MonthView
                  currentDate={currentDate}
                  appointments={appointments}
                  onDayClick={handleDayClick}
                  onAppointmentClick={handleAppointmentClick}
                />
              )}
              
              {view === 'agenda' && (
                <AgendaView
                  currentDate={currentDate}
                  appointments={appointments}
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
