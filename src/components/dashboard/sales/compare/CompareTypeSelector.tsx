import { Calendar, MapPin, Tag, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CompareMode } from '@/hooks/useComparisonData';

interface CompareTypeSelectorProps {
  value: CompareMode;
  onChange: (mode: CompareMode) => void;
}

const modes: { value: CompareMode; label: string; icon: React.ElementType; description: string }[] = [
  { value: 'time', label: 'Time Periods', icon: Calendar, description: 'Compare different date ranges' },
  { value: 'location', label: 'Locations', icon: MapPin, description: 'Compare salon locations' },
  { value: 'category', label: 'Categories', icon: Tag, description: 'Compare service/product categories' },
  { value: 'yoy', label: 'Year over Year', icon: TrendingUp, description: 'Compare to same period last year' },
];

export function CompareTypeSelector({ value, onChange }: CompareTypeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = value === mode.value;
        
        return (
          <button
            key={mode.value}
            onClick={() => onChange(mode.value)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg border transition-all',
              'text-sm font-medium',
              isActive
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card hover:bg-muted border-border text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="w-4 h-4" />
            <span>{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
}
