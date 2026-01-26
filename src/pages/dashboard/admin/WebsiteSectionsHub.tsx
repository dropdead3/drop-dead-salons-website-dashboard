import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  LayoutGrid,
  PanelRightClose,
  PanelRightOpen,
  ExternalLink,
  PanelLeftClose,
  PanelLeftOpen
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
// Embedded Content Components
import { TestimonialsContent } from '@/components/dashboard/website-editor/TestimonialsContent';
import { GalleryContent } from '@/components/dashboard/website-editor/GalleryContent';
import { StylistsContent } from '@/components/dashboard/website-editor/StylistsContent';
import { LocationsContent } from '@/components/dashboard/website-editor/LocationsContent';
import { ServicesContent } from '@/components/dashboard/website-editor/ServicesContent';
import { AnnouncementBarContent } from '@/components/dashboard/website-editor/AnnouncementBarContent';

// Sidebar Navigation
import { WebsiteEditorSidebar } from '@/components/dashboard/website-editor/WebsiteEditorSidebar';

// Preview Component
import { LivePreviewPanel } from '@/components/dashboard/website-editor/LivePreviewPanel';

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
  'hero': HeroEditor,
  'brand': BrandStatementEditor,
  'testimonials': TestimonialsContent,
  'new-client': NewClientEditor,
  'extensions': ExtensionsEditor,
  'faq': FAQEditor,
  'services': ServicesContent,
  'gallery': GalleryContent,
  'stylists': StylistsContent,
  'locations': LocationsContent,
  'brands': BrandsManager,
  'drinks': DrinksManager,
  'footer-cta': FooterCTAEditor,
  'banner': AnnouncementBarContent,
};

// Tab labels for breadcrumb display
const TAB_LABELS: Record<string, string> = {
  'hero': 'Hero Section',
  'brand': 'Brand Statement',
  'testimonials': 'Testimonials',
  'new-client': 'New Client CTA',
  'extensions': 'Extensions Spotlight',
  'faq': 'FAQ',
  'services': 'Services',
  'gallery': 'Gallery',
  'stylists': 'Stylists',
  'locations': 'Locations',
  'brands': 'Partner Brands',
  'drinks': 'Drink Menu',
  'footer-cta': 'Footer CTA',
  'banner': 'Announcement Banner',
};

export default function WebsiteSectionsHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'hero';
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [showPreview, setShowPreview] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const isMobile = useIsMobile();

  // Sync URL with active tab
  useEffect(() => {
    setSearchParams({ tab: activeTab }, { replace: true });
  }, [activeTab, setSearchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const EditorComponent = EDITOR_COMPONENTS[activeTab];

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)]">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Sidebar Navigation Panel */}
          {showSidebar && !isMobile && (
            <>
              <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                <WebsiteEditorSidebar
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
                />
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}

          {/* Main Editor Panel */}
          <ResizablePanel defaultSize={showPreview ? 50 : 80} minSize={30}>
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
                      {showPreview ? (
                        <>
                          <PanelRightClose className="h-4 w-4 mr-2" />
                          Hide Preview
                        </>
                      ) : (
                        <>
                          <PanelRightOpen className="h-4 w-4 mr-2" />
                          Preview
                        </>
                      )}
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

          {/* Preview Panel (conditionally rendered) */}
          {showPreview && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
                <LivePreviewPanel onClose={() => setShowPreview(false)} />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </DashboardLayout>
  );
}
