import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Shield, Database, Crown, Plug, BookOpen, Palette } from 'lucide-react';
import { PlatformTeamManager } from '@/components/platform/PlatformTeamManager';
import { PlatformBrandingTab } from '@/components/platform/settings/PlatformBrandingTab';
import { PlatformAppearanceTab } from '@/components/platform/settings/PlatformAppearanceTab';
import { PlatformIntegrationsTab } from '@/components/platform/settings/PlatformIntegrationsTab';
import { KnowledgeBaseTab } from '@/components/platform/settings/KnowledgeBaseTab';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatformTheme } from '@/contexts/PlatformThemeContext';
import { cn } from '@/lib/utils';
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
  const { resolvedTheme } = usePlatformTheme();
  const isPlatformOwner = hasPlatformRoleOrHigher('platform_owner');
  const isDark = resolvedTheme === 'dark';

  const tabTriggerClass = cn(
    'data-[state=active]:bg-violet-600 data-[state=active]:text-white',
    isDark 
      ? 'text-slate-400 hover:text-white'
      : 'text-slate-500 hover:text-violet-700 data-[state=active]:shadow-md'
  );

  return (
    <PlatformPageContainer className="space-y-6">
      <PlatformPageHeader
        title="Platform Settings"
        description="Configure platform-wide settings and defaults"
        backTo="/dashboard/platform/overview"
        backLabel="Back to Overview"
      />

      <Tabs defaultValue="team" className="space-y-6">
        <TabsList className={cn(
          'border p-1',
          isDark 
            ? 'bg-slate-800/50 border-slate-700/50'
            : 'bg-white/80 border-violet-200/50 shadow-sm'
        )}>
          <TabsTrigger value="team" className={tabTriggerClass}>
            Team
          </TabsTrigger>
          <TabsTrigger value="appearance" className={cn(tabTriggerClass, 'flex items-center gap-1.5')}>
            <Palette className="h-3.5 w-3.5" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="security" className={tabTriggerClass}>
            Security
          </TabsTrigger>
          <TabsTrigger value="templates" className={tabTriggerClass}>
            Import Templates
          </TabsTrigger>
          <TabsTrigger value="defaults" className={tabTriggerClass}>
            Defaults
          </TabsTrigger>
          <TabsTrigger value="knowledge-base" className={cn(tabTriggerClass, 'flex items-center gap-1.5')}>
            <BookOpen className="h-3.5 w-3.5" />
            Knowledge Base
          </TabsTrigger>
          <TabsTrigger value="integrations" className={cn(tabTriggerClass, 'flex items-center gap-1.5')}>
            <Plug className="h-3.5 w-3.5" />
            Integrations
          </TabsTrigger>
          {isPlatformOwner && (
            <TabsTrigger value="branding" className={cn(tabTriggerClass, 'flex items-center gap-1.5')}>
              <Crown className="h-3.5 w-3.5 text-amber-400" />
              Branding
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="team">
          <PlatformTeamManager />
        </TabsContent>

        <TabsContent value="appearance">
          <PlatformAppearanceTab />
        </TabsContent>

        <TabsContent value="security">
          <PlatformCard variant="glass">
            <PlatformCardHeader>
              <PlatformCardTitle className="flex items-center gap-2">
                <Shield className={cn('h-5 w-5', isDark ? 'text-violet-400' : 'text-violet-600')} />
                Security Settings
              </PlatformCardTitle>
              <PlatformCardDescription>
                Configure authentication and access controls
              </PlatformCardDescription>
            </PlatformCardHeader>
            <PlatformCardContent>
              <p className={cn('text-sm', isDark ? 'text-slate-500' : 'text-slate-400')}>
                Security settings coming soon...
              </p>
            </PlatformCardContent>
          </PlatformCard>
        </TabsContent>

        <TabsContent value="templates">
          <PlatformCard variant="glass">
            <PlatformCardHeader>
              <PlatformCardTitle className="flex items-center gap-2">
                <Database className={cn('h-5 w-5', isDark ? 'text-violet-400' : 'text-violet-600')} />
                Import Templates
              </PlatformCardTitle>
              <PlatformCardDescription>
                Manage default import mappings for different software
              </PlatformCardDescription>
            </PlatformCardHeader>
            <PlatformCardContent>
              <p className={cn('text-sm', isDark ? 'text-slate-500' : 'text-slate-400')}>
                Import templates coming soon...
              </p>
            </PlatformCardContent>
          </PlatformCard>
        </TabsContent>

        <TabsContent value="defaults">
          <PlatformCard variant="glass">
            <PlatformCardHeader>
              <PlatformCardTitle className="flex items-center gap-2">
                <Settings className={cn('h-5 w-5', isDark ? 'text-violet-400' : 'text-violet-600')} />
                Default Settings
              </PlatformCardTitle>
              <PlatformCardDescription>
                Configure defaults for new organizations
              </PlatformCardDescription>
            </PlatformCardHeader>
            <PlatformCardContent>
              <p className={cn('text-sm', isDark ? 'text-slate-500' : 'text-slate-400')}>
                Default settings coming soon...
              </p>
            </PlatformCardContent>
          </PlatformCard>
        </TabsContent>

        <TabsContent value="knowledge-base">
          <KnowledgeBaseTab />
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
