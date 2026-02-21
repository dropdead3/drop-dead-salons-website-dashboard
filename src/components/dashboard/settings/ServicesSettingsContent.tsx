import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { EmptyState } from '@/components/ui/empty-state';
import { 
  Loader2, Plus, Pencil, Trash2, GripVertical, Palette, Info, Clock, DollarSign, Scissors, Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { tokens } from '@/lib/design-tokens';
import {
  useServiceCategoryColors,
  useUpdateCategoryColor,
  useReorderCategories,
  getCategoryAbbreviation,
  type ServiceCategoryColor,
} from '@/hooks/useServiceCategoryColors';
import { useCreateCategory, useRenameCategory, useDeleteCategory } from '@/hooks/useServiceCategoryColors';
import { useServicesData, useCreateService, useUpdateService, useDeleteService, type Service } from '@/hooks/useServicesData';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { CategoryFormDialog } from './CategoryFormDialog';
import { ServiceEditorDialog } from './ServiceEditorDialog';
import { ServiceAddonsLibrary } from './ServiceAddonsLibrary';
import { ServiceAddonAssignmentsCard } from './ServiceAddonAssignmentsCard';
import { toast } from 'sonner';
import {
  getCategoryAbbreviation as getAbbr,
  SPECIAL_GRADIENTS,
  isGradientMarker,
  getGradientFromMarker,
  getContrastingTextColor,
} from '@/utils/categoryColors';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
import { useFormatCurrency } from '@/hooks/useFormatCurrency';

// Curated color palette
const CATEGORY_PALETTE = [
  '#1a1a1a', '#2d2d2d', '#4a4a4a', '#6b7280', '#9ca3af', '#d1d5db',
  '#f5f5dc', '#e8e4d9', '#d4cfc4', '#c9c2b5', '#b8b0a2', '#a39e93',
  '#fde8d7', '#fbd5c4', '#f5c6aa', '#D4A574', '#C4A77D', '#B5A48C',
  '#fce7f3', '#fbcfe8', '#f9a8d4', '#F472B6', '#EC4899', '#DB2777',
  '#e0f2fe', '#bae6fd', '#7dd3fc', '#60A5FA', '#3B82F6', '#2563EB',
  '#d1fae5', '#a7f3d0', '#6ee7b7', '#f3e8ff', '#e9d5ff', '#c4b5fd',
];

const GRADIENT_OPTIONS = Object.values(SPECIAL_GRADIENTS).map(g => ({
  ...g,
  description: g.id === 'teal-lime' ? 'Fresh & vibrant' :
               g.id === 'rose-gold' ? 'Elegant warm tones' :
               g.id === 'ocean-blue' ? 'Cool aquatic vibes' :
               'Luxurious purple',
}));

function computeMargin(price: number, cost: number | null): number | null {
  if (cost == null || price <= 0) return null;
  return ((price - cost) / price) * 100;
}

function MarginBadge({ margin }: { margin: number | null }) {
  if (margin == null) return null;
  const color = margin >= 50 ? 'text-emerald-600 bg-emerald-500/10' : margin >= 30 ? 'text-amber-600 bg-amber-500/10' : 'text-red-600 bg-red-500/10';
  return <Badge variant="outline" className={cn('text-[10px] font-medium border-0 px-1.5 py-0', color)}>{Math.round(margin)}%</Badge>;
}

function SortableCategoryRow({ category, children }: { category: ServiceCategoryColor; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : undefined, opacity: isDragging ? 0.9 : undefined };

  return (
    <div ref={setNodeRef} style={style} className={cn('flex items-center gap-3', isDragging && 'shadow-lg')}>
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none">
        <GripVertical className="w-4 h-4" />
      </div>
      {children}
    </div>
  );
}

export function ServicesSettingsContent() {
  const { effectiveOrganization, userOrganizations } = useOrganizationContext();
  const resolvedOrgId = effectiveOrganization?.id || userOrganizations[0]?.id;
  const { data: categories, isLoading: catsLoading } = useServiceCategoryColors();
  const { data: allServices, isLoading: servicesLoading } = useServicesData(undefined, resolvedOrgId);
  const updateColor = useUpdateCategoryColor();
  const reorderCategories = useReorderCategories();
  const createCategory = useCreateCategory();
  const renameCategory = useRenameCategory();
  const deleteCategory = useDeleteCategory();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();
  const { formatCurrency } = useFormatCurrency();

  const serviceCategories = useMemo(() => 
    categories?.filter(c => !['Block', 'Break'].includes(c.category_name)) || [],
  [categories]);

  const [localOrder, setLocalOrder] = useState<ServiceCategoryColor[]>([]);
  useEffect(() => { if (serviceCategories.length) setLocalOrder(serviceCategories); }, [serviceCategories]);

  const servicesByCategory = useMemo(() => {
    const grouped: Record<string, Service[]> = {};
    allServices?.forEach(s => {
      const cat = s.category || 'Other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(s);
    });
    return grouped;
  }, [allServices]);

  // Dialog states
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoryDialogMode, setCategoryDialogMode] = useState<'create' | 'rename'>('create');
  const [editingCategory, setEditingCategory] = useState<ServiceCategoryColor | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [deleteCategoryName, setDeleteCategoryName] = useState('');

  // Unified editor dialog (replaces ServiceFormDialog)
  const [editorDialogOpen, setEditorDialogOpen] = useState(false);
  const [editorService, setEditorService] = useState<Service | null>(null);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('edit');
  const [editorPresetCategory, setEditorPresetCategory] = useState('');

  // Delete service confirmation
  const [deleteServiceId, setDeleteServiceId] = useState<string | null>(null);
  const [deleteServiceName, setDeleteServiceName] = useState('');

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = localOrder.findIndex(c => c.id === active.id);
    const newIdx = localOrder.findIndex(c => c.id === over.id);
    const newOrder = arrayMove(localOrder, oldIdx, newIdx);
    setLocalOrder(newOrder);
    reorderCategories.mutate(newOrder.map(c => c.id), {
      onSuccess: () => toast.success('Order saved'),
      onError: () => toast.error('Failed to save order'),
    });
  };

  const handleCreateCategory = (name: string) => {
    createCategory.mutate(
      { name, organizationId: effectiveOrganization?.id },
      {
        onSuccess: () => { setCategoryDialogOpen(false); toast.success('Category created'); },
        onError: (e) => toast.error('Failed: ' + e.message),
      }
    );
  };

  const handleRenameCategory = (name: string) => {
    if (!editingCategory) return;
    renameCategory.mutate(
      { categoryId: editingCategory.id, newName: name },
      {
        onSuccess: () => { setCategoryDialogOpen(false); setEditingCategory(null); toast.success('Category renamed'); },
        onError: (e) => toast.error('Failed: ' + e.message),
      }
    );
  };

  const handleDeleteCategory = () => {
    if (!deleteCategoryId) return;
    deleteCategory.mutate(deleteCategoryId, {
      onSuccess: () => { setDeleteCategoryId(null); toast.success('Category deleted'); },
      onError: (e) => toast.error('Failed: ' + e.message),
    });
  };

  const handleColorChange = (categoryId: string, colorHex: string) => {
    // Optimistically update localOrder so the avatar reflects the change immediately
    setLocalOrder(prev => prev.map(cat => {
      if (cat.id !== categoryId) return cat;
      const isGrad = colorHex.startsWith('gradient:');
      const gradientObj = isGrad ? getGradientFromMarker(colorHex) : null;
      return {
        ...cat,
        color_hex: colorHex,
        text_color_hex: isGrad ? (gradientObj?.textColor ?? '#1f2937') : getContrastingTextColor(colorHex),
      };
    }));
    updateColor.mutate({ categoryId, colorHex }, {
      onSuccess: () => toast.success('Color updated'),
      onError: (err) => {
        toast.error('Failed to update color');
        // Revert optimistic update on failure
        if (serviceCategories.length) setLocalOrder(serviceCategories);
      },
    });
  };

  const handleEditorSubmit = (service: Partial<Service>) => {
    if (editorMode === 'create') {
      createService.mutate(service, {
        onSuccess: () => { setEditorDialogOpen(false); },
        onError: () => {},
      });
    } else if (editorService?.id) {
      const { id, ...updates } = { id: editorService.id, ...service };
      updateService.mutate({ id, ...updates } as any, {
        onSuccess: () => { setEditorDialogOpen(false); setEditorService(null); },
        onError: () => {},
      });
    }
  };

  const handleToggleActive = (service: Service) => {
    updateService.mutate({ id: service.id, is_active: !service.is_active });
  };

  const handleDeleteService = () => {
    if (!deleteServiceId) return;
    deleteService.mutate(deleteServiceId, {
      onSuccess: () => { setDeleteServiceId(null); setDeleteServiceName(''); },
    });
  };

  const openCreateService = (categoryName?: string) => {
    setEditorMode('create');
    setEditorService(null);
    setEditorPresetCategory(categoryName || serviceCategories[0]?.category_name || '');
    setEditorDialogOpen(true);
  };

  const openEditService = (svc: Service) => {
    setEditorMode('edit');
    setEditorService(svc);
    setEditorPresetCategory('');
    setEditorDialogOpen(true);
  };

  // Filtered services for search
  const filteredServicesByCategory = useMemo(() => {
    if (!searchQuery.trim()) return servicesByCategory;
    const q = searchQuery.toLowerCase();
    const filtered: Record<string, Service[]> = {};
    for (const [cat, svcs] of Object.entries(servicesByCategory)) {
      const matches = svcs.filter(s => s.name.toLowerCase().includes(q));
      if (matches.length > 0) filtered[cat] = matches;
    }
    return filtered;
  }, [servicesByCategory, searchQuery]);

  // Auto-expand accordion items when searching
  const searchExpandedValues = useMemo(() => {
    if (!searchQuery.trim()) return undefined;
    return localOrder
      .filter(cat => filteredServicesByCategory[cat.category_name]?.length)
      .map(cat => cat.id);
  }, [searchQuery, localOrder, filteredServicesByCategory]);


  if (catsLoading || servicesLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Categories Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                <CardTitle className={tokens.heading.section}>SERVICE CATEGORIES</CardTitle>
              </div>
              <Button size={tokens.button.card} onClick={() => { setCategoryDialogMode('create'); setEditingCategory(null); setCategoryDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-1" /> Add Category
              </Button>
            </div>
            <CardDescription>
              Drag to reorder categories. Click the color badge to customize. This order is used across all booking flows.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {localOrder.length === 0 ? (
              <div className={tokens.empty.container}>
                <Scissors className={tokens.empty.icon} />
                <h3 className={tokens.empty.heading}>No categories yet</h3>
                <p className={tokens.empty.description}>Create your first service category to get started.</p>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={localOrder.map(c => c.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {localOrder.map((cat) => {
                      const abbr = getCategoryAbbreviation(cat.category_name);
                      const hasGradient = isGradientMarker(cat.color_hex);
                      const gradient = hasGradient ? getGradientFromMarker(cat.color_hex) : null;
                      const serviceCount = servicesByCategory[cat.category_name]?.length || 0;
                      const isEmpty = serviceCount === 0;

                      return (
                        <SortableCategoryRow key={cat.id} category={cat}>
                          {/* Color badge */}
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                className={cn(
                                  "w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-sans font-medium tracking-normal shrink-0 transition-transform hover:scale-105 ring-2 ring-offset-2 ring-offset-background ring-transparent hover:ring-primary/50",
                                  
                                )}
style={gradient ? { background: gradient.background, color: gradient.textColor, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)' } : { backgroundColor: cat.color_hex, color: cat.text_color_hex }}
                              >
                                {abbr}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-4" align="start">
                              <div className="space-y-3">
                                <p className={tokens.body.emphasis}>{cat.category_name}</p>
                                <div className="space-y-1">
                                  <p className={tokens.label.tiny}>Special Styles</p>
                                  <div className="flex gap-2 flex-wrap">
                                    {GRADIENT_OPTIONS.map(g => (
                                      <Tooltip key={g.id}>
                                        <TooltipTrigger asChild>
                                          <button
                                            className={cn('w-8 h-8 rounded-full shadow-md hover:scale-110 transition-transform', cat.color_hex === `gradient:${g.id}` && 'ring-2 ring-offset-2 ring-primary')}
                                            style={{ background: g.background }}
                                            onClick={() => handleColorChange(cat.id, `gradient:${g.id}`)}
                                          />
                                        </TooltipTrigger>
                                        <TooltipContent><p className="text-xs">{g.name}</p></TooltipContent>
                                      </Tooltip>
                                    ))}
                                  </div>
                                </div>
                                <div className="h-px bg-border" />
                                <div className="space-y-1">
                                  <p className={tokens.label.tiny}>Solid Colors</p>
                                  <div className="grid grid-cols-6 gap-1.5">
                                    {CATEGORY_PALETTE.map(c => (
                                      <button
                                        key={c}
                                        className={cn('w-7 h-7 rounded-full hover:scale-110 transition-transform', cat.color_hex.toLowerCase() === c.toLowerCase() && !hasGradient && 'ring-2 ring-offset-2 ring-primary')}
                                        style={{ backgroundColor: c }}
                                        onClick={() => handleColorChange(cat.id, c)}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>

                          {/* Name & service count */}
                          <div className="flex-1 min-w-0">
                            <p className={cn(tokens.body.emphasis, 'truncate', isEmpty && 'text-muted-foreground')}>{cat.category_name}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              {isEmpty 
                                ? <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-destructive/15 text-destructive border border-destructive/25">No services</span>
                                : <p className={tokens.body.muted}>{serviceCount} service{serviceCount !== 1 ? 's' : ''}</p>
                              }
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                              setCategoryDialogMode('rename');
                              setEditingCategory(cat);
                              setCategoryDialogOpen(true);
                            }}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => {
                              setDeleteCategoryId(cat.id);
                              setDeleteCategoryName(cat.category_name);
                            }}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </SortableCategoryRow>
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>

        {/* Services Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scissors className="w-5 h-5 text-primary" />
                <CardTitle className={tokens.heading.section}>SERVICES</CardTitle>
              </div>
              <Button size={tokens.button.card} onClick={() => openCreateService()}>
                <Plus className="w-4 h-4 mr-1" /> Add Service
              </Button>
            </div>
            <CardDescription>Manage individual services within each category.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search */}
            {(allServices?.length || 0) > 5 && (
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                  autoCapitalize="off"
                />
              </div>
            )}

            {localOrder.length === 0 ? (
              <div className={tokens.empty.container}>
                <Scissors className={tokens.empty.icon} />
                <h3 className={tokens.empty.heading}>No services yet</h3>
                <p className={tokens.empty.description}>Create categories first, then add services.</p>
              </div>
            ) : (
              <Accordion
                type="multiple"
                className="w-full"
                {...(searchExpandedValues ? { value: searchExpandedValues } : {})}
              >
                {localOrder.map((cat) => {
                  const services = filteredServicesByCategory[cat.category_name] || [];
                  const totalServices = servicesByCategory[cat.category_name]?.length || 0;
                  const abbr = getCategoryAbbreviation(cat.category_name);
                  const hasGradient = isGradientMarker(cat.color_hex);
                  const gradient = hasGradient ? getGradientFromMarker(cat.color_hex) : null;

                  // Hide categories with no matching services when searching
                  if (searchQuery.trim() && services.length === 0) return null;

                  return (
                    <AccordionItem key={cat.id} value={cat.id} className="border rounded-lg mb-2 px-4">
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-sans font-medium tracking-normal shrink-0"
style={gradient ? { background: gradient.background, color: gradient.textColor, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)' } : { backgroundColor: cat.color_hex, color: cat.text_color_hex }}
                          >
                            {abbr}
                          </div>
                          <span className={cn(tokens.body.emphasis, 'tracking-normal')}>{cat.category_name}</span>
                          <span className={cn(tokens.body.muted, 'tracking-normal')}>
                            ({searchQuery.trim() ? `${services.length}/${totalServices}` : totalServices})
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-1 pb-2">
                          {services.length === 0 ? (
                            <p className={cn(tokens.empty.description, 'text-center py-4')}>No services in this category</p>
                          ) : (
                            services.map(svc => {
                              const margin = computeMargin(svc.price || 0, svc.cost);
                              return (
                                <div key={svc.id} className="flex items-center gap-3 p-2.5 rounded-md hover:bg-muted/40 transition-colors group cursor-pointer" onClick={() => openEditService(svc)}>
                                  <div className="flex-1 min-w-0">
                                    <p className={cn(tokens.body.emphasis, 'truncate')}>{svc.name}</p>
                                    <div className={cn('flex items-center gap-3', tokens.body.muted)}>
                                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{svc.duration_minutes}min</span>
                                      {svc.price != null && (
                                        <span className="flex items-center gap-1">
                                          <DollarSign className="w-3 h-3" />{formatCurrency(svc.price)}
                                        </span>
                                      )}
                                      <MarginBadge margin={margin} />
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div onClick={e => e.stopPropagation()}>
                                          <Switch
                                            checked={svc.is_active !== false}
                                            onCheckedChange={() => handleToggleActive(svc)}
                                            className="scale-75"
                                          />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent><p className="text-xs">{svc.is_active !== false ? 'Active' : 'Inactive'}</p></TooltipContent>
                                    </Tooltip>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteServiceId(svc.id);
                                      setDeleteServiceName(svc.name);
                                    }}>
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                          <Button
                            variant="ghost"
                            size={tokens.button.inline}
                            className="w-full mt-1 text-xs text-muted-foreground"
                            onClick={() => openCreateService(cat.category_name)}
                          >
                            <Plus className="w-3 h-3 mr-1" /> Add service to {cat.category_name}
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </CardContent>
        </Card>

        </div>{/* end row 1 grid */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Service Add-Ons & Extras Library */}
        {resolvedOrgId && <ServiceAddonsLibrary organizationId={resolvedOrgId} categories={localOrder} />}

        {/* Booking Add-On Recommendations (assignments) */}
        {resolvedOrgId && (
          <ServiceAddonAssignmentsCard
            organizationId={resolvedOrgId}
            categories={localOrder}
            servicesByCategory={servicesByCategory}
          />
        )}
        </div>{/* end row 2 grid */}

        {/* Unified Service Editor Dialog (create + edit) */}
        <ServiceEditorDialog
          open={editorDialogOpen}
          onOpenChange={setEditorDialogOpen}
          onSubmit={handleEditorSubmit}
          isPending={createService.isPending || updateService.isPending}
          categories={serviceCategories}
          initialData={editorService}
          mode={editorMode}
          presetCategory={editorPresetCategory}
        />

        {/* Category Form Dialog */}
        <CategoryFormDialog
          open={categoryDialogOpen}
          onOpenChange={setCategoryDialogOpen}
          onSubmit={categoryDialogMode === 'create' ? handleCreateCategory : handleRenameCategory}
          isPending={createCategory.isPending || renameCategory.isPending}
          initialName={editingCategory?.category_name}
          mode={categoryDialogMode}
          existingCategories={serviceCategories.map(c => c.category_name)}
        />

        {/* Delete category confirmation */}
        <AlertDialog open={!!deleteCategoryId} onOpenChange={(open) => { if (!open) setDeleteCategoryId(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete "{deleteCategoryName}"?</AlertDialogTitle>
              <AlertDialogDescription>
                {(servicesByCategory[deleteCategoryName]?.length || 0) > 0
                  ? `This category has ${servicesByCategory[deleteCategoryName]?.length} services. They will become uncategorized.`
                  : 'This category has no services and will be permanently removed.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteCategory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete service confirmation */}
        <AlertDialog open={!!deleteServiceId} onOpenChange={(open) => { if (!open) { setDeleteServiceId(null); setDeleteServiceName(''); } }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete "{deleteServiceName}"?</AlertDialogTitle>
              <AlertDialogDescription>
                This will deactivate the service and remove it from your menu. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteService} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
