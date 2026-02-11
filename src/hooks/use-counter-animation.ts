import { useState, useEffect, useRef } from 'react';

interface UseCounterAnimationProps {
  end: number;
  duration?: number;
  decimals?: number;
  startOnView?: boolean;
}

export function useCounterAnimation({
  end,
  duration = 2000,
  decimals = 0,
  startOnView = false
}: UseCounterAnimationProps) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(!startOnView);
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (startOnView) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !hasStarted) {
            setHasStarted(true);
          }
        },
        { threshold: 0.1 }
      );
      if (elementRef.current) observer.observe(elementRef.current);
      return () => observer.disconnect();
    }
  }, [startOnView, hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Damped spring: overshoot ~5%, oscillate, settle
      const settle = 1 - Math.exp(-6 * progress) * Math.cos(4 * Math.PI * progress);
      
      const currentCount = settle * end;
      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(animate);
  }, [hasStarted, end, duration]);

  const formattedCount = decimals > 0 
    ? count.toFixed(decimals) 
    : Math.floor(count).toLocaleString();

  return { count: formattedCount, ref: elementRef, hasStarted };
}
