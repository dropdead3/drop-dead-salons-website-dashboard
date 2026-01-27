import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Link2, FileSignature } from 'lucide-react';
import { FormTemplateList } from '@/components/dashboard/forms/FormTemplateList';
import { ServiceLinksTab } from '@/components/dashboard/forms/ServiceLinksTab';
import { SignaturesTab } from '@/components/dashboard/forms/SignaturesTab';

export function FormsTemplatesContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Forms & Agreements</h2>
        <p className="text-muted-foreground">
          Create client-facing forms, link them to services, and track signatures
        </p>
      </div>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="service-links" className="gap-2">
            <Link2 className="h-4 w-4" />
            Service Links
          </TabsTrigger>
          <TabsTrigger value="signatures" className="gap-2">
            <FileSignature className="h-4 w-4" />
            Signatures
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          <FormTemplateList />
        </TabsContent>

        <TabsContent value="service-links">
          <ServiceLinksTab />
        </TabsContent>

        <TabsContent value="signatures">
          <SignaturesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
