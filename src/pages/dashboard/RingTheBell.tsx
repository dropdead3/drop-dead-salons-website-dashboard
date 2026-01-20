import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { BellEntryCard } from '@/components/dashboard/BellEntryCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useBellSound } from '@/hooks/use-bell-sound';
import { useBellHighFives } from '@/hooks/useBellHighFives';
import { Bell, DollarSign, Loader2, Sparkles, Users, User, MapPin, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  stylist_photo?: string | null;
  stylist_locations?: string[];
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

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<BellEntry | null>(null);

  // Location filter state
  const [locationFilter, setLocationFilter] = useState<string | null>(null);

  // Filter entries by location
  const filteredEntries = useMemo(() => {
    if (!locationFilter) return entries;
    return entries.filter(e => e.stylist_locations?.includes(locationFilter));
  }, [entries, locationFilter]);

  // Separate entries into my rings and all team rings (including mine)
  const myRings = useMemo(() => 
    filteredEntries.filter(e => e.user_id === user?.id), 
    [filteredEntries, user?.id]
  );
  
  // Team rings shows ALL entries (everyone's rings including yours)
  const teamRings = useMemo(() => filteredEntries, [filteredEntries]);

  // High fives hook
  const entryIds = useMemo(() => entries.map(e => e.id), [entries]);
  const { 
    toggleHighFive, 
    hasUserHighFived, 
    getHighFiveCount, 
    getHighFiveUsers 
  } = useBellHighFives(entryIds);

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
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'ring_the_bell_entries' },
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
    // Fetch bell entries
    const { data: entriesData, error: entriesError } = await supabase
      .from('ring_the_bell_entries')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);

    if (entriesError) {
      console.error('Error fetching entries:', entriesError);
      setEntries([]);
      setLoading(false);
      return;
    }

    if (!entriesData || entriesData.length === 0) {
      setEntries([]);
      setLoading(false);
      return;
    }

    // Get unique user IDs and fetch their profiles
    const userIds = [...new Set(entriesData.map(e => e.user_id))];
    const { data: profilesData } = await supabase
      .from('employee_profiles')
      .select('user_id, display_name, full_name, photo_url, location_ids')
      .in('user_id', userIds);

    // Get all location IDs to fetch location names
    const allLocationIds = (profilesData || [])
      .flatMap(p => p.location_ids || [])
      .filter((id, index, arr) => arr.indexOf(id) === index);

    // Fetch location names
    const { data: locationsData } = await supabase
      .from('locations')
      .select('id, name')
      .in('id', allLocationIds);

    // Create location map
    const locationsMap = new Map(
      (locationsData || []).map(l => [l.id, l.name])
    );

    // Create a map of user_id -> profile for quick lookup
    const profilesMap = new Map(
      (profilesData || []).map(p => [p.user_id, {
        ...p,
        locationNames: (p.location_ids || []).map((id: string) => locationsMap.get(id)).filter(Boolean),
      }])
    );

    // Merge entries with profile data
    const formattedEntries = entriesData.map((entry) => {
      const profile = profilesMap.get(entry.user_id);
      return {
        ...entry,
        stylist_name: profile?.display_name || profile?.full_name || 'Stylist',
        stylist_photo: profile?.photo_url || null,
        stylist_locations: profile?.locationNames || [],
      };
    });

    setEntries(formattedEntries as BellEntry[]);
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
      
      // Manually refresh to show the new entry immediately
      fetchEntries();
    }

    setSubmitting(false);
  };

  const handleTogglePin = async (entryId: string, currentlyPinned: boolean) => {
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

  const handleSaveNote = async (entryId: string, noteText: string) => {
    if (!isCoach) return;
    
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
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save note.',
      });
    }
  };

  const handleSaveEdit = async (
    entryId: string, 
    data: { service: string; ticketValue: string; leadSource: string; closingScript: string }
  ) => {
    const { error } = await supabase
      .from('ring_the_bell_entries')
      .update({
        service_booked: data.service,
        ticket_value: parseFloat(data.ticketValue),
        lead_source: data.leadSource as any,
        closing_script: data.closingScript || null,
      })
      .eq('id', entryId);

    if (!error) {
      setEntries(prev =>
        prev.map(e =>
          e.id === entryId
            ? {
                ...e,
                service_booked: data.service,
                ticket_value: parseFloat(data.ticketValue),
                lead_source: data.leadSource,
                closing_script: data.closingScript || null,
              }
            : e
        )
      );
      toast({
        title: '✅ Entry Updated',
        description: 'Your bell entry has been updated.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update entry.',
      });
    }
  };

  const handleDelete = (entry: BellEntry) => {
    setEntryToDelete(entry);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!entryToDelete) return;
    
    const { error } = await supabase
      .from('ring_the_bell_entries')
      .delete()
      .eq('id', entryToDelete.id);

    if (!error) {
      setEntries(prev => prev.filter(e => e.id !== entryToDelete.id));
      toast({
        title: '🗑️ Entry Deleted',
        description: 'The bell entry has been removed.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete entry.',
      });
    }
    setDeleteDialogOpen(false);
    setEntryToDelete(null);
  };

  const canEditOrDelete = (entry: BellEntry) => {
    return user?.id === entry.user_id || isCoach;
  };

  const renderEntryList = (entryList: BellEntry[], showStylistName: boolean) => {
    if (entryList.length === 0) {
      return (
        <Card className="p-12 text-center">
          <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground font-sans">
            No bells rung yet.
          </p>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {entryList.map((entry) => (
          <BellEntryCard
            key={entry.id}
            entry={entry}
            isCoach={isCoach}
            canEditOrDelete={canEditOrDelete(entry)}
            showStylistName={showStylistName}
            highFiveCount={getHighFiveCount(entry.id)}
            hasUserHighFived={hasUserHighFived(entry.id)}
            highFiveUsers={getHighFiveUsers(entry.id)}
            activeLocationFilter={locationFilter}
            onTogglePin={handleTogglePin}
            onSaveNote={handleSaveNote}
            onSaveEdit={handleSaveEdit}
            onDelete={handleDelete}
            onToggleHighFive={toggleHighFive}
            onLocationClick={(loc) => setLocationFilter(locationFilter === loc ? null : loc)}
          />
        ))}
      </div>
    );
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

        {/* Location Filter Indicator */}
        {locationFilter && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-sans">Filtering by:</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setLocationFilter(null)}
              className="h-7 px-2 gap-1.5 text-xs font-sans"
            >
              <MapPin className="w-3 h-3" />
              {locationFilter}
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}

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

        {/* Feed with Tabs */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="team" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="team" className="gap-2">
                <Users className="w-4 h-4" />
                Team Rings
                {teamRings.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-muted rounded-full">
                    {teamRings.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="mine" className="gap-2">
                <User className="w-4 h-4" />
                My Rings
                {myRings.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-muted rounded-full">
                    {myRings.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="team">
              {renderEntryList(teamRings, true)}
            </TabsContent>

            <TabsContent value="mine">
              {renderEntryList(myRings, false)}
            </TabsContent>
          </Tabs>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Bell Entry?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove this ${entryToDelete?.ticket_value.toLocaleString()} booking from the bell feed. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}