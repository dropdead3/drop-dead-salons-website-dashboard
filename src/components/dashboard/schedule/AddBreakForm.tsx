import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, Clock, Loader2, Coffee } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { useEffectiveRoles } from '@/hooks/useEffectiveUser';
import { useCreateBreakRequest, type BreakType, BREAK_TYPE_LABELS } from '@/hooks/useTimeOffRequests';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AddBreakFormProps {
  date: Date;
  time: string;
  onBack: () => void;
  onComplete: () => void;
  defaultStylistId?: string;
}

const BREAK_TYPES: BreakType[] = ['break', 'personal', 'sick', 'vacation', 'other'];

interface DurationPreset {
  label: string;
  minutes: number;
}

const DURATION_PRESETS: DurationPreset[] = [
  { label: '30 min', minutes: 30 },
  { label: '1 hour', minutes: 60 },
  { label: '2 hours', minutes: 120 },
  { label: 'Half Day', minutes: 240 },
  { label: 'Full Day', minutes: 0 }, // special: is_full_day
];

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const totalMinutes = h * 60 + m + minutes;
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

export function AddBreakForm({ date, time, onBack, onComplete, defaultStylistId }: AddBreakFormProps) {
  const { user } = useAuth();
  const { effectiveOrganization } = useOrganizationContext();
  const roles = useEffectiveRoles();
  const createBreak = useCreateBreakRequest();

  const isAdmin = roles.some(r => ['admin', 'manager', 'super_admin'].includes(r));

  const [breakType, setBreakType] = useState<BreakType>('break');
  const [selectedDuration, setSelectedDuration] = useState<number>(60); // minutes, 0 = full day
  const [notes, setNotes] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(defaultStylistId || user?.id || '');

  // Fetch team members for admin dropdown
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members-break', effectiveOrganization?.id],
    queryFn: async () => {
      if (!effectiveOrganization?.id) return [];
      const { data, error } = await supabase
        .from('employee_profiles')
        .select('user_id, display_name, full_name, photo_url')
        .eq('organization_id', effectiveOrganization.id)
        .eq('is_active', true)
        .eq('is_approved', true)
        .order('display_name');
      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin && !!effectiveOrganization?.id,
  });

  const isFullDay = selectedDuration === 0;
  const startTime = time.length === 5 ? time : time.substring(0, 5);
  const endTime = isFullDay ? '' : addMinutesToTime(startTime, selectedDuration);

  const handleSubmit = () => {
    if (!effectiveOrganization?.id || !selectedUserId) return;

    const dateStr = format(date, 'yyyy-MM-dd');

    createBreak.mutate({
      user_id: selectedUserId,
      organization_id: effectiveOrganization.id,
      start_date: dateStr,
      end_date: dateStr,
      start_time: isFullDay ? undefined : `${startTime}:00`,
      end_time: isFullDay ? undefined : `${endTime}:00`,
      is_full_day: isFullDay,
      reason: breakType,
      notes: notes || undefined,
      blocks_online_booking: true,
    }, {
      onSuccess: () => onComplete(),
    });
  };

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Coffee className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Add Break</span>
      </div>

      {/* Date & Time summary */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
        <Clock className="h-3.5 w-3.5" />
        <span>{format(date, 'EEE, MMM d')} · {startTime}{!isFullDay && ` – ${endTime}`}{isFullDay && ' (Full Day)'}</span>
      </div>

      {/* Break Type Pills */}
      <div className="flex flex-wrap gap-1.5">
        {BREAK_TYPES.map(type => (
          <Badge
            key={type}
            variant={breakType === type ? 'default' : 'outline'}
            className={cn(
              'cursor-pointer text-xs px-2.5 py-1 transition-colors',
              breakType === type
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent'
            )}
            onClick={() => setBreakType(type)}
          >
            {BREAK_TYPE_LABELS[type]}
          </Badge>
        ))}
      </div>

      {/* Duration Presets */}
      <div>
        <span className="text-xs text-muted-foreground mb-1.5 block">Duration</span>
        <div className="flex flex-wrap gap-1.5">
          {DURATION_PRESETS.map(preset => (
            <Badge
              key={preset.label}
              variant={selectedDuration === preset.minutes ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer text-xs px-2.5 py-1 transition-colors',
                selectedDuration === preset.minutes
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              )}
              onClick={() => setSelectedDuration(preset.minutes)}
            >
              {preset.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Staff selector (admin only) */}
      {isAdmin && teamMembers.length > 0 && (
        <div>
          <span className="text-xs text-muted-foreground mb-1.5 block">For</span>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Select team member" />
            </SelectTrigger>
            <SelectContent>
              {teamMembers.map(member => (
                <SelectItem key={member.user_id} value={member.user_id}>
                  {member.display_name || member.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Notes */}
      <Textarea
        placeholder="Notes (optional)"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        className="min-h-[60px] text-sm resize-none"
      />

      {/* Submit */}
      <Button
        className="w-full h-9"
        onClick={handleSubmit}
        disabled={createBreak.isPending || !selectedUserId}
      >
        {createBreak.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Schedule Break
      </Button>
    </div>
  );
}
