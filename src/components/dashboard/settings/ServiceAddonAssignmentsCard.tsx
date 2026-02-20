import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, ChevronDown, ChevronUp, Plus, X, Scissors, FolderOpen, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { tokens } from '@/lib/design-tokens';
import { useServiceAddons, type ServiceAddon } from '@/hooks/useServiceAddons';
import { useAddonAssignments, useCreateAddonAssignment, useDeleteAddonAssignment, type AddonAssignment } from '@/hooks/useServiceAddonAssignments';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import type { ServiceCategoryColor } from '@/hooks/useServiceCategoryColors';
import type { Service } from '@/hooks/useServicesData';
import { isGradientMarker, getGradientFromMarker, getCategoryAbbreviation } from '@/utils/categoryColors';

interface ServiceAddonAssignmentsCardProps {
  organizationId: string;
  categories: ServiceCategoryColor[];
  servicesByCategory: Record<string, Service[]>;
}

function AddonChip({ addon, onRemove }: { addon: ServiceAddon; onRemove: () => void }) {
  const { formatCurrency } = useFormatCurrency();
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium">
      <span className="truncate max-w-[140px]">{addon.name}</span>
      <span className="text-primary font-semibold">{formatCurrency(addon.price)}</span>
      <button onClick={onRemove} className="text-muted-foreground hover:text-foreground transition-colors ml-0.5">
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

function AddAddonSelect({ addons, onAdd, existingIds }: { addons: ServiceAddon[]; onAdd: (id: string) => void; existingIds: Set<string> }) {
  const available = addons.filter(a => !existingIds.has(a.id));
  const { formatCurrency } = useFormatCurrency();

  if (available.length === 0) {
    return <span className="text-[11px] text-muted-foreground italic">All add-ons assigned</span>;
  }

  return (
    <Select onValueChange={onAdd}>
      <SelectTrigger className="h-7 w-auto min-w-[130px] text-xs border-primary/30 text-primary">
        <Plus className="h-3 w-3 mr-1" />
        <SelectValue placeholder="Assign add-on" />
      </SelectTrigger>
      <SelectContent>
        {available.map(a => (
          <SelectItem key={a.id} value={a.id} className="text-xs">
            {a.name} — {formatCurrency(a.price)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ServiceAddonAssignmentsCard({ organizationId, categories, servicesByCategory }: ServiceAddonAssignmentsCardProps) {
  const { data: allAddons = [] } = useServiceAddons(organizationId);
  const { data: assignments = [] } = useAddonAssignments(organizationId);
  const createAssignment = useCreateAddonAssignment();
  const deleteAssignment = useDeleteAddonAssignment();

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const toggleRow = (id: string) => setExpandedRows(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  // Group assignments by target
  const catAssignments = useMemo(() => {
    const map: Record<string, AddonAssignment[]> = {};
    assignments.filter(a => a.target_type === 'category').forEach(a => {
      const key = a.target_category_id!;
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    return map;
  }, [assignments]);

  const svcAssignments = useMemo(() => {
    const map: Record<string, AddonAssignment[]> = {};
    assignments.filter(a => a.target_type === 'service').forEach(a => {
      const key = a.target_service_id!;
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    return map;
  }, [assignments]);

  const totalAssigned = assignments.length;

  const handleAssignToCategory = (categoryId: string, addonId: string) => {
    createAssignment.mutate({
      organization_id: organizationId,
      addon_id: addonId,
      target_type: 'category',
      target_category_id: categoryId,
    });
  };

  const handleAssignToService = (serviceId: string, addonId: string) => {
    createAssignment.mutate({
      organization_id: organizationId,
      addon_id: addonId,
      target_type: 'service',
      target_service_id: serviceId,
    });
  };

  const handleRemove = (assignmentId: string) => {
    deleteAssignment.mutate({ id: assignmentId, organizationId });
  };

  if (categories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <CardTitle className={tokens.heading.section}>BOOKING ADD-ON RECOMMENDATIONS</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Scissors}
            title="No categories yet"
            description="Create service categories first to assign add-on recommendations."
          />
        </CardContent>
      </Card>
    );
  }

  if (allAddons.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <CardTitle className={tokens.heading.section}>BOOKING ADD-ON RECOMMENDATIONS</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="px-3 py-4 text-center">
            <p className="text-sm text-muted-foreground">
              Create add-ons in the library above first, then assign them to categories and services here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <CardTitle className={tokens.heading.section}>BOOKING ADD-ON RECOMMENDATIONS</CardTitle>
          </div>
          {totalAssigned > 0 && (
            <Badge variant="secondary" className="text-xs">
              {totalAssigned} assigned
            </Badge>
          )}
        </div>
        <CardDescription>
          Assign add-ons to categories or specific services. During booking, Zura surfaces these as smart recommendations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {categories.map(cat => {
            const abbr = getCategoryAbbreviation(cat.category_name);
            const hasGradient = isGradientMarker(cat.color_hex);
            const gradient = hasGradient ? getGradientFromMarker(cat.color_hex) : null;
            const catAddons = catAssignments[cat.id] || [];
            const services = servicesByCategory[cat.category_name] || [];
            const svcAddonCount = services.reduce((sum, s) => sum + (svcAssignments[s.id]?.length || 0), 0);
            const totalForCat = catAddons.length + svcAddonCount;
            const isExpanded = expandedRows.has(cat.id);
            const existingCatAddonIds = new Set(catAddons.map(a => a.addon_id));

            return (
              <div key={cat.id} className="rounded-lg border border-border/50 overflow-hidden">
                <button
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/40 transition-colors text-left"
                  onClick={() => toggleRow(cat.id)}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-sans font-medium shrink-0"
                    style={gradient ? { background: gradient.background, color: gradient.textColor } : { backgroundColor: cat.color_hex, color: cat.text_color_hex }}
                  >
                    {abbr}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(tokens.body.emphasis, 'truncate')}>{cat.category_name}</p>
                    {totalForCat > 0 ? (
                      <p className={cn(tokens.body.muted, 'flex items-center gap-1')}>
                        <Sparkles className="h-3 w-3 text-primary" />
                        {totalForCat} add-on{totalForCat !== 1 ? 's' : ''} assigned
                      </p>
                    ) : (
                      <p className={tokens.body.muted}>No add-ons assigned</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {totalForCat === 0 && <span className="text-xs text-primary font-medium">+ Configure</span>}
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border/50 bg-muted/20 px-4 py-3 space-y-4">
                    {/* Category-level assignments */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                          Category-level (any {cat.category_name} service)
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {catAddons.map(a => a.addon && (
                          <AddonChip key={a.id} addon={a.addon} onRemove={() => handleRemove(a.id)} />
                        ))}
                        <AddAddonSelect
                          addons={allAddons}
                          existingIds={existingCatAddonIds}
                          onAdd={(addonId) => handleAssignToCategory(cat.id, addonId)}
                        />
                      </div>
                    </div>

                    {/* Service-level assignments */}
                    {services.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                            Service-level (specific services)
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {services.map(svc => {
                            const svcAddons = svcAssignments[svc.id] || [];
                            const existingSvcAddonIds = new Set(svcAddons.map(a => a.addon_id));
                            // Merge with category-level to prevent duplicate assignment
                            const allExistingIds = new Set([...existingSvcAddonIds, ...existingCatAddonIds]);

                            return (
                              <div key={svc.id} className="flex items-start gap-2 pl-2">
                                <span className="text-xs text-muted-foreground mt-1.5 min-w-[120px] truncate shrink-0">{svc.name}</span>
                                <div className="flex flex-wrap items-center gap-1.5 flex-1">
                                  {svcAddons.map(a => a.addon && (
                                    <AddonChip key={a.id} addon={a.addon} onRemove={() => handleRemove(a.id)} />
                                  ))}
                                  <AddAddonSelect
                                    addons={allAddons}
                                    existingIds={allExistingIds}
                                    onAdd={(addonId) => handleAssignToService(svc.id, addonId)}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
