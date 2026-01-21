import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Globe, Check, X, Loader2, User, MapPin, Clock, Eye, EyeOff, Users, Settings, ExternalLink } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { getLocationName, type Location } from '@/data/stylists';
import { useHomepageStylistsSettings, useUpdateHomepageStylistsSettings } from '@/hooks/useSiteSettings';
import { sampleStylists } from '@/data/sampleStylists';
import { HomepagePreviewModal } from '@/components/dashboard/HomepagePreviewModal';

interface StylistProfile {
  id: string;
  user_id: string;
  full_name: string;
  display_name: string | null;
  photo_url: string | null;
  instagram: string | null;
  stylist_level: string | null;
  specialties: string[] | null;
  location_id: string | null;
  is_booking: boolean | null;
  homepage_visible: boolean | null;
  homepage_requested: boolean | null;
  homepage_requested_at: string | null;
}

function useHomepagePendingRequests() {
  return useQuery({
    queryKey: ['homepage-pending-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_profiles')
        .select('*')
        .eq('is_active', true)
        .eq('homepage_requested', true)
        .eq('homepage_visible', false)
        .order('homepage_requested_at', { ascending: true });

      if (error) throw error;
      return data as StylistProfile[];
    },
  });
}

function useHomepageVisibleStylists() {
  return useQuery({
    queryKey: ['homepage-visible-stylists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_profiles')
        .select('*')
        .eq('is_active', true)
        .eq('homepage_visible', true)
        .order('full_name');

      if (error) throw error;
      return data as StylistProfile[];
    },
  });
}

function useUpdateHomepageVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, visible }: { userId: string; visible: boolean }) => {
      const { error } = await supabase
        .from('employee_profiles')
        .update({ 
          homepage_visible: visible,
          homepage_requested: false,
        })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: (_, { visible }) => {
      queryClient.invalidateQueries({ queryKey: ['homepage-pending-requests'] });
      queryClient.invalidateQueries({ queryKey: ['homepage-visible-stylists'] });
      queryClient.invalidateQueries({ queryKey: ['homepage-stylists'] });
      toast.success(visible ? 'Stylist added to homepage' : 'Stylist removed from homepage');
    },
    onError: (error) => {
      console.error('Error updating visibility:', error);
      toast.error('Failed to update visibility');
    },
  });
}

function useDenyRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('employee_profiles')
        .update({ 
          homepage_requested: false,
          homepage_requested_at: null,
        })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homepage-pending-requests'] });
      toast.success('Request denied');
    },
    onError: (error) => {
      console.error('Error denying request:', error);
      toast.error('Failed to deny request');
    },
  });
}

export default function HomepageStylists() {
  const [previewOpen, setPreviewOpen] = useState(false);
  
  const { data: pendingRequests = [], isLoading: loadingPending } = useHomepagePendingRequests();
  const { data: visibleStylists = [], isLoading: loadingVisible } = useHomepageVisibleStylists();
  const updateVisibility = useUpdateHomepageVisibility();
  const denyRequest = useDenyRequest();
  
  // Sample cards settings
  const { data: settings, isLoading: settingsLoading } = useHomepageStylistsSettings();
  const updateSettings = useUpdateHomepageStylistsSettings();
  const showSampleCards = settings?.show_sample_cards ?? false;
  
  // Count sample stylists per location
  const northMesaCount = sampleStylists.filter(s => s.locations.includes('north-mesa' as any)).length;
  const valVistaCount = sampleStylists.filter(s => s.locations.includes('val-vista-lakes' as any)).length;
  
  const handleToggleSampleCards = () => {
    updateSettings.mutate(
      { show_sample_cards: !showSampleCards },
      {
        onSuccess: () => {
          toast.success(showSampleCards ? 'Sample cards hidden' : 'Sample cards now visible');
        },
        onError: () => {
          toast.error('Failed to update setting');
        },
      }
    );
  };

  const StylistCard = ({ stylist, showActions = false }: { stylist: StylistProfile; showActions?: boolean }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="w-14 h-14">
            <AvatarImage src={stylist.photo_url || undefined} alt={stylist.full_name} />
            <AvatarFallback className="bg-muted text-lg">
              {stylist.full_name?.charAt(0) || <User className="w-6 h-6" />}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium">
              {stylist.display_name || stylist.full_name}
            </h3>
            {stylist.stylist_level && (
              <p className="text-sm text-muted-foreground">{stylist.stylist_level}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {stylist.location_id && (
                <Badge variant="outline" className="text-xs">
                  <MapPin className="w-3 h-3 mr-1" />
                  {getLocationName(stylist.location_id as Location)}
                </Badge>
              )}
              {stylist.instagram && (
                <Badge variant="outline" className="text-xs">
                  {stylist.instagram}
                </Badge>
              )}
            </div>
            {stylist.specialties && stylist.specialties.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {stylist.specialties.slice(0, 4).map(s => (
                  <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                ))}
                {stylist.specialties.length > 4 && (
                  <Badge variant="secondary" className="text-xs">+{stylist.specialties.length - 4}</Badge>
                )}
              </div>
            )}
            {showActions && stylist.homepage_requested_at && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Requested {format(new Date(stylist.homepage_requested_at), 'MMM d, yyyy')}
              </p>
            )}
          </div>

          {showActions ? (
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                onClick={() => updateVisibility.mutate({ userId: stylist.user_id, visible: true })}
                disabled={updateVisibility.isPending}
              >
                <Check className="w-4 h-4 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => denyRequest.mutate(stylist.user_id)}
                disabled={denyRequest.isPending}
              >
                <X className="w-4 h-4 mr-1" />
                Deny
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {stylist.homepage_visible ? 'Visible' : 'Hidden'}
              </span>
              <Switch
                checked={stylist.homepage_visible ?? false}
                onCheckedChange={(checked) => updateVisibility.mutate({ userId: stylist.user_id, visible: checked })}
                disabled={updateVisibility.isPending}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-medium mb-2 flex items-center gap-2">
            <Globe className="w-6 h-6" />
            Homepage Stylists
          </h1>
          <p className="text-muted-foreground">
            Manage which stylists appear on the public website homepage.
          </p>
        </div>

        {/* Sample Cards Settings */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Sample Cards Settings
            </CardTitle>
            <CardDescription>
              Show placeholder stylist cards when no real stylists are visible on the homepage.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="sample-cards"
                    checked={showSampleCards}
                    onCheckedChange={handleToggleSampleCards}
                    disabled={settingsLoading || updateSettings.isPending}
                  />
                  <label htmlFor="sample-cards" className="text-sm font-medium cursor-pointer">
                    Show sample stylist cards
                  </label>
                </div>
                {(settingsLoading || updateSettings.isPending) && (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Badge variant="outline" className="gap-1">
                  <Users className="w-3 h-3" />
                  {northMesaCount} North Mesa
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Users className="w-3 h-3" />
                  {valVistaCount} Val Vista
                </Badge>
              </div>
            </div>
            {showSampleCards && visibleStylists.length > 0 && (
              <p className="text-xs text-muted-foreground mt-3 p-2 bg-muted rounded">
                Note: Sample cards won't appear because you have {visibleStylists.length} real stylist(s) visible. Sample cards only show when no real stylists are visible.
              </p>
            )}
            <div className="mt-4 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewOpen(true)}
                className="gap-2"
              >
                <Eye className="w-4 h-4" />
                Preview Homepage Section
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <HomepagePreviewModal open={previewOpen} onOpenChange={setPreviewOpen} />

        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList>
            <TabsTrigger value="requests" className="relative">
              Pending Requests
              {pendingRequests.length > 0 && (
                <Badge className="ml-2 h-5 min-w-5 flex items-center justify-center text-xs px-1.5" variant="destructive">
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="visible">
              Currently Visible ({visibleStylists.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            {loadingPending ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No pending visibility requests.</p>
                  <p className="text-sm mt-1">
                    When stylists with complete profiles request homepage visibility, they'll appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingRequests.map(stylist => (
                  <StylistCard key={stylist.id} stylist={stylist} showActions />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="visible">
            {loadingVisible ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : visibleStylists.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <EyeOff className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No stylists are currently visible on the homepage.</p>
                  <p className="text-sm mt-1">
                    Approve pending requests to add stylists to the public website.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {visibleStylists.map(stylist => (
                  <StylistCard key={stylist.id} stylist={stylist} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
