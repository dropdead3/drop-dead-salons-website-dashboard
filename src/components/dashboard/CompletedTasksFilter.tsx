import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface CompletedFilters {
  search: string;
  priority: 'all' | 'low' | 'normal' | 'high';
}

interface CompletedTasksFilterProps {
  filters: CompletedFilters;
  onChange: (filters: CompletedFilters) => void;
}

export function CompletedTasksFilter({ filters, onChange }: CompletedTasksFilterProps) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Search completed..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="h-8 pl-8 text-xs rounded-full"
        />
      </div>
      <Select
        value={filters.priority}
        onValueChange={(v) => onChange({ ...filters, priority: v as CompletedFilters['priority'] })}
      >
        <SelectTrigger className="h-8 w-[100px] text-xs">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="normal">Normal</SelectItem>
          <SelectItem value="high">High</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
