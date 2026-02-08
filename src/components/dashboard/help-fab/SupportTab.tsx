import { useState } from 'react';
import { Send, Loader2, Plus, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSupportTickets } from '@/hooks/useSupportTickets';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

const priorityOptions: { value: TicketPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const statusColors: Record<string, string> = {
  open: 'bg-blue-500/10 text-blue-600 border-blue-200',
  in_progress: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
  resolved: 'bg-green-500/10 text-green-600 border-green-200',
  closed: 'bg-muted text-muted-foreground',
};

export function SupportTab() {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  
  const { tickets, isLoading, isSubmitting, submitTicket } = useSupportTickets();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const success = await submitTicket({
      title: title.trim(),
      description: description.trim(),
      priority,
    });

    if (success) {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setShowForm(false);
    }
  };

  const hasTickets = tickets && tickets.length > 0;

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 px-4">
        <div className="py-4">
          {showForm ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">New Support Ticket</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Subject</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief description of your issue"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide details about your issue..."
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as TicketPriority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Ticket
                  </>
                )}
              </Button>
            </form>
          ) : (
            <>
              <Button
                onClick={() => setShowForm(true)}
                className="w-full mb-4"
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Support Ticket
              </Button>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : hasTickets ? (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Recent Tickets</h4>
                  {tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{ticket.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn('text-xs shrink-0', statusColors[ticket.status])}
                        >
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No support tickets yet</p>
                  <p className="text-xs mt-1">Create one if you need help!</p>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
