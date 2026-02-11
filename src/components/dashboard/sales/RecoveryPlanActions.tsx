import { useState } from 'react';
import { Bookmark, Bell, Share2, Check, Copy, MessageSquare, Hash, Loader2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, addDays } from 'date-fns';
import { ShareToDMDialog } from './ShareToDMDialog';

interface RecoveryPlanActionsProps {
  title: string;
  content: string;
  goalPeriod: string;
  targetRevenue?: number;
  currentRevenue?: number;
  shortfall?: number;
}

export function RecoveryPlanActions({
  title,
  content,
  goalPeriod,
  targetRevenue,
  currentRevenue,
  shortfall,
}: RecoveryPlanActionsProps) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reminderSaving, setReminderSaving] = useState(false);
  const [reminderSet, setReminderSet] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const handleSavePlan = async () => {
    if (!user?.id || !content) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('saved_recovery_plans').insert({
        user_id: user.id,
        title,
        content,
        goal_period: goalPeriod,
        target_revenue: targetRevenue,
        current_revenue: currentRevenue,
        shortfall,
      });
      if (error) throw error;

      // Also convert key action items to tasks
      const actionItems = extractActionItems(content);
      if (actionItems.length > 0) {
        const tasks = actionItems.map((item) => ({
          user_id: user.id,
          title: item,
          description: `From recovery plan: ${title}`,
          source: 'ai_insights',
          priority: 'high',
        }));
        await supabase.from('tasks').insert(tasks);
      }

      setSaved(true);
      toast.success('Plan saved & action items added to your tasks');
    } catch (err) {
      console.error('Save plan error:', err);
      toast.error('Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  const handleSetReminder = async (date: Date) => {
    if (!user?.id || !content) return;
    setReminderSaving(true);
    setShowCalendar(false);
    try {
      const { error } = await supabase.from('saved_recovery_plans').insert({
        user_id: user.id,
        title,
        content,
        goal_period: goalPeriod,
        target_revenue: targetRevenue,
        current_revenue: currentRevenue,
        shortfall,
        reminder_date: date.toISOString(),
      });
      if (error) throw error;
      setReminderSet(true);
      toast.success(`Reminder set for ${format(date, 'MMM d, yyyy')}`);
    } catch (err) {
      console.error('Reminder error:', err);
      toast.error('Failed to set reminder');
    } finally {
      setReminderSaving(false);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${title}\n\n${content}`);
      toast.success('Plan copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="flex items-center gap-2 pt-3 border-t border-border/30">
      {/* Save Plan */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleSavePlan}
        disabled={saving || saved || !content}
        className="flex-1 gap-1.5 text-xs border-border/50"
      >
        {saving ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : saved ? (
          <Check className="w-3.5 h-3.5 text-chart-2" />
        ) : (
          <Bookmark className="w-3.5 h-3.5" />
        )}
        {saved ? 'Saved' : 'Save Plan'}
      </Button>

      {/* Remind Me */}
      <Popover open={showCalendar} onOpenChange={setShowCalendar}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={reminderSaving || reminderSet || !content}
            className="flex-1 gap-1.5 text-xs border-border/50"
          >
            {reminderSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : reminderSet ? (
              <Check className="w-3.5 h-3.5 text-chart-2" />
            ) : (
              <Bell className="w-3.5 h-3.5" />
            )}
            {reminderSet ? 'Reminder Set' : 'Remind Me'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <div className="p-2 space-y-1 border-b border-border/30">
            <p className="text-xs font-medium px-1">Quick reminders</p>
            <div className="flex gap-1">
              {[1, 3, 7].map((days) => (
                <Button
                  key={days}
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => handleSetReminder(addDays(new Date(), days))}
                >
                  {days === 1 ? 'Tomorrow' : `${days} days`}
                </Button>
              ))}
            </div>
          </div>
          <CalendarComponent
            mode="single"
            selected={undefined}
            onSelect={(date) => date && handleSetReminder(date)}
            disabled={(date) => date < new Date()}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* Share / Pitch */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={!content}
            className="flex-1 gap-1.5 text-xs border-border/50"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="text-xs">Share recovery plan</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShareOpen(true)} className="gap-2">
            <MessageSquare className="w-4 h-4" />
            <div>
              <p className="text-sm font-medium">Pitch to Leadership</p>
              <p className="text-[10px] text-muted-foreground">Send as a DM to team members</p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyToClipboard} className="gap-2">
            <Copy className="w-4 h-4" />
            <div>
              <p className="text-sm font-medium">Copy to Clipboard</p>
              <p className="text-[10px] text-muted-foreground">Paste anywhere you need</p>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Share to DM Dialog */}
      <ShareToDMDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        planTitle={title}
        planContent={content}
      />
    </div>
  );
}

/** Extract bold action items from markdown content */
function extractActionItems(content: string): string[] {
  const items: string[] = [];
  const boldPattern = /\*\*([^*]+?):\*\*/g;
  let match;
  while ((match = boldPattern.exec(content)) !== null) {
    const item = match[1].trim();
    if (item.length > 5 && item.length < 80) {
      items.push(item);
    }
  }
  return items.slice(0, 5); // Max 5 tasks
}
