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
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  useWebsiteSections,
  useUpdateWebsiteSections,
  SECTION_LABELS,
  SECTION_DESCRIPTIONS,
  type HomepageSections,
  type SectionConfig,
} from '@/hooks/useWebsiteSections';
import { SectionNavItem } from './SectionNavItem';
import { SectionGroupHeader } from './SectionGroupHeader';
import { WebsiteEditorSearch } from './WebsiteEditorSearch';

type SectionKey = keyof HomepageSections;

interface SectionItem {
  key: SectionKey;
  config: SectionConfig;
}

// Section groupings for logical organization
const SECTION_GROUPS: { title: string; sections: SectionKey[] }[] = [
  {
    title: 'Above the Fold',
    sections: ['hero', 'brand_statement'],
  },
  {
    title: 'Social Proof',
    sections: ['testimonials', 'brands'],
  },
  {
    title: 'Services & Portfolio',
    sections: ['services_preview', 'popular_services', 'extensions', 'gallery'],
  },
  {
    title: 'Conversion',
    sections: ['new_client', 'faq'],
  },
  {
    title: 'Team & Locations',
    sections: ['stylists', 'locations', 'drink_menu'],
  },
];

// Map section keys to tab values
const SECTION_TO_TAB: Record<SectionKey, string> = {
  hero: 'hero',
  brand_statement: 'brand',
  testimonials: 'testimonials',
  services_preview: 'services',
  popular_services: 'services',
  gallery: 'gallery',
  new_client: 'new-client',
  stylists: 'stylists',
  locations: 'locations',
  faq: 'faq',
  extensions: 'extensions',
  brands: 'brands',
  drink_menu: 'drinks',
};

interface WebsiteEditorSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed?: boolean;
}

export function WebsiteEditorSidebar({
  activeTab,
  onTabChange,
  collapsed = false,
}: WebsiteEditorSidebarProps) {
  const { data: sectionsConfig, isLoading } = useWebsiteSections();
  const updateSections = useUpdateWebsiteSections();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const orderedSections = useMemo<SectionItem[]>(() => {
    if (!sectionsConfig?.homepage) return [];
    return Object.entries(sectionsConfig.homepage)
      .map(([key, config]) => ({ key: key as SectionKey, config }))
      .sort((a, b) => a.config.order - b.config.order);
  }, [sectionsConfig]);

  const [localSections, setLocalSections] = useState<SectionItem[]>([]);

  useEffect(() => {
    if (orderedSections.length > 0) {
      setLocalSections(orderedSections);
    }
  }, [orderedSections]);

  const handleToggleSection = async (sectionKey: SectionKey, enabled: boolean) => {
    if (!sectionsConfig) return;

    const updatedSections = {
      ...sectionsConfig,
      homepage: {
        ...sectionsConfig.homepage,
        [sectionKey]: {
          ...sectionsConfig.homepage[sectionKey],
          enabled,
        },
      },
    };

    setLocalSections(prev =>
      prev.map(s => s.key === sectionKey ? { ...s, config: { ...s.config, enabled } } : s)
    );

    try {
      await updateSections.mutateAsync(updatedSections);
      toast.success(`${SECTION_LABELS[sectionKey]} ${enabled ? 'enabled' : 'disabled'}`);
    } catch {
      toast.error('Failed to update section');
      setLocalSections(orderedSections);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !sectionsConfig) return;

    const oldIndex = localSections.findIndex(s => s.key === active.id);
    const newIndex = localSections.findIndex(s => s.key === over.id);

    const reordered = arrayMove(localSections, oldIndex, newIndex);
    setLocalSections(reordered);

    // Save new order
    const updatedHomepage = reordered.reduce((acc, item, index) => {
      acc[item.key] = {
        ...item.config,
        order: index + 1,
      };
      return acc;
    }, {} as HomepageSections);

    try {
      await updateSections.mutateAsync({
        ...sectionsConfig,
        homepage: updatedHomepage,
      });
      toast.success('Section order updated');
    } catch {
      toast.error('Failed to save order');
      setLocalSections(orderedSections);
    }
  };

  const getSectionOrder = (key: SectionKey): number => {
    const section = localSections.find(s => s.key === key);
    return section?.config.order ?? 0;
  };

  const getSectionEnabled = (key: SectionKey): boolean => {
    const section = localSections.find(s => s.key === key);
    return section?.config.enabled ?? true;
  };

  if (collapsed) {
    return null;
  }

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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localSections.map(s => s.key)}
            strategy={verticalListSortingStrategy}
          >
            <div className="py-2">
              {SECTION_GROUPS.map((group, groupIndex) => (
                <div key={group.title}>
                  {groupIndex > 0 && <Separator className="my-2 mx-3" />}
                  <SectionGroupHeader title={group.title} />
                  {group.sections.map(sectionKey => (
                    <SectionNavItem
                      key={sectionKey}
                      id={sectionKey}
                      label={SECTION_LABELS[sectionKey]}
                      description={SECTION_DESCRIPTIONS[sectionKey]}
                      order={getSectionOrder(sectionKey)}
                      enabled={getSectionEnabled(sectionKey)}
                      isActive={activeTab === SECTION_TO_TAB[sectionKey]}
                      onSelect={() => onTabChange(SECTION_TO_TAB[sectionKey])}
                      onToggle={(enabled) => handleToggleSection(sectionKey, enabled)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </ScrollArea>

      {/* Stats Footer */}
      <div className="p-3 border-t bg-muted/30">
        <div className="text-[10px] text-muted-foreground text-center">
          {localSections.filter(s => s.config.enabled).length}/{localSections.length} sections visible
        </div>
      </div>
    </div>
  );
}
