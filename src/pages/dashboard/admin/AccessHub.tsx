import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Blocks, 
  Eye, 
  Lock,
  Flag,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ModulesTab } from '@/components/access-hub/ModulesTab';
import { RoleAccessTab } from '@/components/access-hub/RoleAccessTab';
import { PermissionsTab } from '@/components/access-hub/PermissionsTab';
import { PlatformTab } from '@/components/access-hub/PlatformTab';

type TabValue = 'modules' | 'role-access' | 'permissions' | 'platform';

export default function AccessHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { roles, isPlatformUser } = useAuth();
  const isSuperAdmin = roles.includes('super_admin');
  const canManage = isSuperAdmin || isPlatformUser;
  
  const tabParam = searchParams.get('tab') as TabValue | null;
  const [activeTab, setActiveTab] = useState<TabValue>(tabParam || 'modules');

  // Sync tab with URL
  useEffect(() => {
    if (tabParam && ['modules', 'role-access', 'permissions', 'platform'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (value: string) => {
    const tab = value as TabValue;
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Shield className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Access & Controls Hub</h1>
            <p className="text-muted-foreground">
              Manage modules, permissions, and visibility in one place
            </p>
          </div>
          {!canManage && (
            <Badge variant="secondary" className="gap-1">
              <Lock className="h-3 w-3" />
              View Only
            </Badge>
          )}
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="modules" className="gap-2">
            <Blocks className="h-4 w-4" />
            <span className="hidden sm:inline">Modules</span>
          </TabsTrigger>
          <TabsTrigger value="role-access" className="gap-2">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Role Access</span>
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Permissions</span>
          </TabsTrigger>
          <TabsTrigger value="platform" className="gap-2">
            <Flag className="h-4 w-4" />
            <span className="hidden sm:inline">Platform</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="mt-0">
          <ModulesTab canManage={canManage} />
        </TabsContent>

        <TabsContent value="role-access" className="mt-0">
          <RoleAccessTab canManage={canManage} />
        </TabsContent>

        <TabsContent value="permissions" className="mt-0">
          <PermissionsTab canManage={canManage} />
        </TabsContent>

        <TabsContent value="platform" className="mt-0">
          <PlatformTab canManage={canManage} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
