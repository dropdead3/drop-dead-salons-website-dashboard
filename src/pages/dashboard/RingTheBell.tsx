import { useState, useEffect, useCallback } from 'react';
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
import { useBellSound } from '@/hooks/use-bell-sound';
import { Bell, DollarSign, Pin, Loader2, MessageSquare, Send, X, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import confetti from 'canvas-confetti';

interface BellEntry {
  id: string;
  service_booked: string;
  ticket_value: number;
  lead_source: string;
  closing_script: string | null;
  coach_note: string | null;
  is_pinned: boolean;
  created_at: string;
  user_id: string;
  stylist_name?: string;
}

const leadSources = [
  { value: 'salon_lead', label: 'Salon Lead Passed to Me' },
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
  const { playBellSound } = useBellSound();
  const [entries, setEntries] = useState<BellEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [service, setService] = useState('');
  const [ticketValue, setTicketValue] = useState('');
  const [leadSource, setLeadSource] = useState('');
  const [closingScript, setClosingScript] = useState('');

  // Coach note state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    fetchEntries();
    
    // Subscribe to realtime updates with notifications
    const channel = supabase
      .channel('ring_the_bell')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ring_the_bell_entries' },
        async (payload) => {
          const newEntry = payload.new as any;
          
          // Only show notification if it's from another user
          if (newEntry.user_id !== user?.id) {
            // Fetch the stylist name for the notification
            const { data: profile } = await supabase
              .from('employee_profiles')
              .select('display_name, full_name')
              .eq('user_id', newEntry.user_id)
              .maybeSingle();
            
            const stylistName = profile?.display_name || profile?.full_name || 'A stylist';
            
            // Trigger confetti and sound for team celebration
            playBellSound();
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#FFD700', '#FFA500', '#FF6347', '#FF69B4', '#00CED1'],
            });
            
            toast({
              title: '🔔 BELL RUNG!',
              description: `${stylistName} just booked $${newEntry.ticket_value.toLocaleString()} for ${newEntry.service_booked}!`,
              duration: 6000,
            });
          }
          
          // Refresh the list
          fetchEntries();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'ring_the_bell_entries' },
        () => {
          fetchEntries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const fetchEntries = async () => {
    const { data, error } = await supabase
      .from('ring_the_bell_entries')
      .select(`
        *,
        employee_profiles!ring_the_bell_entries_user_id_fkey(display_name, full_name)
      `)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching entries:', error);
      // Fallback without join
      const { data: fallbackData } = await supabase
        .from('ring_the_bell_entries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      setEntries((fallbackData || []) as BellEntry[]);
    } else {
      const formattedEntries = (data || []).map((entry: any) => ({
        ...entry,
        stylist_name: entry.employee_profiles?.display_name || entry.employee_profiles?.full_name || 'Stylist',
      }));
      setEntries(formattedEntries as BellEntry[]);
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
      // Play bell sound and celebrate with confetti burst
      playBellSound();
      const duration = 2000;
      const end = Date.now() + duration;
      
      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#FFD700', '#FFA500', '#FF6347'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#FFD700', '#FFA500', '#FF6347'],
        });
        
        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
      
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
          .sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0))
      );
      toast({
        title: currentlyPinned ? 'Unpinned' : '📌 Pinned!',
        description: currentlyPinned ? 'Entry unpinned.' : 'Entry pinned to the top.',
      });
    }
  };

  const startEditingNote = (entry: BellEntry) => {
    setEditingNoteId(entry.id);
    setNoteText(entry.coach_note || '');
  };

  const cancelEditingNote = () => {
    setEditingNoteId(null);
    setNoteText('');
  };

  const saveCoachNote = async (entryId: string) => {
    if (!isCoach) return;
    
    setSavingNote(true);
    const { error } = await supabase
      .from('ring_the_bell_entries')
      .update({ coach_note: noteText || null })
      .eq('id', entryId);

    if (!error) {
      setEntries(prev => 
        prev.map(e => e.id === entryId ? { ...e, coach_note: noteText || null } : e)
      );
      toast({
        title: '✨ Note Saved',
        description: 'Your celebratory note has been added!',
      });
      setEditingNoteId(null);
      setNoteText('');
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save note.',
      });
    }
    setSavingNote(false);
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

        {/* Info Notice */}
        <Alert className="mb-6 bg-accent/50 border-accent">
          <Sparkles className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm font-sans">
            <span className="font-medium">Ring the Bell</span> is for celebrating high-ticket bookings with your team! 
            Ring it when you book a service <span className="font-semibold">$500 or more</span> — whether it's extensions, 
            color transformations, or any premium service. Share what closed the deal to inspire others! 🎉
          </AlertDescription>
        </Alert>

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
            {entries.map((entry) => (
              <Card 
                key={entry.id} 
                className={`p-6 ${entry.is_pinned ? 'border-primary bg-primary/5' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-display text-xl">
                        ${entry.ticket_value.toLocaleString()}
                      </span>
                      {entry.is_pinned && (
                        <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs font-display tracking-wide rounded">
                          PINNED
                        </span>
                      )}
                    </div>
                    <p className="font-sans text-sm mb-1">{entry.service_booked}</p>
                    <p className="text-xs text-muted-foreground font-sans">
                      {entry.stylist_name && <span className="font-medium">{entry.stylist_name} · </span>}
                      {leadSources.find(s => s.value === entry.lead_source)?.label} · {' '}
                      {format(new Date(entry.created_at), 'MMM d, yyyy')}
                    </p>
                    {entry.closing_script && (
                      <p className="mt-3 text-sm text-muted-foreground font-sans italic">
                        "{entry.closing_script}"
                      </p>
                    )}

                    {/* Coach Note Display */}
                    {entry.coach_note && editingNoteId !== entry.id && (
                      <div className="mt-4 p-3 bg-accent/50 rounded-lg border border-accent">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" /> Coach Note
                        </p>
                        <p className="text-sm font-sans">{entry.coach_note}</p>
                      </div>
                    )}

                    {/* Coach Note Editor */}
                    {isCoach && editingNoteId === entry.id && (
                      <div className="mt-4 space-y-2">
                        <Textarea
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Add a celebratory note for this win..."
                          rows={2}
                          className="text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => saveCoachNote(entry.id)}
                            disabled={savingNote}
                            className="font-display text-xs"
                          >
                            {savingNote ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                <Send className="w-3 h-3 mr-1" />
                                Save Note
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEditingNote}
                            className="font-display text-xs"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Coach Actions */}
                  {isCoach && (
                    <div className="flex flex-col gap-1 ml-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => togglePin(entry.id, entry.is_pinned)}
                        className={entry.is_pinned ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}
                        title={entry.is_pinned ? 'Unpin' : 'Pin to top'}
                      >
                        <Pin className="w-4 h-4" />
                      </Button>
                      {editingNoteId !== entry.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEditingNote(entry)}
                          className="text-muted-foreground hover:text-foreground"
                          title="Add/edit note"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
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