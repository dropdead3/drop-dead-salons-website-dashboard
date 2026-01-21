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
      <div className={`flex items-center gap-1.5 text-sm text-destructive ${className}`}>
        <Clock className="h-4 w-4" />
        <span>Expired</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 text-sm text-amber-600 ${className}`}>
      <Clock className="h-4 w-4" />
      <span>Expires in {timeRemaining}</span>
    </div>
  );
}
