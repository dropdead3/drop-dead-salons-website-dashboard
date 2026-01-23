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
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Schedule() {
  const isMobile = useIsMobile();
  const { preferences } = useCalendarPreferences();
  const effectiveUserId = useEffectiveUserId();
  
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
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [showAllStaff, setShowAllStaff] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingDefaults, setBookingDefaults] = useState<{ date?: Date; stylistId?: string; time?: string }>({});

  // Filter appointments based on showAllStaff toggle
  const appointments = useMemo(() => {
    if (showAllStaff) {
      return allAppointments;
    }
    // When toggle is off, only show current user's appointments
    return allAppointments.filter(apt => apt.stylist_user_id === effectiveUserId);
  }, [allAppointments, showAllStaff, effectiveUserId]);

  // Fetch stylists for DayView
  const { data: stylists = [] } = useQuery({
    queryKey: ['schedule-stylists-with-mapping'],
    queryFn: async () => {
      const { data } = await supabase
        .from('phorest_staff_mapping')
        .select(`
          user_id,
          employee_profiles!phorest_staff_mapping_user_id_fkey(
            user_id,
            display_name,
            full_name,
            photo_url
          )
        `)
        .eq('is_active', true);
      
      return (data || []).map(d => ({
        user_id: d.user_id,
        display_name: d.employee_profiles?.display_name || null,
        full_name: d.employee_profiles?.full_name || 'Unknown',
        photo_url: d.employee_profiles?.photo_url || null,
      }));
    },
  });

  // Filter stylists based on selection
  const displayedStylists = selectedStaff === 'all' 
    ? stylists 
    : stylists.filter(s => s.user_id === selectedStaff);

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
            selectedStaff={selectedStaff}
            onStaffChange={setSelectedStaff}
            stylists={stylists}
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
            showAllStaff={showAllStaff}
            onShowAllStaffChange={setShowAllStaff}
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
