import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface MetricInfoTooltipProps {
  description: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export function MetricInfoTooltip({ description, side = 'top' }: MetricInfoTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="w-3 h-3 text-muted-foreground/60 cursor-help hover:text-muted-foreground transition-colors shrink-0" />
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-[220px] text-xs">
        <p>{description}</p>
      </TooltipContent>
    </Tooltip>
  );
}
