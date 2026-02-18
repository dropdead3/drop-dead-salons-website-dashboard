import { MapPin, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

interface Location {
  id: string;
  name: string;
}

interface LocationMultiSelectProps {
  locations: Location[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function LocationMultiSelect({
  locations,
  selectedIds,
  onSelectionChange,
}: LocationMultiSelectProps) {
  const allSelected = selectedIds.length === 0 || selectedIds.length === locations.length;
  const effectiveSelected = allSelected ? locations.map(l => l.id) : selectedIds;

  const handleToggle = (id: string) => {
    const current = new Set(effectiveSelected);
    if (current.has(id)) {
      current.delete(id);
      // Cannot have zero selections → re-select all
      if (current.size === 0) {
        onSelectionChange([]);
        return;
      }
    } else {
      current.add(id);
    }
    // If all are now selected, emit empty (= "all")
    if (current.size === locations.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(Array.from(current));
    }
  };

  const handleSelectAll = () => {
    if (allSelected) {
      // Deselect all → but can't have zero, so do nothing (already all)
      // Instead, keep first location only as a "deselect all" gesture
      onSelectionChange([locations[0]?.id].filter(Boolean));
    } else {
      onSelectionChange([]);
    }
  };

  // Label for trigger
  let label: string;
  if (allSelected) {
    label = 'All Locations';
  } else if (effectiveSelected.length === 1) {
    const loc = locations.find(l => l.id === effectiveSelected[0]);
    label = loc?.name ?? '1 Location';
  } else {
    label = `${effectiveSelected.length} of ${locations.length} Locations`;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="h-9 w-auto min-w-[180px] justify-between text-sm border-border font-normal"
        >
          <span className="flex items-center gap-2 truncate">
            <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="truncate">{label}</span>
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="start">
        <div className="p-2 border-b border-border">
          <label className="flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-md hover:bg-accent text-sm font-medium">
            <Checkbox
              checked={allSelected}
              onCheckedChange={handleSelectAll}
            />
            Select All
          </label>
        </div>
        <div className="max-h-[240px] overflow-y-auto p-2 space-y-0.5">
          {locations.map(loc => (
            <label
              key={loc.id}
              className="flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-md hover:bg-accent text-sm"
            >
              <Checkbox
                checked={effectiveSelected.includes(loc.id)}
                onCheckedChange={() => handleToggle(loc.id)}
              />
              {loc.name}
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
