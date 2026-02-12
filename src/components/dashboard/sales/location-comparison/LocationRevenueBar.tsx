import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { BlurredAmount } from '@/contexts/HideNumbersContext';

interface LocationRevenueBarProps {
  locations: { name: string; totalRevenue: number }[];
  totalRevenue: number;
  colors: string[];
}

export function LocationRevenueBar({ locations, totalRevenue, colors }: LocationRevenueBarProps) {
  if (totalRevenue <= 0) return null;

  return (
    <TooltipProvider delayDuration={100}>
      <div className="h-2.5 rounded-full overflow-hidden flex bg-muted/50">
        {locations.map((loc, i) => {
          const pct = (loc.totalRevenue / totalRevenue) * 100;
          if (pct < 0.5) return null;
          return (
            <Tooltip key={loc.name}>
              <TooltipTrigger asChild>
                <div
                  className="h-full transition-all hover:opacity-80"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: colors[i % colors.length],
                  }}
                />
              </TooltipTrigger>
              <TooltipContent className="rounded-lg">
                <span className="font-medium">{loc.name}</span>
                <span className="text-muted-foreground ml-2">
                  <BlurredAmount>${loc.totalRevenue.toLocaleString()}</BlurredAmount> ({Math.round(pct)}%)
                </span>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
