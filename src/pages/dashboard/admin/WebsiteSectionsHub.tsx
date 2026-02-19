import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  LayoutGrid,
  ExternalLink,
  PanelLeftClose,
  PanelLeftOpen,
  Loader2,
  Save,
  Undo2,
  Redo2,
} from 'lucide-react';
import { toast } from 'sonner';
import { HeroEditor } from '@/components/dashboard/website-editor/HeroEditor';
import { BrandStatementEditor } from '@/components/dashboard/website-editor/BrandStatementEditor';
import { NewClientEditor } from '@/components/dashboard/website-editor/NewClientEditor';
import { TestimonialsEditor } from '@/components/dashboard/website-editor/TestimonialsEditor';
import { ExtensionsEditor } from '@/components/dashboard/website-editor/ExtensionsEditor';
import { FAQEditor } from '@/components/dashboard/website-editor/FAQEditor';
import { BrandsManager } from '@/components/dashboard/website-editor/BrandsManager';
import { DrinksManager } from '@/components/dashboard/website-editor/DrinksManager';
import { FooterCTAEditor } from '@/components/dashboard/website-editor/FooterCTAEditor';
import { FooterEditor } from '@/components/dashboard/website-editor/FooterEditor';
import { ServicesPreviewEditor } from '@/components/dashboard/website-editor/ServicesPreviewEditor';
import { PopularServicesEditor } from '@/components/dashboard/website-editor/PopularServicesEditor';
import { GalleryDisplayEditor } from '@/components/dashboard/website-editor/GalleryDisplayEditor';
import { StylistsDisplayEditor } from '@/components/dashboard/website-editor/StylistsDisplayEditor';
import { LocationsDisplayEditor } from '@/components/dashboard/website-editor/LocationsDisplayEditor';
import { CustomSectionEditor } from '@/components/dashboard/website-editor/CustomSectionEditor';
// Embedded Content Components
import { TestimonialsContent } from '@/components/dashboard/website-editor/TestimonialsContent';
import { GalleryContent } from '@/components/dashboard/website-editor/GalleryContent';
import { StylistsContent } from '@/components/dashboard/website-editor/StylistsContent';
import { LocationsContent } from '@/components/dashboard/website-editor/LocationsContent';
import { ServicesContent } from '@/components/dashboard/website-editor/ServicesContent';
import { AnnouncementBarContent } from '@/components/dashboard/website-editor/AnnouncementBarContent';

// Multi-page components
import { PageSettingsEditor } from '@/components/dashboard/website-editor/PageSettingsEditor';
import { PageTemplatePicker } from '@/components/dashboard/website-editor/PageTemplatePicker';

// Sidebar Navigation
import { WebsiteEditorSidebar } from '@/components/dashboard/website-editor/WebsiteEditorSidebar';
// Live Preview
import { LivePreviewPanel, triggerPreviewRefresh } from '@/components/dashboard/website-editor/LivePreviewPanel';

// Undo/Redo
import { useUndoRedo } from '@/hooks/useUndoRedo';
import {
  useWebsiteSections,
  useUpdateWebsiteSections,
  type SectionConfig,
  type BuiltinSectionType,
  type CustomSectionType,
} from '@/hooks/useWebsiteSections';
import {
  useWebsitePages,
  useUpdateWebsitePages,
  type PageConfig,
  generatePageId,
} from '@/hooks/useWebsitePages';
import { SectionStyleEditor } from '@/components/dashboard/website-editor/SectionStyleEditor';
import type { PageTemplate } from '@/data/page-templates';
import { generateSectionId, CUSTOM_TYPE_INFO } from '@/hooks/useWebsiteSections';

// Unsaved changes dialog
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

// Layout Components
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { useIsMobile } from '@/hooks/use-mobile';

// Map of tab values to editor components (built-in)
const EDITOR_COMPONENTS: Record<string, React.ComponentType> = {
  // Site Content (Data Managers)
  'services': ServicesContent,
  'testimonials': TestimonialsContent,
  'gallery': GalleryContent,
  'stylists': StylistsContent,
  'locations': LocationsContent,
  'banner': AnnouncementBarContent,
  
  // Homepage Section Editors
  'hero': HeroEditor,
  'brand': BrandStatementEditor,
  'testimonials-section': TestimonialsEditor,
  'services-preview': ServicesPreviewEditor,
  'popular-services': PopularServicesEditor,
  'gallery-section': GalleryDisplayEditor,
  'new-client': NewClientEditor,
  'stylists-section': StylistsDisplayEditor,
  'locations-section': LocationsDisplayEditor,
  'extensions': ExtensionsEditor,
  'faq': FAQEditor,
  'brands': BrandsManager,
  'drinks': DrinksManager,
  'footer-cta': FooterCTAEditor,
  'footer': FooterEditor,
};

// Map editor tabs to homepage section IDs for scroll-to-section
const TAB_TO_SECTION: Record<string, string> = {
  'hero': 'hero',
  'brand': 'brand_statement',
  'testimonials-section': 'testimonials',
  'services-preview': 'services_preview',
  'popular-services': 'popular_services',
  'gallery-section': 'gallery',
  'new-client': 'new_client',
  'stylists-section': 'stylists',
  'locations-section': 'locations',
  'faq': 'faq',
  'extensions': 'extensions',
  'brands': 'brands',
  'drinks': 'drink_menu',
};

// Tab labels for breadcrumb display
const TAB_LABELS: Record<string, string> = {
  'services': 'Services Manager',
  'testimonials': 'Testimonials Manager',
  'gallery': 'Gallery Manager',
  'stylists': 'Stylists Manager',
  'locations': 'Locations Manager',
  'banner': 'Announcement Banner',
  'hero': 'Hero Section',
  'brand': 'Brand Statement',
  'testimonials-section': 'Testimonials Display',
  'services-preview': 'Services Preview',
  'popular-services': 'Popular Services',
  'gallery-section': 'Gallery Display',
  'new-client': 'New Client CTA',
  'stylists-section': 'Stylists Display',
  'locations-section': 'Locations Display',
  'extensions': 'Extensions Spotlight',
  'faq': 'FAQ',
  'brands': 'Partner Brands',
  'drinks': 'Drink Menu',
  'footer-cta': 'Footer CTA',
  'footer': 'Footer Settings',
  'page-settings': 'Page Settings',
};

export default function WebsiteSectionsHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { effectiveOrganization, currentOrganization, selectedOrganization } = useOrganizationContext();
  const contextSlug = effectiveOrganization?.slug || selectedOrganization?.slug || currentOrganization?.slug;

  const { data: fallbackSlug } = useQuery({
    queryKey: ['website-editor-org-slug-fallback'],
    queryFn: async () => {
      const { data } = await supabase
        .from('organizations')
        .select('slug')
        .limit(1)
        .single();
      return data?.slug ?? null;
    },
    enabled: !contextSlug,
  });

  const orgSlug = contextSlug || fallbackSlug;
  const defaultTab = searchParams.get('tab') || 'hero';
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [showSidebar, setShowSidebar] = useState(true);
  
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const isDirtyRef = useRef(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const dirtyToastShownRef = useRef(false);
  const isMobile = useIsMobile();

  // Multi-page state
  const [selectedPageId, setSelectedPageId] = useState('home');
  const { data: pagesConfig } = useWebsitePages();
  const updatePages = useUpdateWebsitePages();
  const selectedPage = useMemo(() => {
    return pagesConfig?.pages.find(p => p.id === selectedPageId);
  }, [pagesConfig, selectedPageId]);

  // Page template picker
  const [showPageTemplatePicker, setShowPageTemplatePicker] = useState(false);

  // Compute preview URL based on selected page
  const previewUrl = useMemo(() => {
    if (!orgSlug) return '/?preview=true';
    if (selectedPageId === 'home' || !selectedPage?.slug) {
      return `/org/${orgSlug}?preview=true`;
    }
    return `/org/${orgSlug}/${selectedPage.slug}?preview=true`;
  }, [orgSlug, selectedPageId, selectedPage]);

  // Undo/Redo for layout changes
  const { data: sectionsConfig } = useWebsiteSections();
  const updateSections = useUpdateWebsiteSections();
  const {
    state: undoState,
    setState: pushUndoState,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoRedo<SectionConfig[] | null>(null);

  // Initialize undo state when sections load
  const initializedRef = useRef(false);
  useEffect(() => {
    if (sectionsConfig?.homepage && !initializedRef.current) {
      pushUndoState([...sectionsConfig.homepage].sort((a, b) => a.order - b.order), true);
      initializedRef.current = true;
    }
  }, [sectionsConfig, pushUndoState]);

  // Track layout changes from sidebar
  const handleSectionsChange = useCallback((sections: SectionConfig[]) => {
    pushUndoState(sections);
  }, [pushUndoState]);

  const handleUndo = useCallback(async () => {
    const prev = undo();
    if (prev) {
      try {
        await updateSections.mutateAsync({ homepage: prev });
        toast.success('Undone');
      } catch {
        toast.error('Failed to undo');
      }
    }
  }, [undo, updateSections]);

  const handleRedo = useCallback(async () => {
    const next = redo();
    if (next) {
      try {
        await updateSections.mutateAsync({ homepage: next });
        toast.success('Redone');
      } catch {
        toast.error('Failed to redo');
      }
    }
  }, [redo, updateSections]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleUndo, handleRedo]);

  const activeSectionId = useMemo(() => {
    if (activeTab.startsWith('custom-')) {
      return activeTab.replace('custom-', '');
    }
    return TAB_TO_SECTION[activeTab];
  }, [activeTab]);

  // Dirty state tracking
  useEffect(() => {
    const handleDirtyChange = (e: Event) => {
      const dirty = (e as CustomEvent).detail?.dirty ?? false;
      isDirtyRef.current = dirty;
      setIsDirty(dirty);
      if (dirty && !dirtyToastShownRef.current) {
        dirtyToastShownRef.current = true;
        toast.warning('You have unsaved changes', { duration: 4000 });
      }
      if (!dirty) dirtyToastShownRef.current = false;
    };

    const handleSavingState = (e: Event) => {
      setIsSaving((e as CustomEvent).detail?.saving ?? false);
    };

    window.addEventListener('editor-dirty-state', handleDirtyChange);
    window.addEventListener('editor-saving-state', handleSavingState);

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) e.preventDefault();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('editor-dirty-state', handleDirtyChange);
      window.removeEventListener('editor-saving-state', handleSavingState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    setSearchParams({ tab: activeTab }, { replace: true });
  }, [activeTab, setSearchParams]);

  const handleTabChange = useCallback((tab: string) => {
    if (isDirtyRef.current) {
      setPendingTab(tab);
      setShowUnsavedDialog(true);
    } else {
      setActiveTab(tab);
    }
  }, []);

  const handleDiscardAndSwitch = () => {
    isDirtyRef.current = false;
    window.dispatchEvent(new CustomEvent('editor-dirty-state', { detail: { dirty: false } }));
    setShowUnsavedDialog(false);
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
  };

  const triggerSave = useCallback(() => {
    window.dispatchEvent(new CustomEvent('editor-save-request'));
  }, []);

  // Debounced style override saves
  const styleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleStyleOverrideChange = useCallback((sectionId: string, overrides: Record<string, unknown>) => {
    if (!sectionsConfig) return;
    
    // Optimistic local update (applied immediately for UI responsiveness)
    const newSections = sectionsConfig.homepage.map(s =>
      s.id === sectionId ? { ...s, style_overrides: overrides } : s
    );
    
    // Debounce the actual DB save
    if (styleDebounceRef.current) clearTimeout(styleDebounceRef.current);
    styleDebounceRef.current = setTimeout(async () => {
      try {
        await updateSections.mutateAsync({ homepage: newSections });
        triggerPreviewRefresh();
      } catch {
        toast.error('Failed to save style');
      }
    }, 500);
  }, [sectionsConfig, updateSections]);

  // Page management handlers
  const handlePageChange = useCallback((pageId: string) => {
    setSelectedPageId(pageId);
    // Reset to first section or page-settings when switching pages
    if (pageId !== 'home') {
      setActiveTab('page-settings');
    } else {
      setActiveTab('hero');
    }
  }, []);

  const handleAddPage = useCallback(async () => {
    if (!pagesConfig) return;
    const newPage: PageConfig = {
      id: generatePageId(),
      slug: `page-${Date.now().toString(36)}`,
      title: 'New Page',
      seo_title: '',
      seo_description: '',
      enabled: true,
      show_in_nav: true,
      nav_order: pagesConfig.pages.length,
      sections: [
        {
          id: generateSectionId(),
          type: 'rich_text',
          label: 'Content',
          description: 'Main content block',
          enabled: true,
          order: 1,
          deletable: true,
        },
      ],
      page_type: 'custom',
      deletable: true,
    };
    const updated = { pages: [...pagesConfig.pages, newPage] };
    try {
      await updatePages.mutateAsync(updated);
      toast.success('Page created');
      setSelectedPageId(newPage.id);
      setActiveTab('page-settings');
    } catch {
      toast.error('Failed to create page');
    }
  }, [pagesConfig, updatePages]);

  const handleDeletePage = useCallback(async (pageId: string) => {
    if (!pagesConfig) return;
    const page = pagesConfig.pages.find(p => p.id === pageId);
    if (!page?.deletable) {
      toast.error('This page cannot be deleted');
      return;
    }
    const updated = { pages: pagesConfig.pages.filter(p => p.id !== pageId) };
    try {
      await updatePages.mutateAsync(updated);
      toast.success(`"${page.title}" deleted`);
      setSelectedPageId('home');
      setActiveTab('hero');
    } catch {
      toast.error('Failed to delete page');
    }
  }, [pagesConfig, updatePages]);

  const handleUpdatePageSettings = useCallback(async (updatedPage: PageConfig) => {
    if (!pagesConfig) return;
    const updated = {
      pages: pagesConfig.pages.map(p => p.id === updatedPage.id ? updatedPage : p),
    };
    await updatePages.mutateAsync(updated);
  }, [pagesConfig, updatePages]);

  const handleApplyPageTemplate = useCallback(async (template: PageTemplate) => {
    if (!pagesConfig || !selectedPage) return;
    const newSections: SectionConfig[] = template.sections.map((ts, i) => ({
      id: generateSectionId(),
      type: ts.type,
      label: ts.label,
      description: CUSTOM_TYPE_INFO[ts.type]?.description ?? '',
      enabled: true,
      order: i + 1,
      deletable: true,
    }));

    const updated = {
      pages: pagesConfig.pages.map(p =>
        p.id === selectedPageId ? { ...p, sections: newSections } : p
      ),
    };

    try {
      await updatePages.mutateAsync(updated);
      // Save template configs for each section
      const { data: { user } } = await supabase.auth.getUser();
      for (let i = 0; i < template.sections.length; i++) {
        const ts = template.sections[i];
        const settingsKey = `section_custom_${newSections[i].id}`;
        await supabase.from('site_settings').upsert({
          id: settingsKey,
          value: ts.config as never,
          updated_by: user?.id,
        });
      }
      toast.success(`"${template.name}" template applied`);
    } catch {
      toast.error('Failed to apply template');
    }
  }, [pagesConfig, selectedPage, selectedPageId, updatePages]);

  // Determine editor component
  const renderEditor = () => {
    // Page settings tab
    if (activeTab === 'page-settings' && selectedPage) {
      return (
        <PageSettingsEditor
          page={selectedPage}
          allPages={pagesConfig ?? undefined}
          onUpdate={handleUpdatePageSettings}
        />
      );
    }

    // Check built-in editors first
    const EditorComponent = EDITOR_COMPONENTS[activeTab];
    if (EditorComponent) {
      // Find the section to get its style overrides
      const sectionId = TAB_TO_SECTION[activeTab];
      const section = sectionId ? sectionsConfig?.homepage.find(s => s.id === sectionId) : null;
      
      return (
        <div className="space-y-4">
          <EditorComponent />
          {section && (
            <SectionStyleEditor
              value={section.style_overrides ?? {}}
              onChange={(overrides) => handleStyleOverrideChange(section.id, overrides)}
              sectionId={section.id}
            />
          )}
        </div>
      );
    }

    // Check if it's a custom section
    if (activeTab.startsWith('custom-')) {
      const sectionId = activeTab.replace('custom-', '');
      const section = sectionsConfig?.homepage.find(s => s.id === sectionId);
      if (section) {
        return (
          <CustomSectionEditor
            sectionId={section.id}
            sectionType={section.type as CustomSectionType}
            sectionLabel={section.label}
            styleOverrides={section.style_overrides}
            onStyleChange={(overrides) => handleStyleOverrideChange(section.id, overrides)}
          />
        );
      }
    }

    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Select a section from the sidebar to edit
      </div>
    );
  };

  // Get tab label (including custom sections)
  const getTabLabel = () => {
    if (TAB_LABELS[activeTab]) return TAB_LABELS[activeTab];
    if (activeTab.startsWith('custom-')) {
      const sectionId = activeTab.replace('custom-', '');
      const section = sectionsConfig?.homepage.find(s => s.id === sectionId);
      return section?.label ?? 'Custom Section';
    }
    return 'Select a section';
  };

  return (
    <DashboardLayout hideFooter>
      <div className="h-[calc(100vh-8rem)] flex">
        {/* Fixed-width Sidebar */}
        {!isMobile && showSidebar && (
          <div className="w-[380px] flex-shrink-0 border-r overflow-auto">
            <WebsiteEditorSidebar
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onSectionsChange={handleSectionsChange}
              selectedPageId={selectedPageId}
              onPageChange={handlePageChange}
              onAddPage={handleAddPage}
              onDeletePage={handleDeletePage}
              onApplyPageTemplate={() => setShowPageTemplatePicker(true)}
            />
          </div>
        )}

        {/* Mobile floating drawer trigger */}
        {isMobile && (
          <Button
            variant="default"
            size="sm"
            className="fixed bottom-20 right-4 z-50 rounded-full shadow-lg h-12 w-12 p-0"
            onClick={() => setShowSidebar(prev => !prev)}
          >
            <LayoutGrid className="h-5 w-5" />
          </Button>
        )}

        {/* Mobile sidebar drawer */}
        {isMobile && showSidebar && (
          <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={() => setShowSidebar(false)}>
            <div
              className="absolute left-0 top-0 bottom-0 w-[320px] bg-background border-r shadow-xl overflow-auto"
              onClick={e => e.stopPropagation()}
            >
              <WebsiteEditorSidebar
                activeTab={activeTab}
                onTabChange={(tab) => { handleTabChange(tab); setShowSidebar(false); }}
                onSectionsChange={handleSectionsChange}
                selectedPageId={selectedPageId}
                onPageChange={handlePageChange}
                onAddPage={handleAddPage}
                onDeletePage={handleDeletePage}
                onApplyPageTemplate={() => setShowPageTemplatePicker(true)}
              />
            </div>
          </div>
        )}

        {/* Resizable Editor + Preview */}
        <ResizablePanelGroup direction="horizontal" className="h-full flex-1">
          {/* Main Editor Panel */}
          <ResizablePanel defaultSize={isMobile ? 100 : 55} minSize={30}>
            <div className="h-full flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex-shrink-0 px-6 py-4 border-b bg-background">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      {!isMobile && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowSidebar(prev => !prev)}
                          className="h-8 w-8"
                        >
                          {showSidebar ? (
                            <PanelLeftClose className="h-4 w-4" />
                          ) : (
                            <PanelLeftOpen className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
                        <LayoutGrid className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h1 className="text-xl font-display font-medium">Website Editor</h1>
                        <p className="text-xs text-muted-foreground">
                          {selectedPage && selectedPageId !== 'home' ? `${selectedPage.title} › ` : ''}
                          {getTabLabel()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Undo/Redo */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={!canUndo}
                          onClick={handleUndo}
                        >
                          <Undo2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Undo (⌘Z)</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={!canRedo}
                          onClick={handleRedo}
                        >
                          <Redo2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Redo (⌘⇧Z)</TooltipContent>
                    </Tooltip>

                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open('/', '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Site
                    </Button>
                  </div>
                </div>
              </div>

              {/* Editor Content */}
              <div className="flex-1 overflow-auto p-6 pb-20">
                {renderEditor()}
              </div>

              {/* Fixed Bottom Save Bar */}
              <div className="flex-shrink-0 px-6 py-3 border-t bg-background/80 backdrop-blur flex items-center justify-end gap-3">
                {isDirty && (
                  <span className="text-sm text-amber-600 dark:text-amber-400">Unsaved changes</span>
                )}
                <Button onClick={triggerSave} disabled={!isDirty || isSaving} size="sm">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save & Publish Changes
                </Button>
              </div>
            </div>
          </ResizablePanel>

          {/* Live Preview Panel */}
          {!isMobile && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={45} minSize={20} collapsible collapsedSize={0}>
                <LivePreviewPanel activeSectionId={activeSectionId} previewUrl={previewUrl} />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>

        {/* Unsaved Changes Dialog */}
        <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
              <AlertDialogDescription>
                You have unsaved changes that will be lost if you switch sections. Do you want to discard them?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setShowUnsavedDialog(false); setPendingTab(null); }}>
                Stay & Keep Editing
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDiscardAndSwitch}>
                Discard & Switch
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Page Template Picker */}
        <PageTemplatePicker
          open={showPageTemplatePicker}
          onOpenChange={setShowPageTemplatePicker}
          onSelect={handleApplyPageTemplate}
        />
      </div>
    </DashboardLayout>
  );
}
