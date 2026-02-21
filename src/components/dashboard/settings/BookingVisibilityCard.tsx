import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { useActiveStylists } from '@/hooks/useStaffServiceConfigurator';
import { useToggleBookableOnline } from '@/hooks/useNativeServicesForWebsite';
import { useUndoToast } from '@/hooks/useUndoToast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { LocationSelect } from '@/components/ui/location-select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, ShoppingBag, MapPin } from 'lucide-react';

// ─── Hooks ────────────────────────────────────────────────────────

function useToggleIsBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, isBooking }: { userId: string; isBooking: boolean }) => {
      const { error } = await supabase
        .from('employee_profiles')
        .update({ is_booking: isBooking })
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['active-stylists'] });
    },
  });
}

function useServicesWithCategories(orgId: string | undefined) {
  return useQuery({
    queryKey: ['booking-visibility-services', orgId],
    queryFn: async () => {
      if (!orgId) return { services: [], categories: [] };

      const [svcRes, catRes] = await Promise.all([
        supabase
          .from('services')
          .select('id, name, category, bookable_online, display_order, is_active')
          .eq('organization_id', orgId)
          .eq('is_active', true)
          .order('display_order'),
        supabase
          .from('service_category_colors')
          .select('category_name, display_order')
          .eq('organization_id', orgId)
          .order('display_order'),
      ]);

      if (svcRes.error) throw svcRes.error;
      if (catRes.error) throw catRes.error;

      return {
        services: svcRes.data || [],
        categories: (catRes.data || []).filter(c => !['Block', 'Break'].includes(c.category_name)),
      };
    },
    enabled: !!orgId,
    staleTime: 2 * 60 * 1000,
  });
}

// ─── Stylists Panel ──────────────────────────────────────────────

function StylistsPanel({ orgId }: { orgId: string }) {
  const [locationId, setLocationId] = useState('all');
  const { data: stylists = [], isLoading } = useActiveStylists(orgId, locationId);
  const toggleBooking = useToggleIsBooking();
  const showUndo = useUndoToast();

  // We need is_booking from employee_profiles — useActiveStylists returns it
  const bookingCount = stylists.filter((s: any) => s.is_booking !== false).length;

  const handleToggle = (userId: string, currentVal: boolean) => {
    const newVal = !currentVal;
    toggleBooking.mutate({ userId, isBooking: newVal });
    showUndo(
      newVal ? 'Stylist now accepting bookings' : 'Stylist hidden from bookings',
      () => toggleBooking.mutate({ userId, isBooking: currentVal }),
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <LocationSelect
          value={locationId}
          onValueChange={setLocationId}
          triggerClassName="w-[200px]"
        />
        <Badge variant="secondary" className="text-xs shrink-0">
          {bookingCount} of {stylists.length} visible
        </Badge>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-6 text-center">Loading stylists…</p>
      ) : stylists.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">No service providers found.</p>
      ) : (
        <div className="divide-y divide-border rounded-lg border">
          {stylists.map((s: any) => {
            const name = s.display_name || s.full_name || 'Unknown';
            const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
            const isBooking = s.is_booking !== false;

            return (
              <div key={s.user_id} className="flex items-center justify-between px-4 py-3 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={s.photo_url || undefined} alt={name} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium truncate">{name}</span>
                </div>
                <Switch
                  checked={isBooking}
                  onCheckedChange={() => handleToggle(s.user_id, isBooking)}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Services Panel ──────────────────────────────────────────────

function ServicesPanel({ orgId }: { orgId: string }) {
  const { data, isLoading } = useServicesWithCategories(orgId);
  const toggleOnline = useToggleBookableOnline();
  const showUndo = useUndoToast();
  const qc = useQueryClient();

  const services = data?.services || [];
  const categories = data?.categories || [];

  const grouped = useMemo(() => {
    const map = new Map<string, typeof services>();
    for (const s of services) {
      const cat = s.category || 'Uncategorized';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(s);
    }
    return map;
  }, [services]);

  const handleToggleService = (serviceId: string, current: boolean) => {
    const newVal = !current;
    toggleOnline.mutate({ serviceId, bookableOnline: newVal });
    showUndo(
      newVal ? 'Service now bookable online' : 'Service hidden from booking',
      () => toggleOnline.mutate({ serviceId, bookableOnline: current }),
    );
  };

  const handleToggleCategory = (catName: string, setTo: boolean) => {
    const catServices = grouped.get(catName) || [];
    Promise.all(
      catServices.map(s =>
        supabase.from('services').update({ bookable_online: setTo }).eq('id', s.id)
      )
    ).then(() => {
      qc.invalidateQueries({ queryKey: ['booking-visibility-services'] });
      qc.invalidateQueries({ queryKey: ['services-website'] });
    });
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-6 text-center">Loading services…</p>;
  }

  const totalOnline = services.filter(s => s.bookable_online).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Badge variant="secondary" className="text-xs">
          {totalOnline} of {services.length} bookable online
        </Badge>
      </div>

      <Accordion type="multiple" className="space-y-2">
        {categories.map(cat => {
          const catServices = grouped.get(cat.category_name) || [];
          if (catServices.length === 0) return null;
          const onlineCount = catServices.filter(s => s.bookable_online).length;
          const allOn = onlineCount === catServices.length;
          const someOn = onlineCount > 0 && !allOn;

          return (
            <AccordionItem key={cat.category_name} value={cat.category_name} className="border rounded-lg px-1">
              <AccordionTrigger className="hover:no-underline py-3 px-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Checkbox
                    checked={allOn ? true : someOn ? 'indeterminate' : false}
                    onCheckedChange={(checked) => {
                      handleToggleCategory(cat.category_name, !!checked);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="text-sm font-medium truncate">{cat.category_name}</span>
                  <Badge variant="outline" className="text-[10px] ml-auto shrink-0">
                    {onlineCount}/{catServices.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-2">
                <div className="divide-y divide-border/50">
                  {catServices.map(svc => (
                    <div key={svc.id} className="flex items-center justify-between px-4 py-2.5 pl-10">
                      <span className="text-sm truncate">{svc.name}</span>
                      <Switch
                        checked={svc.bookable_online}
                        onCheckedChange={() => handleToggleService(svc.id, svc.bookable_online)}
                      />
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

// ─── Main Card ───────────────────────────────────────────────────

export function BookingVisibilityCard() {
  const { effectiveOrganization } = useOrganizationContext();
  const orgId = effectiveOrganization?.id;

  if (!orgId) return null;

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div>
          <CardTitle className="font-display text-lg">STYLIST & SERVICE VISIBILITY</CardTitle>
          <CardDescription>Control which stylists and services appear on your booking widget.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="stylists">
          <TabsList className="mb-4">
            <TabsTrigger value="stylists" className="gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Stylists
            </TabsTrigger>
            <TabsTrigger value="services" className="gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5" />
              Services
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stylists">
            <StylistsPanel orgId={orgId} />
          </TabsContent>

          <TabsContent value="services">
            <ServicesPanel orgId={orgId} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
