import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  LayoutGrid,
  ExternalLink,
  PanelLeftClose,
  PanelLeftOpen,
  Eye
} from 'lucide-react';
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
// Embedded Content Components
import { TestimonialsContent } from '@/components/dashboard/website-editor/TestimonialsContent';
import { GalleryContent } from '@/components/dashboard/website-editor/GalleryContent';
import { StylistsContent } from '@/components/dashboard/website-editor/StylistsContent';
import { LocationsContent } from '@/components/dashboard/website-editor/LocationsContent';
import { ServicesContent } from '@/components/dashboard/website-editor/ServicesContent';
import { AnnouncementBarContent } from '@/components/dashboard/website-editor/AnnouncementBarContent';

// Sidebar Navigation
import { WebsiteEditorSidebar } from '@/components/dashboard/website-editor/WebsiteEditorSidebar';
// Live Preview
import { LivePreviewPanel } from '@/components/dashboard/website-editor/LivePreviewPanel';

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

// Map of tab values to editor components
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
  // Site Content
  'services': 'Services Manager',
  'testimonials': 'Testimonials Manager',
  'gallery': 'Gallery Manager',
  'stylists': 'Stylists Manager',
  'locations': 'Locations Manager',
  'banner': 'Announcement Banner',
  
  // Homepage Sections
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
};

export default function WebsiteSectionsHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'hero';
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [showPreview, setShowPreview] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const isDirtyRef = useRef(false);
  const isMobile = useIsMobile();

  // Memoize the activeSectionId so it doesn't cause unnecessary re-renders
  const activeSectionId = useMemo(() => TAB_TO_SECTION[activeTab], [activeTab]);
  const handleClosePreview = useCallback(() => setShowPreview(false), []);

  // Expose a global way for editors to register dirty state
  useEffect(() => {
    const handleDirtyChange = (e: Event) => {
      isDirtyRef.current = (e as CustomEvent).detail?.dirty ?? false;
    };
    window.addEventListener('editor-dirty-state', handleDirtyChange);

    // Also warn on browser close/refresh
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('editor-dirty-state', handleDirtyChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Sync URL with active tab
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

  const EditorComponent = EDITOR_COMPONENTS[activeTab];

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)]">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Sidebar Navigation Panel */}
          {showSidebar && !isMobile && (
            <>
              <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
                <WebsiteEditorSidebar
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
                />
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}

          {/* Main Editor Panel */}
          <ResizablePanel defaultSize={75} minSize={30}>
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
                          onClick={() => setShowSidebar(!showSidebar)}
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
                          {TAB_LABELS[activeTab] || 'Select a section'}
                        </p>
                      </div>
                    </div>
                  </div>
                    <div className="flex items-center gap-2">
                    <Button
                      variant={showPreview ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {showPreview ? 'Hide Preview' : 'Preview'}
                    </Button>
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
              <div className="flex-1 overflow-auto p-6">
                {EditorComponent ? (
                  <EditorComponent />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Select a section from the sidebar to edit
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>

          {/* Live Preview Panel */}
          {showPreview && !isMobile && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
                <LivePreviewPanel onClose={handleClosePreview} activeSectionId={activeSectionId} />
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
      </div>
    </DashboardLayout>
  );
}
