import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS, type EventType } from '@/hooks/useTeamCalendar';

interface EventTypeFilterProps {
  selectedTypes: EventType[];
  onTypesChange: (types: EventType[]) => void;
}

const EVENT_TYPES: EventType[] = ['meeting', 'training', 'time_off', 'holiday', 'special', 'reminder'];

export function EventTypeFilter({ selectedTypes, onTypesChange }: EventTypeFilterProps) {
  const handleToggle = (type: EventType) => {
    if (selectedTypes.includes(type)) {
      onTypesChange(selectedTypes.filter(t => t !== type));
    } else {
      onTypesChange([...selectedTypes, type]);
    }
  };

  const handleClear = () => {
    onTypesChange([]);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Filter
          {selectedTypes.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {selectedTypes.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center justify-between">
          Event Types
          {selectedTypes.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClear} className="h-auto py-0 text-xs">
              Clear
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {EVENT_TYPES.map(type => (
          <DropdownMenuCheckboxItem
            key={type}
            checked={selectedTypes.includes(type)}
            onCheckedChange={() => handleToggle(type)}
          >
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: EVENT_TYPE_COLORS[type] }}
              />
              {EVENT_TYPE_LABELS[type]}
            </div>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
