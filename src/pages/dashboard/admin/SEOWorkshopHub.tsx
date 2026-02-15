import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, BarChart3, ListTodo, BookOpen, Wrench } from 'lucide-react';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { useState } from 'react';
import { SEOWorkshopOverview } from '@/components/dashboard/seo-workshop/SEOWorkshopOverview';
import { SEOWorkshopActionList } from '@/components/dashboard/seo-workshop/SEOWorkshopActionList';
import { SEOWorkshopGuides } from '@/components/dashboard/seo-workshop/SEOWorkshopGuides';
import { SEOWorkshopTools } from '@/components/dashboard/seo-workshop/SEOWorkshopTools';

export default function SEOWorkshopHub() {
  const { effectiveOrganization } = useOrganizationContext();
  const organizationId = effectiveOrganization?.id;
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" asChild className="shrink-0 mt-1">
              <Link to="/dashboard/admin/management">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="font-display text-2xl font-medium flex items-center gap-2">
                SEO Workshop
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Tasks and guides to improve local visibility
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="actions" className="gap-2">
              <ListTodo className="h-4 w-4" />
              Action items
            </TabsTrigger>
            <TabsTrigger value="guides" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Guides
            </TabsTrigger>
            <TabsTrigger value="tools" className="gap-2">
              <Wrench className="h-4 w-4" />
              Tools
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <SEOWorkshopOverview
              organizationId={organizationId}
              onGoToActions={() => setActiveTab('actions')}
            />
          </TabsContent>

          <TabsContent value="actions" className="mt-6">
            <SEOWorkshopActionList organizationId={organizationId} />
          </TabsContent>

          <TabsContent value="guides" className="mt-6">
            <SEOWorkshopGuides />
          </TabsContent>

          <TabsContent value="tools" className="mt-6">
            <SEOWorkshopTools />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
