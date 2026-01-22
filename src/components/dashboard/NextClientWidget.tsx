import { useMemo, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Clock, User, MapPin } from 'lucide-react';
import { useStylistPhorestAppointments } from '@/hooks/usePhorestSync';
import { format, parse, isAfter } from 'date-fns';

interface NextClientWidgetProps {
  userId?: string;
}

export function NextClientWidget({ userId }: NextClientWidgetProps) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: appointments, isLoading } = useStylistPhorestAppointments(userId, today);
  
  // Find the next upcoming appointment (start_time in the future)
  const nextAppointment = useMemo(() => {
    if (!appointments || appointments.length === 0) return null;
    
    const now = new Date();
    
    for (const apt of appointments) {
      // Parse the appointment datetime
      const aptDateTime = parse(
        `${apt.appointment_date} ${apt.start_time}`,
        'yyyy-MM-dd HH:mm:ss',
        new Date()
      );
      
      if (isAfter(aptDateTime, now)) {
        return { ...apt, dateTime: aptDateTime };
      }
    }
    
    return null;
  }, [appointments]);
  
  // Countdown timer state
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  
  useEffect(() => {
    if (!nextAppointment?.dateTime) {
      setTimeRemaining('');
      return;
    }
    
    const updateCountdown = () => {
      const now = new Date();
      const diff = nextAppointment.dateTime.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeRemaining('Starting now');
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, [nextAppointment?.dateTime]);
  
  if (isLoading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-primary/20 rounded w-1/3"></div>
          <div className="h-6 bg-primary/20 rounded w-2/3"></div>
        </div>
      </Card>
    );
  }
  
  if (!nextAppointment) {
    return null; // Don't show the widget if no upcoming appointments
  }
  
  const formattedTime = format(nextAppointment.dateTime, 'h:mm a');
  
  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-sans uppercase tracking-wide">
            Your next client is
          </p>
          <h3 className="text-xl font-display tracking-wide">
            {nextAppointment.client_name || 'Unknown Client'}
          </h3>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formattedTime}
            </span>
            {nextAppointment.service_name && (
              <span className="text-xs bg-muted px-2 py-0.5 rounded">
                {nextAppointment.service_name}
              </span>
            )}
          </div>
        </div>
        
        <div className="text-right">
          <div className="bg-primary/10 rounded-lg px-4 py-2">
            <p className="text-xs text-muted-foreground font-sans">Starts in</p>
            <p className="text-lg font-display tracking-wide text-primary">
              {timeRemaining}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
