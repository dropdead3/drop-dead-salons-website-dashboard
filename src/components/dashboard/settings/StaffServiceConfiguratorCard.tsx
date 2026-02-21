import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { EmptyState } from '@/components/ui/empty-state';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Users, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { tokens } from '@/lib/design-tokens';
import { useUndoToast } from '@/hooks/useUndoToast';
import {
  useStaffQualifications,
  useToggleServiceQualification,
  useBulkToggleCategoryQualifications,
  useActiveStylists,
} from '@/hooks/useStaffServiceConfigurator';
import type { Service } from '@/hooks/useServicesData';
import type { ServiceCategoryColor } from '@/hooks/useServiceCategoryColors';

interface Props {
  organizationId: string;
  categories: ServiceCategoryColor[];
  servicesByCategory: Record<string, Service[]>;
}

export function StaffServiceConfiguratorCard({ organizationId, categories, servicesByCategory }: Props) {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const { data: stylists, isLoading: stylistsLoading } = useActiveStylists(organizationId);
  const { data: qualifications, isLoading: qualsLoading } = useStaffQualifications(selectedUserId || undefined);
  const toggleService = useToggleServiceQualification();
  const bulkToggle = useBulkToggleCategoryQualifications();
  const showUndoToast = useUndoToast();

  // Build a set of service IDs that are explicitly deactivated
  const deactivatedServiceIds = useMemo(() => {
    const set = new Set<string>();
    qualifications?.forEach(q => {
      if (q.is_active === false) set.add(q.service_id);
    });
    return set;
  }, [qualifications]);

  // Build set of explicitly activated service IDs (has a row with is_active=true)
  const activatedServiceIds = useMemo(() => {
    const set = new Set<string>();
    qualifications?.forEach(q => {
      if (q.is_active !== false) set.add(q.service_id);
    });
    return set;
  }, [qualifications]);

  const hasAnyQualifications = (qualifications?.length || 0) > 0;

  // Determine if a service is "checked" (qualified)
  // Default: if no qualifications exist for this stylist, all services are available
  const isServiceChecked = (serviceId: string): boolean => {
    if (!hasAnyQualifications) return true; // graceful fallback
    if (deactivatedServiceIds.has(serviceId)) return false;
    if (activatedServiceIds.has(serviceId)) return true;
    // No row exists — default to available
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
    const newActive = state !== 'all'; // if all checked, deactivate all; otherwise activate all
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

  const selectedStylist = stylists?.find(s => s.user_id === selectedUserId);

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary" />
            <CardTitle className={tokens.heading.section}>STYLIST SERVICE ASSIGNMENTS</CardTitle>
          </div>
        </div>
        <CardDescription>
          Control which services each stylist is qualified to perform. This affects what can be booked for them.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stylist selector */}
        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
          <SelectTrigger className="w-full max-w-sm">
            <SelectValue placeholder="Select a team member…" />
          </SelectTrigger>
          <SelectContent>
            {stylistsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : (
              stylists?.map(s => (
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
                        // indeterminate not natively supported by radix, but we can use data attr
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
