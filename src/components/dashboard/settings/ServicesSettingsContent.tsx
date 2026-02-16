import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Loader2, Plus, Pencil, Trash2, GripVertical, Palette, Info, Clock, DollarSign, Scissors
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
import { ServiceFormDialog } from './ServiceFormDialog';
import { toast } from 'sonner';
import {
  getCategoryAbbreviation as getAbbr,
  SPECIAL_GRADIENTS,
  isGradientMarker,
  getGradientFromMarker,
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
  const { effectiveOrganization } = useOrganizationContext();
  const { data: categories, isLoading: catsLoading } = useServiceCategoryColors();
  const { data: allServices, isLoading: servicesLoading } = useServicesData(undefined, effectiveOrganization?.id);
  const updateColor = useUpdateCategoryColor();
  const reorderCategories = useReorderCategories();
  const createCategory = useCreateCategory();
  const renameCategory = useRenameCategory();
  const deleteCategory = useDeleteCategory();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  // Filter to service categories only (not Block/Break)
  const serviceCategories = useMemo(() => 
    categories?.filter(c => !['Block', 'Break'].includes(c.category_name)) || [],
  [categories]);

  const [localOrder, setLocalOrder] = useState<ServiceCategoryColor[]>([]);
  useEffect(() => { if (serviceCategories.length) setLocalOrder(serviceCategories); }, [serviceCategories]);

  // Group services by category
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
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [serviceDialogMode, setServiceDialogMode] = useState<'create' | 'edit'>('create');
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [presetCategory, setPresetCategory] = useState('');
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [deleteCategoryName, setDeleteCategoryName] = useState('');

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
    updateColor.mutate({ categoryId, colorHex }, {
      onSuccess: () => toast.success('Color updated'),
      onError: () => toast.error('Failed to update color'),
    });
  };

  const handleServiceSubmit = (service: Partial<Service>) => {
    if (serviceDialogMode === 'create') {
      createService.mutate(service, {
        onSuccess: () => { setServiceDialogOpen(false); },
        onError: () => {},
      });
    } else if (service.id) {
      const { id, ...updates } = service;
      updateService.mutate({ id, ...updates } as any, {
        onSuccess: () => { setServiceDialogOpen(false); setEditingService(null); },
        onError: () => {},
      });
    }
  };

  const handleToggleActive = (service: Service) => {
    updateService.mutate({ id: service.id, is_active: !service.is_active });
  };

  if (catsLoading || servicesLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Categories Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                <CardTitle className={tokens.heading.section}>SERVICE CATEGORIES</CardTitle>
              </div>
              <Button size="sm" onClick={() => { setCategoryDialogMode('create'); setEditingCategory(null); setCategoryDialogOpen(true); }}>
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

                      return (
                        <SortableCategoryRow key={cat.id} category={cat}>
                          {/* Color badge */}
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium shrink-0 transition-transform hover:scale-105 ring-2 ring-offset-2 ring-offset-background ring-transparent hover:ring-primary/50"
                                style={gradient ? { background: gradient.background, color: gradient.textColor } : { backgroundColor: cat.color_hex, color: cat.text_color_hex }}
                              >
                                {abbr}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-4" align="start">
                              <div className="space-y-3">
                                <p className={tokens.body.emphasis}>{cat.category_name}</p>
                                {/* Gradients */}
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
                                {/* Solid colors */}
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

                          {/* Name & controls */}
                          <div className="flex-1 min-w-0">
                            <p className={cn(tokens.body.emphasis, 'truncate')}>{cat.category_name}</p>
                            <p className={tokens.body.muted}>{serviceCount} service{serviceCount !== 1 ? 's' : ''}</p>
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
              <Button size="sm" onClick={() => {
                setServiceDialogMode('create');
                setEditingService(null);
                setPresetCategory(serviceCategories[0]?.category_name || '');
                setServiceDialogOpen(true);
              }}>
                <Plus className="w-4 h-4 mr-1" /> Add Service
              </Button>
            </div>
            <CardDescription>Manage individual services within each category.</CardDescription>
          </CardHeader>
          <CardContent>
            {localOrder.length === 0 ? (
              <div className={tokens.empty.container}>
                <Scissors className={tokens.empty.icon} />
                <h3 className={tokens.empty.heading}>No services yet</h3>
                <p className={tokens.empty.description}>Create categories first, then add services.</p>
              </div>
            ) : (
              <Accordion type="multiple" className="w-full">
                {localOrder.map((cat) => {
                  const services = servicesByCategory[cat.category_name] || [];
                  const abbr = getCategoryAbbreviation(cat.category_name);
                  const hasGradient = isGradientMarker(cat.color_hex);
                  const gradient = hasGradient ? getGradientFromMarker(cat.color_hex) : null;

                  return (
                    <AccordionItem key={cat.id} value={cat.id} className="border rounded-lg mb-2 px-4">
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0"
                            style={gradient ? { background: gradient.background, color: gradient.textColor } : { backgroundColor: cat.color_hex, color: cat.text_color_hex }}
                          >
                            {abbr}
                          </div>
                          <span className={tokens.body.emphasis}>{cat.category_name}</span>
                          <span className={tokens.body.muted}>({services.length})</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-1 pb-2">
                          {services.length === 0 ? (
                            <p className={cn(tokens.empty.description, 'text-center py-4')}>No services in this category</p>
                          ) : (
                            services.map(svc => (
                              <div key={svc.id} className="flex items-center gap-3 p-2.5 rounded-md hover:bg-muted/40 transition-colors group">
                                <div className="flex-1 min-w-0">
                                  <p className={cn(tokens.body.emphasis, 'truncate')}>{svc.name}</p>
                                  <div className={cn('flex items-center gap-3', tokens.body.muted)}>
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{svc.duration_minutes}min</span>
                                    {svc.price != null && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{svc.price.toFixed(2)}</span>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                                    setServiceDialogMode('edit');
                                    setEditingService(svc);
                                    setServiceDialogOpen(true);
                                  }}>
                                    <Pencil className="w-3 h-3" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteService.mutate(svc.id)}>
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            ))
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full mt-1 text-xs text-muted-foreground"
                            onClick={() => {
                              setServiceDialogMode('create');
                              setEditingService(null);
                              setPresetCategory(cat.category_name);
                              setServiceDialogOpen(true);
                            }}
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

        {/* Dialogs */}
        <CategoryFormDialog
          open={categoryDialogOpen}
          onOpenChange={setCategoryDialogOpen}
          onSubmit={categoryDialogMode === 'create' ? handleCreateCategory : handleRenameCategory}
          isPending={createCategory.isPending || renameCategory.isPending}
          initialName={editingCategory?.category_name}
          mode={categoryDialogMode}
        />

        <ServiceFormDialog
          open={serviceDialogOpen}
          onOpenChange={setServiceDialogOpen}
          onSubmit={handleServiceSubmit}
          isPending={createService.isPending || updateService.isPending}
          categories={serviceCategories}
          initialData={editingService}
          mode={serviceDialogMode}
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
      </div>
    </TooltipProvider>
  );
}
