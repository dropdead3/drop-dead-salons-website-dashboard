import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ExternalLink, LayoutGrid } from 'lucide-react';

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
import { LinkToManagerCard } from '@/components/dashboard/website-editor/LinkToManagerCard';

export default function WebsiteSectionsHub() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
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
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open('/', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Preview Site
          </Button>
        </div>

        {/* Tabbed Editor */}
        <Tabs defaultValue="overview" className="space-y-6">
          <div className="overflow-x-auto pb-2">
            <TabsList className="inline-flex h-auto flex-wrap gap-1">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
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

          <TabsContent value="hero" className="mt-0">
            <HeroEditor />
          </TabsContent>

          <TabsContent value="brand" className="mt-0">
            <BrandStatementEditor />
          </TabsContent>

          <TabsContent value="testimonials" className="mt-0">
            <TestimonialsEditor />
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
            <LinkToManagerCard
              title="Services Preview"
              description="Service categories are managed in the Services Manager. Toggle visibility in the Overview tab."
              linkHref="/dashboard/admin/services"
              linkText="Go to Services Manager"
            />
          </TabsContent>

          <TabsContent value="gallery" className="mt-0">
            <LinkToManagerCard
              title="Gallery Section"
              description="Before/after transformations are managed in the Gallery Manager."
              linkHref="/dashboard/admin/gallery"
              linkText="Go to Gallery Manager"
            />
          </TabsContent>

          <TabsContent value="stylists" className="mt-0">
            <LinkToManagerCard
              title="Meet Our Stylists"
              description="Stylist visibility and ordering are managed in the Homepage Stylists section."
              linkHref="/dashboard/admin/homepage-stylists"
              linkText="Go to Homepage Stylists"
            />
          </TabsContent>

          <TabsContent value="locations" className="mt-0">
            <LinkToManagerCard
              title="Locations Section"
              description="Location information is managed in the Locations Manager."
              linkHref="/dashboard/admin/locations"
              linkText="Go to Locations Manager"
            />
          </TabsContent>

          <TabsContent value="brands" className="mt-0">
            <BrandsEditor />
          </TabsContent>

          <TabsContent value="drinks" className="mt-0">
            <DrinkMenuEditor />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
