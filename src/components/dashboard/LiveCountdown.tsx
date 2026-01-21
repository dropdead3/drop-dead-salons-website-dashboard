import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface LiveCountdownProps {
  expiresAt: Date;
  onExpire?: () => void;
  className?: string;
}

export function LiveCountdown({ expiresAt, onExpire, className = '' }: LiveCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        setIsExpired(true);
        setTimeRemaining('Expired');
        onExpire?.();
        return;
      }

      // Set urgent state when less than 1 hour remaining
      setIsUrgent(diff < 60 * 60 * 1000);

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

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  if (isExpired) {
    return (
      <div className={`flex items-center gap-2 text-sm text-destructive ${className}`}>
        <div className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center">
          <Clock className="h-3.5 w-3.5" />
        </div>
        <span className="font-medium">Expired</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 text-sm ${isUrgent ? 'text-destructive' : ''} ${className}`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
        isUrgent ? 'bg-destructive/10' : 'bg-oat/40'
      }`}>
        <Clock className={`h-3.5 w-3.5 ${isUrgent ? 'animate-pulse' : ''}`} />
      </div>
      <span>
        Expires in <span className="font-mono font-medium tabular-nums">{timeRemaining}</span>
      </span>
    </div>
  );
}
