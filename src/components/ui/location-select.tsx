import { MapPin } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLocations } from '@/hooks/useLocations';

interface LocationSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  includeAll?: boolean;
  allLabel?: string;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
}

export function LocationSelect({
  value,
  onValueChange,
  includeAll = true,
  allLabel = 'All Locations',
  placeholder = 'Select location',
  className,
  triggerClassName,
}: LocationSelectProps) {
  const { data: locations = [] } = useLocations();

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={triggerClassName}>
        <MapPin className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={className}>
        {includeAll && (
          <SelectItem value="all">{allLabel}</SelectItem>
        )}
        {locations.map(loc => (
          <SelectItem key={loc.id} value={loc.id}>
            {loc.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
