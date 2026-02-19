import { useMemo, useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { supabase } from '@/integrations/supabase/client';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Scissors,
  MessageSquareQuote,
  Images,
  Users,
  MapPin,
  Megaphone,
  MousePointerClick,
  PanelBottom,
  Plus,
  Trash2,
  Copy,
} from 'lucide-react';
import {
  useWebsiteSections,
  useUpdateWebsiteSections,
  SECTION_LABELS,
  SECTION_DESCRIPTIONS,
  isBuiltinSection,
  generateSectionId,
  CUSTOM_TYPE_INFO,
  type SectionConfig,
  type BuiltinSectionType,
  type CustomSectionType,
} from '@/hooks/useWebsiteSections';
import { SectionNavItem } from './SectionNavItem';
import { SectionGroupHeader } from './SectionGroupHeader';
import { ContentNavItem } from './ContentNavItem';
import { WebsiteEditorSearch } from './WebsiteEditorSearch';
import { AddSectionDialog } from './AddSectionDialog';
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

// Site Content items (data managers - not part of homepage ordering)
const SITE_CONTENT_ITEMS = [
  { tab: 'banner', label: 'Announcement Bar', description: 'Site-wide banner', icon: Megaphone },
  { tab: 'services', label: 'Services', description: 'Manage service catalog', icon: Scissors },
  { tab: 'testimonials', label: 'Testimonials', description: 'Manage client reviews', icon: MessageSquareQuote },
  { tab: 'gallery', label: 'Gallery', description: 'Manage portfolio images', icon: Images },
  { tab: 'stylists', label: 'Stylists', description: 'Manage team profiles', icon: Users },
  { tab: 'locations', label: 'Locations', description: 'Manage salon locations', icon: MapPin },
  { tab: 'footer-cta', label: 'Footer CTA', description: 'Pre-footer call to action', icon: MousePointerClick },
  { tab: 'footer', label: 'Footer', description: 'Footer links, social & copyright', icon: PanelBottom },
];

// Map built-in section IDs to UNIQUE tab values
const BUILTIN_SECTION_TO_TAB: Record<BuiltinSectionType, string> = {
  hero: 'hero',
  brand_statement: 'brand',
  testimonials: 'testimonials-section',
  services_preview: 'services-preview',
  popular_services: 'popular-services',
  gallery: 'gallery-section',
  new_client: 'new-client',
  stylists: 'stylists-section',
  locations: 'locations-section',
  faq: 'faq',
  extensions: 'extensions',
  brands: 'brands',
  drink_menu: 'drinks',
};

function getSectionTab(section: SectionConfig): string {
  if (isBuiltinSection(section.type)) {
    return BUILTIN_SECTION_TO_TAB[section.type];
  }
  return `custom-${section.id}`;
}

// Homepage section groupings for logical organization (built-in only)
const SECTION_GROUPS: { title: string; sectionTypes: BuiltinSectionType[] }[] = [
  { title: 'Above the Fold', sectionTypes: ['hero', 'brand_statement'] },
  { title: 'Social Proof', sectionTypes: ['testimonials', 'brands'] },
  { title: 'Services & Portfolio', sectionTypes: ['services_preview', 'popular_services', 'extensions', 'gallery'] },
  { title: 'Conversion', sectionTypes: ['new_client', 'faq'] },
  { title: 'Team & Extras', sectionTypes: ['stylists', 'locations', 'drink_menu'] },
];

interface WebsiteEditorSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed?: boolean;
  onSectionsChange?: (sections: SectionConfig[]) => void;
}

export function WebsiteEditorSidebar({
  activeTab,
  onTabChange,
  collapsed = false,
  onSectionsChange,
}: WebsiteEditorSidebarProps) {
  const { data: sectionsConfig, isLoading } = useWebsiteSections();
  const updateSections = useUpdateWebsiteSections();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SectionConfig | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const orderedSections = useMemo<SectionConfig[]>(() => {
    if (!sectionsConfig?.homepage) return [];
    return [...sectionsConfig.homepage].sort((a, b) => a.order - b.order);
  }, [sectionsConfig]);

  const [localSections, setLocalSections] = useState<SectionConfig[]>([]);

  useEffect(() => {
    if (orderedSections.length > 0) {
      setLocalSections(orderedSections);
    }
  }, [orderedSections]);

  const builtinSections = useMemo(() => localSections.filter(s => isBuiltinSection(s.type)), [localSections]);
  const customSections = useMemo(() => localSections.filter(s => !isBuiltinSection(s.type)), [localSections]);

  const saveSections = async (newSections: SectionConfig[]) => {
    if (!sectionsConfig) return;
    const reordered = newSections.map((s, i) => ({ ...s, order: i + 1 }));
    setLocalSections(reordered);
    onSectionsChange?.(reordered);
    try {
      await updateSections.mutateAsync({ homepage: reordered });
    } catch {
      toast.error('Failed to save');
      setLocalSections(orderedSections);
    }
  };

  const handleToggleSection = async (sectionId: string, enabled: boolean) => {
    const newSections = localSections.map(s =>
      s.id === sectionId ? { ...s, enabled } : s
    );
    setLocalSections(newSections);
    onSectionsChange?.(newSections);
    try {
      await updateSections.mutateAsync({ homepage: newSections });
      const label = newSections.find(s => s.id === sectionId)?.label ?? 'Section';
      toast.success(`${label} ${enabled ? 'enabled' : 'disabled'}`);
    } catch {
      toast.error('Failed to update section');
      setLocalSections(orderedSections);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localSections.findIndex(s => s.id === active.id);
    const newIndex = localSections.findIndex(s => s.id === over.id);
    const reordered = arrayMove(localSections, oldIndex, newIndex);
    await saveSections(reordered);
    toast.success('Section order updated');
  };

  const handleAddSection = async (type: CustomSectionType, label: string) => {
    const newSection: SectionConfig = {
      id: generateSectionId(),
      type,
      label,
      description: CUSTOM_TYPE_INFO[type].description,
      enabled: true,
      order: localSections.length + 1,
      deletable: true,
    };
    const newSections = [...localSections, newSection];
    await saveSections(newSections);
    toast.success(`"${label}" added`);
    onTabChange(`custom-${newSection.id}`);
  };

  const handleAddFromTemplate = async (template: import('@/data/section-templates').SectionTemplate) => {
    const newSection: SectionConfig = {
      id: generateSectionId(),
      type: template.section_type as CustomSectionType,
      label: template.name,
      description: template.description,
      enabled: true,
      order: localSections.length + 1,
      deletable: true,
      style_overrides: template.style_overrides,
    };
    const newSections = [...localSections, newSection];
    await saveSections(newSections);

    // Also save the template's default config as the section content
    const settingsKey = `section_custom_${newSection.id}`;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('site_settings').upsert({
      id: settingsKey,
      value: template.default_config as never,
      updated_by: user?.id,
    });

    toast.success(`"${template.name}" added from template`);
    onTabChange(`custom-${newSection.id}`);
  };

  const handleDeleteSection = async () => {
    if (!deleteTarget) return;
    const newSections = localSections.filter(s => s.id !== deleteTarget.id);
    await saveSections(newSections);
    
    // Clean up orphaned site_settings row for this custom section
    const settingsKey = `section_custom_${deleteTarget.id}`;
    supabase.from('site_settings').delete().eq('id', settingsKey).then(() => {
      // fire-and-forget cleanup
    });
    
    toast.success(`"${deleteTarget.label}" deleted`);
    setDeleteTarget(null);
    if (activeTab === `custom-${deleteTarget.id}` && newSections.length > 0) {
      onTabChange(getSectionTab(newSections[0]));
    }
  };

  const handleDuplicateSection = async (section: SectionConfig) => {
    const newId = generateSectionId();
    const newSection: SectionConfig = {
      ...section,
      id: newId,
      label: `${section.label} (Copy)`,
      order: localSections.length + 1,
      deletable: true,
    };
    const newSections = [...localSections, newSection];
    await saveSections(newSections);

    // Copy the custom section config if it exists
    const sourceKey = `section_custom_${section.id}`;
    const destKey = `section_custom_${newId}`;
    const { data: sourceConfig } = await supabase
      .from('site_settings')
      .select('value')
      .eq('id', sourceKey)
      .maybeSingle();
    if (sourceConfig?.value) {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('site_settings').upsert({
        id: destKey,
        value: sourceConfig.value as never,
        updated_by: user?.id,
      });
    }

    toast.success(`"${section.label}" duplicated`);
    onTabChange(`custom-${newId}`);
  };

  const getBuiltinSection = (type: BuiltinSectionType): SectionConfig | undefined => {
    return localSections.find(s => s.type === type);
  };

  if (collapsed) return null;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background border-r">
      {/* Search */}
      <div className="p-3 border-b">
        <WebsiteEditorSearch onSelectResult={onTabChange} />
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <div className="py-2">
          {/* Site Content Section */}
          <SectionGroupHeader title="Site Content" />
          <div className="space-y-0.5 mb-2">
            {SITE_CONTENT_ITEMS.map(item => (
              <ContentNavItem
                key={item.tab}
                label={item.label}
                description={item.description}
                icon={item.icon}
                isActive={activeTab === item.tab}
                onSelect={() => onTabChange(item.tab)}
              />
            ))}
          </div>

          <Separator className="my-3 mx-3" />

          {/* Homepage Sections (with DND) */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={localSections.map(s => s.id)} strategy={verticalListSortingStrategy}>
              <div className="mb-1">
                <p className="px-4 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Homepage Layout
                </p>
              </div>

              {/* Built-in section groups */}
              {SECTION_GROUPS.map((group, groupIndex) => {
                const groupSections = group.sectionTypes
                  .map(type => getBuiltinSection(type))
                  .filter(Boolean) as SectionConfig[];
                if (groupSections.length === 0) return null;
                return (
                  <div key={group.title}>
                    {groupIndex > 0 && <Separator className="my-2 mx-3" />}
                    <SectionGroupHeader title={group.title} />
                    {groupSections.map(section => (
                      <SectionNavItem
                        key={section.id}
                        id={section.id}
                        label={section.label}
                        description={section.description}
                        order={section.order}
                        enabled={section.enabled}
                        isActive={activeTab === getSectionTab(section)}
                        onSelect={() => onTabChange(getSectionTab(section))}
                        onToggle={(enabled) => handleToggleSection(section.id, enabled)}
                      />
                    ))}
                  </div>
                );
              })}

              {/* Custom sections */}
              {customSections.length > 0 && (
                <>
                  <Separator className="my-2 mx-3" />
                  <SectionGroupHeader title="Custom Sections" />
                  {customSections.map(section => (
                    <SectionNavItem
                      key={section.id}
                      id={section.id}
                      label={section.label}
                      description={section.description}
                      order={section.order}
                      enabled={section.enabled}
                      isActive={activeTab === `custom-${section.id}`}
                      onSelect={() => onTabChange(`custom-${section.id}`)}
                      onToggle={(enabled) => handleToggleSection(section.id, enabled)}
                      deletable
                      onDelete={() => setDeleteTarget(section)}
                      onDuplicate={() => handleDuplicateSection(section)}
                    />
                  ))}
                </>
              )}
            </SortableContext>
          </DndContext>

          {/* Add Section Button */}
          <div className="px-3 mt-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Section
            </Button>
          </div>
        </div>
      </ScrollArea>

      {/* Stats Footer */}
      <div className="p-3 border-t bg-muted/30">
        <div className="text-[10px] text-muted-foreground text-center">
          {localSections.filter(s => s.enabled).length}/{localSections.length} sections visible
        </div>
      </div>

      {/* Add Section Dialog */}
      <AddSectionDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAdd={handleAddSection}
        onAddFromTemplate={handleAddFromTemplate}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.label}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this section and its configuration. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSection} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
