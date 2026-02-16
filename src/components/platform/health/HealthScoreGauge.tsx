import * as React from 'react';
import { cn } from '@/lib/utils';

interface HealthScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function HealthScoreGauge({ 
  score, 
  size = 'md', 
  showLabel = true,
  className 
}: HealthScoreGaugeProps) {
  const normalizedScore = Math.min(Math.max(score, 0), 100);
  
  const sizeConfig = {
    sm: { width: 80, height: 80, strokeWidth: 6, fontSize: 'text-lg' },
    md: { width: 120, height: 120, strokeWidth: 8, fontSize: 'text-2xl' },
    lg: { width: 160, height: 160, strokeWidth: 10, fontSize: 'text-3xl' },
  };
  
  const { width, height, strokeWidth, fontSize } = sizeConfig[size];
  const radius = (width - strokeWidth) / 2;
  const circumference = radius * Math.PI * 2;
  const offset = circumference - (normalizedScore / 100) * circumference;
  
  const getColor = () => {
    if (normalizedScore >= 70) return 'text-emerald-500';
    if (normalizedScore >= 50) return 'text-amber-500';
    return 'text-red-500';
  };
  
  const getStrokeColor = () => {
    if (normalizedScore >= 70) return '#10b981';
    if (normalizedScore >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const getRiskLabel = () => {
    if (normalizedScore >= 70) return 'Healthy';
    if (normalizedScore >= 50) return 'At Risk';
    return 'Critical';
  };

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative" style={{ width, height }}>
        <svg
          className="transform -rotate-90"
          width={width}
          height={height}
        >
          {/* Background circle */}
          <circle
            cx={width / 2}
            cy={height / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-slate-700/30"
          />
          {/* Progress circle */}
          <circle
            cx={width / 2}
            cy={height / 2}
            r={radius}
            stroke={getStrokeColor()}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-medium', fontSize, getColor())}>
            {Math.round(normalizedScore)}
          </span>
        </div>
      </div>
      {showLabel && (
        <div className="mt-2 text-center">
          <span className={cn('text-sm font-medium', getColor())}>
            {getRiskLabel()}
          </span>
        </div>
      )}
    </div>
  );
}
