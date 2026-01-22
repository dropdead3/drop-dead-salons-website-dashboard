import { useMemo, useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useStylistPhorestAppointments } from '@/hooks/usePhorestSync';
import { format, parse, isAfter } from 'date-fns';

interface NextClientIndicatorProps {
  userId?: string;
}

export function NextClientIndicator({ userId }: NextClientIndicatorProps) {
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
        setTimeRemaining('now');
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
    return null;
  }
  
  if (!nextAppointment) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="w-3.5 h-3.5" />
        <span>No upcoming clients today</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>
        Your next client is <span className="font-medium text-foreground">{nextAppointment.client_name || 'Unknown'}</span>
      </span>
      <span className="flex items-center gap-1 text-primary font-medium">
        <Clock className="w-3.5 h-3.5" />
        {timeRemaining}
      </span>
    </div>
  );
}
