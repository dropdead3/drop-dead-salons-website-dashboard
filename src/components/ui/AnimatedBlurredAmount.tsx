import { useState, useEffect, useRef, ReactNode } from 'react';
import { useHideNumbers } from '@/contexts/HideNumbersContext';
import { cn } from '@/lib/utils';

interface AnimatedBlurredAmountProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
  className?: string;
  children?: ReactNode;
}

export function AnimatedBlurredAmount({
  value,
  prefix = '',
  suffix = '',
  duration = 1200,
  decimals = 0,
  className = '',
}: AnimatedBlurredAmountProps) {
  const { hideNumbers } = useHideNumbers();
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const previousValue = useRef(0);
  const elementRef = useRef<HTMLSpanElement>(null);
  const animationRef = useRef<number>();

  // Trigger animation when element comes into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          animateValue(0, value);
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      observer.disconnect();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value]);

  // Animate when value changes after initial animation
  useEffect(() => {
    if (hasAnimated && value !== previousValue.current) {
      animateValue(previousValue.current, value);
      previousValue.current = value;
    }
  }, [value, hasAnimated]);

  const animateValue = (from: number, to: number) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const startTime = performance.now();
    const difference = to - from;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Smooth ease-out curve with a nice deceleration
      const easeOut = 1 - Math.pow(1 - progress, 4);
      
      const currentValue = from + (difference * easeOut);
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(to);
        previousValue.current = to;
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const formattedValue = decimals > 0
    ? displayValue.toFixed(decimals)
    : Math.round(displayValue).toLocaleString();

  return (
    <span
      ref={elementRef}
      className={cn(
        className,
        hideNumbers && 'blur-md select-none transition-all duration-200'
      )}
      title={hideNumbers ? 'Click the eye icon in the header to reveal' : undefined}
    >
      {prefix}{formattedValue}{suffix}
    </span>
  );
}
