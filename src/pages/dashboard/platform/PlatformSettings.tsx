import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Shield, Database, Crown, Plug } from 'lucide-react';
import { PlatformTeamManager } from '@/components/platform/PlatformTeamManager';
import { PlatformBrandingTab } from '@/components/platform/settings/PlatformBrandingTab';
import { PlatformIntegrationsTab } from '@/components/platform/settings/PlatformIntegrationsTab';
import { useAuth } from '@/contexts/AuthContext';
import {
  PlatformCard,
  PlatformCardContent,
  PlatformCardHeader,
  PlatformCardTitle,
  PlatformCardDescription,
} from '@/components/platform/ui/PlatformCard';
import { PlatformPageContainer } from '@/components/platform/ui/PlatformPageContainer';
import { PlatformPageHeader } from '@/components/platform/ui/PlatformPageHeader';

export default function PlatformSettings() {
  const { hasPlatformRoleOrHigher } = useAuth();
  const isPlatformOwner = hasPlatformRoleOrHigher('platform_owner');

  return (
    <PlatformPageContainer className="space-y-6">
      <PlatformPageHeader
        title="Platform Settings"
        description="Configure platform-wide settings and defaults"
        backTo="/dashboard/platform/overview"
        backLabel="Back to Overview"
      />

      <Tabs defaultValue="team" className="space-y-6">
        <TabsList className="bg-slate-800/50 border border-slate-700/50 p-1">
          <TabsTrigger 
            value="team" 
            className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 hover:text-white"
          >
            Team
          </TabsTrigger>
          <TabsTrigger 
            value="security"
            className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 hover:text-white"
          >
            Security
          </TabsTrigger>
          <TabsTrigger 
            value="templates"
            className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 hover:text-white"
          >
            Import Templates
          </TabsTrigger>
          <TabsTrigger 
            value="defaults"
            className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 hover:text-white"
          >
            Defaults
          </TabsTrigger>
          <TabsTrigger 
            value="integrations"
            className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 hover:text-white flex items-center gap-1.5"
          >
            <Plug className="h-3.5 w-3.5" />
            Integrations
          </TabsTrigger>
          {isPlatformOwner && (
            <TabsTrigger 
              value="branding"
              className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 hover:text-white flex items-center gap-1.5"
            >
              <Crown className="h-3.5 w-3.5 text-amber-400" />
              Branding
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="team">
          <PlatformTeamManager />
        </TabsContent>

        <TabsContent value="security">
          <PlatformCard variant="glass">
            <PlatformCardHeader>
              <PlatformCardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-violet-400" />
                Security Settings
              </PlatformCardTitle>
              <PlatformCardDescription>
                Configure authentication and access controls
              </PlatformCardDescription>
            </PlatformCardHeader>
            <PlatformCardContent>
              <p className="text-slate-500 text-sm">
                Security settings coming soon...
              </p>
            </PlatformCardContent>
          </PlatformCard>
        </TabsContent>

        <TabsContent value="templates">
          <PlatformCard variant="glass">
            <PlatformCardHeader>
              <PlatformCardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-violet-400" />
                Import Templates
              </PlatformCardTitle>
              <PlatformCardDescription>
                Manage default import mappings for different software
              </PlatformCardDescription>
            </PlatformCardHeader>
            <PlatformCardContent>
              <p className="text-slate-500 text-sm">
                Import templates coming soon...
              </p>
            </PlatformCardContent>
          </PlatformCard>
        </TabsContent>

        <TabsContent value="defaults">
          <PlatformCard variant="glass">
            <PlatformCardHeader>
              <PlatformCardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-violet-400" />
                Default Settings
              </PlatformCardTitle>
              <PlatformCardDescription>
                Configure defaults for new organizations
              </PlatformCardDescription>
            </PlatformCardHeader>
            <PlatformCardContent>
              <p className="text-slate-500 text-sm">
                Default settings coming soon...
              </p>
            </PlatformCardContent>
          </PlatformCard>
        </TabsContent>

        <TabsContent value="integrations">
          <PlatformIntegrationsTab />
        </TabsContent>

        {isPlatformOwner && (
          <TabsContent value="branding">
            <PlatformBrandingTab />
          </TabsContent>
        )}
      </Tabs>
    </PlatformPageContainer>
  );
}
