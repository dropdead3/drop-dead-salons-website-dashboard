import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Bell, DollarSign, Pin, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface BellEntry {
  id: string;
  service_booked: string;
  ticket_value: number;
  lead_source: string;
  closing_script: string | null;
  is_pinned: boolean;
  created_at: string;
  user_id: string;
}

const leadSources = [
  { value: 'content', label: 'Content (Organic)' },
  { value: 'ads', label: 'Paid Ads' },
  { value: 'referral', label: 'Referral' },
  { value: 'google', label: 'Google Search' },
  { value: 'walkin', label: 'Walk-in' },
  { value: 'other', label: 'Other' },
];

export default function RingTheBell() {
  const { user, isCoach } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<BellEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [service, setService] = useState('');
  const [ticketValue, setTicketValue] = useState('');
  const [leadSource, setLeadSource] = useState('');
  const [closingScript, setClosingScript] = useState('');

  useEffect(() => {
    fetchEntries();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('ring_the_bell')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ring_the_bell_entries' },
        (payload) => {
          setEntries(prev => [payload.new as BellEntry, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchEntries = async () => {
    const { data, error } = await supabase
      .from('ring_the_bell_entries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching entries:', error);
    } else {
      setEntries((data || []) as BellEntry[]);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);

    // First get the enrollment ID
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('stylist_program_enrollment')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (enrollmentError || !enrollment) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be enrolled in the program to ring the bell.',
      });
      setSubmitting(false);
      return;
    }

    const { error } = await supabase
      .from('ring_the_bell_entries')
      .insert({
        enrollment_id: enrollment.id,
        user_id: user.id,
        service_booked: service,
        ticket_value: parseFloat(ticketValue),
        lead_source: leadSource as 'content' | 'ads' | 'referral' | 'google' | 'walkin' | 'other',
        closing_script: closingScript || null,
      });

    if (error) {
      console.error('Error creating entry:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to submit. Please try again.',
      });
    } else {
      toast({
        title: '🔔 Bell Rung!',
        description: `$${ticketValue} booking logged. Keep crushing it!`,
      });
      setShowForm(false);
      setService('');
      setTicketValue('');
      setLeadSource('');
      setClosingScript('');
    }

    setSubmitting(false);
  };

  const togglePin = async (entryId: string, currentlyPinned: boolean) => {
    if (!isCoach) return;

    const { error } = await supabase
      .from('ring_the_bell_entries')
      .update({ is_pinned: !currentlyPinned })
      .eq('id', entryId);

    if (!error) {
      setEntries(prev => 
        prev.map(e => e.id === entryId ? { ...e, is_pinned: !currentlyPinned } : e)
      );
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl lg:text-4xl mb-2">
              RING THE BELL
            </h1>
            <p className="text-muted-foreground font-sans">
              Celebrate high-ticket wins with the team.
            </p>
          </div>
          <Button 
            onClick={() => setShowForm(!showForm)}
            className="font-display tracking-wide"
          >
            <Bell className="w-4 h-4 mr-2" />
            {showForm ? 'CANCEL' : 'RING IT'}
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <Card className="p-6 mb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider">Service Booked</Label>
                  <Input
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    placeholder="e.g., Full Extensions Install"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider">Ticket Value</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={ticketValue}
                      onChange={(e) => setTicketValue(e.target.value)}
                      placeholder="0.00"
                      className="pl-9"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider">Lead Source</Label>
                <Select value={leadSource} onValueChange={setLeadSource} required>
                  <SelectTrigger>
                    <SelectValue placeholder="How did they find you?" />
                  </SelectTrigger>
                  <SelectContent>
                    {leadSources.map((source) => (
                      <SelectItem key={source.value} value={source.value}>
                        {source.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider">
                  What Closed the Deal? (Optional)
                </Label>
                <Textarea
                  value={closingScript}
                  onChange={(e) => setClosingScript(e.target.value)}
                  placeholder="Share the script, phrase, or action that sealed it..."
                  rows={3}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full font-display tracking-wide"
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Bell className="w-4 h-4 mr-2" />
                    RING THE BELL
                  </>
                )}
              </Button>
            </form>
          </Card>
        )}

        {/* Feed */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : entries.length === 0 ? (
          <Card className="p-12 text-center">
            <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground font-sans">
              No bells rung yet. Be the first to celebrate a win!
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Pinned entries first */}
            {entries
              .sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0))
              .map((entry) => (
                <Card 
                  key={entry.id} 
                  className={`p-6 ${entry.is_pinned ? 'border-foreground' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-display text-xl">
                          ${entry.ticket_value.toLocaleString()}
                        </span>
                        {entry.is_pinned && (
                          <span className="px-2 py-0.5 bg-foreground text-background text-xs font-display tracking-wide">
                            PINNED
                          </span>
                        )}
                      </div>
                      <p className="font-sans text-sm mb-1">{entry.service_booked}</p>
                      <p className="text-xs text-muted-foreground font-sans">
                        {leadSources.find(s => s.value === entry.lead_source)?.label} · {' '}
                        {format(new Date(entry.created_at), 'MMM d, yyyy')}
                      </p>
                      {entry.closing_script && (
                        <p className="mt-3 text-sm text-muted-foreground font-sans italic">
                          "{entry.closing_script}"
                        </p>
                      )}
                    </div>
                    {isCoach && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => togglePin(entry.id, entry.is_pinned)}
                        className={entry.is_pinned ? 'text-foreground' : 'text-muted-foreground'}
                      >
                        <Pin className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
