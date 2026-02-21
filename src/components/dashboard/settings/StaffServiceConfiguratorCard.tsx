import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { EmptyState } from '@/components/ui/empty-state';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, Users, UserCheck, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { tokens } from '@/lib/design-tokens';
import { useUndoToast } from '@/hooks/useUndoToast';
import { useActiveLocations } from '@/hooks/useLocations';
import {
  useStaffQualifications,
  useToggleServiceQualification,
  useBulkToggleCategoryQualifications,
  useActiveStylists,
} from '@/hooks/useStaffServiceConfigurator';
import type { Service } from '@/hooks/useServicesData';
import type { ServiceCategoryColor } from '@/hooks/useServiceCategoryColors';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

interface Props {
  organizationId: string;
  categories: ServiceCategoryColor[];
  servicesByCategory: Record<string, Service[]>;
}

export function StaffServiceConfiguratorCard({ organizationId, categories, servicesByCategory }: Props) {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [letterFilter, setLetterFilter] = useState<string | null>(null);

  const { data: locations = [] } = useActiveLocations();
  const { data: stylists, isLoading: stylistsLoading } = useActiveStylists(organizationId, locationFilter);
  const { data: qualifications, isLoading: qualsLoading } = useStaffQualifications(selectedUserId || undefined);
  const toggleService = useToggleServiceQualification();
  const bulkToggle = useBulkToggleCategoryQualifications();
  const showUndoToast = useUndoToast();

  // Client-side letter filter
  const filteredStylists = useMemo(() => {
    if (!stylists) return [];
    if (!letterFilter) return stylists;
    return stylists.filter(s => {
      const name = (s.display_name || s.full_name || '').trim();
      return name.length > 0 && name[0].toUpperCase() === letterFilter;
    });
  }, [stylists, letterFilter]);

  // Letters that have matching stylists (for highlighting)
  const availableLetters = useMemo(() => {
    const set = new Set<string>();
    stylists?.forEach(s => {
      const name = (s.display_name || s.full_name || '').trim();
      if (name.length > 0) set.add(name[0].toUpperCase());
    });
    return set;
  }, [stylists]);

  // Reset selected user when filters change and they're no longer in list
  const selectedStillVisible = filteredStylists.some(s => s.user_id === selectedUserId);
  if (selectedUserId && filteredStylists.length > 0 && !selectedStillVisible && !stylistsLoading) {
    setTimeout(() => setSelectedUserId(''), 0);
  }

  // Build a set of service IDs that are explicitly deactivated
  const deactivatedServiceIds = useMemo(() => {
    const set = new Set<string>();
    qualifications?.forEach(q => {
      if (q.is_active === false) set.add(q.service_id);
    });
    return set;
  }, [qualifications]);

  const activatedServiceIds = useMemo(() => {
    const set = new Set<string>();
    qualifications?.forEach(q => {
      if (q.is_active !== false) set.add(q.service_id);
    });
    return set;
  }, [qualifications]);

  const hasAnyQualifications = (qualifications?.length || 0) > 0;

  const isServiceChecked = (serviceId: string): boolean => {
    if (!hasAnyQualifications) return true;
    if (deactivatedServiceIds.has(serviceId)) return false;
    if (activatedServiceIds.has(serviceId)) return true;
    return true;
  };

  const getCategoryCheckState = (categoryName: string): 'all' | 'none' | 'some' => {
    const services = servicesByCategory[categoryName] || [];
    if (services.length === 0) return 'none';
    const checkedCount = services.filter(s => isServiceChecked(s.id)).length;
    if (checkedCount === services.length) return 'all';
    if (checkedCount === 0) return 'none';
    return 'some';
  };

  const handleToggleService = (service: Service, currentlyChecked: boolean) => {
    if (!selectedUserId) return;
    const newState = !currentlyChecked;
    toggleService.mutate(
      { userId: selectedUserId, serviceId: service.id, isActive: newState },
      {
        onSuccess: () => {
          showUndoToast(
            `${newState ? 'Enabled' : 'Disabled'} '${service.name}'`,
            () => toggleService.mutate({ userId: selectedUserId, serviceId: service.id, isActive: currentlyChecked })
          );
        },
      }
    );
  };

  const handleToggleCategory = (categoryName: string) => {
    if (!selectedUserId) return;
    const services = servicesByCategory[categoryName] || [];
    if (services.length === 0) return;
    const state = getCategoryCheckState(categoryName);
    const newActive = state !== 'all';
    const serviceIds = services.map(s => s.id);
    bulkToggle.mutate(
      { userId: selectedUserId, serviceIds, isActive: newActive },
      {
        onSuccess: () => {
          showUndoToast(
            `${newActive ? 'Enabled' : 'Disabled'} all ${categoryName} services`,
            () => bulkToggle.mutate({ userId: selectedUserId, serviceIds, isActive: !newActive })
          );
        },
      }
    );
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary" />
            <CardTitle className={tokens.heading.section}>STYLIST SERVICE ASSIGNMENTS</CardTitle>
          </div>
          {stylists && stylists.length > 0 && (
            <Badge variant="outline" className="text-xs font-normal">
              {filteredStylists.length} stylist{filteredStylists.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <CardDescription>
          Control which services each stylist is qualified to perform.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Location filter */}
          <Select value={locationFilter} onValueChange={(v) => { setLocationFilter(v); setSelectedUserId(''); }}>
            <SelectTrigger className="w-full sm:w-48">
              <MapPin className="w-3.5 h-3.5 mr-1.5 text-muted-foreground shrink-0" />
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map(loc => (
                <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Stylist selector */}
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-full sm:flex-1">
              <SelectValue placeholder="Select a team member…" />
            </SelectTrigger>
            <SelectContent>
              {stylistsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              ) : filteredStylists.length === 0 ? (
                <div className="py-3 px-4 text-sm text-muted-foreground text-center">
                  No stylists match filters
                </div>
              ) : (
                filteredStylists.map(s => (
                  <SelectItem key={s.user_id} value={s.user_id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={s.photo_url || undefined} />
                        <AvatarFallback className="text-[9px]">
                          {(s.display_name || s.full_name || '?').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>{s.display_name || s.full_name || 'Unnamed'}</span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* A-Z letter bar */}
        <div className="flex flex-wrap gap-0.5">
          {ALPHABET.map(letter => {
            const hasMatch = availableLetters.has(letter);
            const isActive = letterFilter === letter;
            return (
              <Button
                key={letter}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  'h-7 w-7 p-0 text-xs font-medium rounded-md',
                  !hasMatch && !isActive && 'text-muted-foreground/30 pointer-events-none',
                )}
                disabled={!hasMatch && !isActive}
                onClick={() => setLetterFilter(isActive ? null : letter)}
              >
                {letter}
              </Button>
            );
          })}
          {letterFilter && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground ml-1"
              onClick={() => setLetterFilter(null)}
            >
              Clear
            </Button>
          )}
        </div>

        {/* Empty state */}
        {!selectedUserId && (
          <EmptyState
            icon={Users}
            title="Select a team member"
            description="Choose a stylist above to manage their service assignments."
          />
        )}

        {/* Loading qualifications */}
        {selectedUserId && qualsLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Category accordions */}
        {selectedUserId && !qualsLoading && (
          <div className="space-y-1">
            {!hasAnyQualifications && (
              <p className={cn(tokens.body.muted, 'text-xs italic px-1 pb-2')}>
                No assignments configured yet — all services default to available. Toggle services off to restrict what this stylist can be booked for.
              </p>
            )}
            <Accordion type="multiple" defaultValue={categories.map(c => c.id)}>
              {categories.map(cat => {
                const services = servicesByCategory[cat.category_name] || [];
                if (services.length === 0) return null;
                const checkState = getCategoryCheckState(cat.category_name);
                const checkedCount = services.filter(s => isServiceChecked(s.id)).length;

                return (
                  <AccordionItem key={cat.id} value={cat.id} className="border-b-0">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={checkState === 'all'}
                        {...(checkState === 'some' ? { 'data-state': 'indeterminate' as any } : {})}
                        onCheckedChange={() => handleToggleCategory(cat.category_name)}
                        className="ml-1"
                        disabled={toggleService.isPending || bulkToggle.isPending}
                      />
                      <AccordionTrigger className="flex-1 py-2 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color_hex.startsWith('gradient:') ? '#888' : cat.color_hex }}
                          />
                          <span className={tokens.body.emphasis}>{cat.category_name}</span>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {checkedCount}/{services.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                    </div>
                    <AccordionContent>
                      <div className="space-y-1 pl-7">
                        {services.map(svc => {
                          const checked = isServiceChecked(svc.id);
                          return (
                            <label
                              key={svc.id}
                              className={cn(
                                'flex items-center gap-2.5 py-1.5 px-2 rounded-md cursor-pointer hover:bg-muted/40 transition-colors',
                                !checked && 'opacity-50'
                              )}
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={() => handleToggleService(svc, checked)}
                                disabled={toggleService.isPending || bulkToggle.isPending}
                              />
                              <span className={cn(tokens.body.default, 'text-sm select-none')}>{svc.name}</span>
                              {svc.duration_minutes && (
                                <span className={cn(tokens.body.muted, 'text-[10px] ml-auto')}>{svc.duration_minutes}min</span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
