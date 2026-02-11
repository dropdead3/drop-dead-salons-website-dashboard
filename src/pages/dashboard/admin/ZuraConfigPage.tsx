import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft, Brain, BookOpen, Users, ShieldCheck } from 'lucide-react';
import { PersonalityTab } from '@/components/zura-config/PersonalityTab';
import { KnowledgeBaseTab } from '@/components/zura-config/KnowledgeBaseTab';
import { RoleRulesTab } from '@/components/zura-config/RoleRulesTab';
import { GuardrailsTab } from '@/components/zura-config/GuardrailsTab';
import { useOrganizationContext } from '@/contexts/OrganizationContext';

export default function ZuraConfigPage() {
  const { currentOrganization } = useOrganizationContext();
  const orgId = currentOrganization?.id;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-[1200px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild className="shrink-0 mt-1">
            <Link to="/dashboard/admin/management">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="font-display text-3xl lg:text-4xl">Zura Configuration</h1>
            <p className="text-muted-foreground mt-1">
              Customize how Zura communicates, what she knows, and her boundaries
            </p>
          </div>
        </div>

        {orgId ? (
          <Tabs defaultValue="personality" className="space-y-6">
            <TabsList>
              <TabsTrigger value="personality" className="gap-2">
                <Brain className="h-4 w-4" /> Personality
              </TabsTrigger>
              <TabsTrigger value="knowledge" className="gap-2">
                <BookOpen className="h-4 w-4" /> Knowledge Base
              </TabsTrigger>
              <TabsTrigger value="roles" className="gap-2">
                <Users className="h-4 w-4" /> Role Rules
              </TabsTrigger>
              <TabsTrigger value="guardrails" className="gap-2">
                <ShieldCheck className="h-4 w-4" /> Guardrails
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personality">
              <PersonalityTab organizationId={orgId} />
            </TabsContent>

            <TabsContent value="knowledge">
              <KnowledgeBaseTab organizationId={orgId} />
            </TabsContent>

            <TabsContent value="roles">
              <RoleRulesTab organizationId={orgId} />
            </TabsContent>

            <TabsContent value="guardrails">
              <GuardrailsTab organizationId={orgId} />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No organization found. Please ensure you are part of an organization.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
