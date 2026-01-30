import * as React from 'react';
import { AlertTriangle, CheckCircle, Circle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface StripeStatusIndicatorProps {
  activeCount: number;
  totalCount: number;
  hasIssues: boolean;
  className?: string;
}

export function StripeStatusIndicator({
  activeCount,
  totalCount,
  hasIssues,
  className,
}: StripeStatusIndicatorProps) {
  // No locations at all
  if (totalCount === 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('flex items-center gap-1.5', className)}>
              <Circle className="h-3 w-3 text-slate-500" />
              <span className="text-sm text-slate-500">—</span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-800 border-slate-700">
            <p className="text-xs">No locations configured</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Has issues - show warning
  if (hasIssues) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('flex items-center gap-1.5', className)}>
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-sm text-amber-400">Issues</span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-800 border-slate-700">
            <p className="text-xs">One or more locations have payment issues</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // No Stripe connected
  if (activeCount === 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('flex items-center gap-1.5', className)}>
              <Circle className="h-3 w-3 text-slate-500 fill-slate-500/20" />
              <span className="text-sm text-slate-500">Not Set</span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-800 border-slate-700">
            <p className="text-xs">No payment processing configured</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // All locations active
  if (activeCount === totalCount) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('flex items-center gap-1.5', className)}>
              <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-sm text-emerald-400">{activeCount}/{totalCount}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-800 border-slate-700">
            <p className="text-xs">All locations processing payments</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Partial - some active
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('flex items-center gap-1.5', className)}>
            <div className="relative">
              <Circle className="h-3.5 w-3.5 text-emerald-400" />
              <div 
                className="absolute inset-0 rounded-full bg-emerald-400" 
                style={{ 
                  clipPath: `polygon(0 0, 100% 0, 100% ${(activeCount / totalCount) * 100}%, 0 ${(activeCount / totalCount) * 100}%)` 
                }}
              />
            </div>
            <span className="text-sm text-slate-300">{activeCount}/{totalCount}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-slate-800 border-slate-700">
          <p className="text-xs">{activeCount} of {totalCount} locations processing payments</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
