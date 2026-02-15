import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface MetricInfoTooltipProps {
  description: string;
  title?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function MetricInfoTooltip({ description, title, side = 'top', className }: MetricInfoTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className={cn("w-3 h-3 text-muted-foreground/60 cursor-help hover:text-muted-foreground transition-colors shrink-0", className)} />
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-[280px] text-xs">
        {title && <p className="font-medium mb-1">{title}</p>}
        <p>{description}</p>
      </TooltipContent>
    </Tooltip>
  );
}
