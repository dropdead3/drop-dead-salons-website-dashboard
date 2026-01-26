import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ExternalLink, LayoutGrid, PanelRightOpen, PanelRightClose } from 'lucide-react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';

// Tab Components
import { OverviewTab } from '@/components/dashboard/website-editor/OverviewTab';
import { HeroEditor } from '@/components/dashboard/website-editor/HeroEditor';
import { BrandStatementEditor } from '@/components/dashboard/website-editor/BrandStatementEditor';
import { TestimonialsEditor } from '@/components/dashboard/website-editor/TestimonialsEditor';
import { NewClientEditor } from '@/components/dashboard/website-editor/NewClientEditor';
import { ExtensionsEditor } from '@/components/dashboard/website-editor/ExtensionsEditor';
import { FAQEditor } from '@/components/dashboard/website-editor/FAQEditor';
import { BrandsEditor } from '@/components/dashboard/website-editor/BrandsEditor';
import { DrinkMenuEditor } from '@/components/dashboard/website-editor/DrinkMenuEditor';

// Embedded Content Components
import { TestimonialsContent } from '@/components/dashboard/website-editor/TestimonialsContent';
import { GalleryContent } from '@/components/dashboard/website-editor/GalleryContent';
import { StylistsContent } from '@/components/dashboard/website-editor/StylistsContent';
import { LocationsContent } from '@/components/dashboard/website-editor/LocationsContent';
import { ServicesContent } from '@/components/dashboard/website-editor/ServicesContent';
import { AnnouncementBarContent } from '@/components/dashboard/website-editor/AnnouncementBarContent';

// Preview Component
import { LivePreviewPanel } from '@/components/dashboard/website-editor/LivePreviewPanel';

export default function WebsiteSectionsHub() {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'overview';
  const [showPreview, setShowPreview] = useState(false);

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)]">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Main Editor Panel */}
          <ResizablePanel defaultSize={showPreview ? 60 : 100} minSize={40}>
            <div className="space-y-6 h-full overflow-auto pr-2">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
                      <LayoutGrid className="h-5 w-5 text-primary" />
                    </div>
                    <h1 className="text-2xl font-display font-medium">Website Editor</h1>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Configure content, visibility, and ordering for all website sections
                  </p>
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
                        Preview Changes
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

              {/* Tabbed Editor */}
              <Tabs defaultValue={defaultTab} className="space-y-6">
                <div className="overflow-x-auto pb-2">
                  <TabsList className="inline-flex h-auto flex-wrap gap-1">
                    <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
                    <TabsTrigger value="banner" className="text-xs sm:text-sm">Banner</TabsTrigger>
                    <TabsTrigger value="hero" className="text-xs sm:text-sm">Hero</TabsTrigger>
                    <TabsTrigger value="brand" className="text-xs sm:text-sm">Brand</TabsTrigger>
                    <TabsTrigger value="testimonials" className="text-xs sm:text-sm">Testimonials</TabsTrigger>
                    <TabsTrigger value="new-client" className="text-xs sm:text-sm">New Client</TabsTrigger>
                    <TabsTrigger value="extensions" className="text-xs sm:text-sm">Extensions</TabsTrigger>
                    <TabsTrigger value="faq" className="text-xs sm:text-sm">FAQ</TabsTrigger>
                    <TabsTrigger value="services" className="text-xs sm:text-sm">Services</TabsTrigger>
                    <TabsTrigger value="gallery" className="text-xs sm:text-sm">Gallery</TabsTrigger>
                    <TabsTrigger value="stylists" className="text-xs sm:text-sm">Stylists</TabsTrigger>
                    <TabsTrigger value="locations" className="text-xs sm:text-sm">Locations</TabsTrigger>
                    <TabsTrigger value="brands" className="text-xs sm:text-sm">Brands</TabsTrigger>
                    <TabsTrigger value="drinks" className="text-xs sm:text-sm">Drinks</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="overview" className="mt-0">
                  <OverviewTab />
                </TabsContent>

                <TabsContent value="banner" className="mt-0">
                  <AnnouncementBarContent />
                </TabsContent>

                <TabsContent value="hero" className="mt-0">
                  <HeroEditor />
                </TabsContent>

                <TabsContent value="brand" className="mt-0">
                  <BrandStatementEditor />
                </TabsContent>

                <TabsContent value="testimonials" className="mt-0">
                  <TestimonialsContent />
                </TabsContent>

                <TabsContent value="new-client" className="mt-0">
                  <NewClientEditor />
                </TabsContent>

                <TabsContent value="extensions" className="mt-0">
                  <ExtensionsEditor />
                </TabsContent>

                <TabsContent value="faq" className="mt-0">
                  <FAQEditor />
                </TabsContent>

                <TabsContent value="services" className="mt-0">
                  <ServicesContent />
                </TabsContent>

                <TabsContent value="gallery" className="mt-0">
                  <GalleryContent />
                </TabsContent>

                <TabsContent value="stylists" className="mt-0">
                  <StylistsContent />
                </TabsContent>

                <TabsContent value="locations" className="mt-0">
                  <LocationsContent />
                </TabsContent>

                <TabsContent value="brands" className="mt-0">
                  <BrandsEditor />
                </TabsContent>

                <TabsContent value="drinks" className="mt-0">
                  <DrinkMenuEditor />
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>

          {/* Preview Panel (conditionally rendered) */}
          {showPreview && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={40} minSize={25} maxSize={60}>
                <LivePreviewPanel onClose={() => setShowPreview(false)} />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </DashboardLayout>
  );
}
