import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  LayoutDashboard, 
  Eye,
  EyeOff,
  Crown,
  Shield,
  Scissors,
  Headset,
  HandHelping,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  useDashboardVisibility, 
  useToggleDashboardVisibility,
  useBulkUpdateVisibility,
  groupVisibilityByElement,
  groupByCategory,
} from '@/hooks/useDashboardVisibility';
import { Button } from '@/components/ui/button';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

const ROLES: AppRole[] = ['admin', 'manager', 'stylist', 'receptionist', 'assistant'];

const ROLE_CONFIG: Record<AppRole, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  admin: { label: 'Admin', icon: Crown, color: 'text-amber-600' },
  manager: { label: 'Manager', icon: Shield, color: 'text-purple-600' },
  stylist: { label: 'Stylist', icon: Scissors, color: 'text-blue-600' },
  receptionist: { label: 'Front Desk', icon: Headset, color: 'text-green-600' },
  assistant: { label: 'Assistant', icon: HandHelping, color: 'text-orange-600' },
};

const CATEGORY_ORDER = ['Dashboard Cards', 'Leadership Cards', 'Program Cards', 'Actions'];

export default function CommandCenterConsole() {
  const { data: visibilityData, isLoading } = useDashboardVisibility();
  const toggleVisibility = useToggleDashboardVisibility();
  const bulkUpdate = useBulkUpdateVisibility();

  const elements = visibilityData ? groupVisibilityByElement(visibilityData) : [];
  const categories = groupByCategory(elements);

  // Sort categories by predefined order
  const sortedCategories = CATEGORY_ORDER.filter(cat => categories[cat]);

  const handleToggle = (elementKey: string, role: AppRole, currentValue: boolean) => {
    toggleVisibility.mutate({
      elementKey,
      role,
      isVisible: !currentValue,
    });
  };

  const getVisibleCount = (roles: Record<AppRole, boolean>) => {
    return Object.values(roles).filter(Boolean).length;
  };

  const getRoleVisibilityStats = (role: AppRole) => {
    const roleElements = elements.filter(el => el.roles[role] !== undefined);
    const visibleCount = roleElements.filter(el => el.roles[role]).length;
    return { visible: visibleCount, total: roleElements.length };
  };

  const handleBulkToggle = (role: AppRole, setVisible: boolean) => {
    const updates = elements
      .filter(el => el.roles[role] !== undefined && el.roles[role] !== setVisible)
      .map(el => ({
        elementKey: el.element_key,
        role,
        isVisible: setVisible,
      }));
    
    if (updates.length > 0) {
      bulkUpdate.mutate(updates);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-foreground text-background flex items-center justify-center rounded-lg">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold">Command Center Console</h1>
              <p className="text-muted-foreground text-sm">
                Control what each role sees on their dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Bulk Role Controls */}
        <Card className="p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Bulk Controls</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {ROLES.map((role) => {
              const config = ROLE_CONFIG[role];
              const Icon = config.icon;
              const stats = getRoleVisibilityStats(role);
              const allVisible = stats.visible === stats.total;
              const noneVisible = stats.visible === 0;
              
              return (
                <div key={role} className="flex flex-col gap-2 p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("w-4 h-4", config.color)} />
                    <span className="text-sm font-medium">{config.label}</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {stats.visible}/{stats.total}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={allVisible ? "default" : "outline"}
                      className="flex-1 text-xs h-7"
                      onClick={() => handleBulkToggle(role, true)}
                      disabled={allVisible || bulkUpdate.isPending}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Show All
                    </Button>
                    <Button
                      size="sm"
                      variant={noneVisible ? "default" : "outline"}
                      className="flex-1 text-xs h-7"
                      onClick={() => handleBulkToggle(role, false)}
                      disabled={noneVisible || bulkUpdate.isPending}
                    >
                      <EyeOff className="w-3 h-3 mr-1" />
                      Hide All
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-6 w-48 mb-4" />
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Visibility Settings by Category */}
        {!isLoading && sortedCategories.map((category) => (
          <Card key={category} className="overflow-hidden">
            <div className="bg-muted/50 px-6 py-4 border-b">
              <h2 className="font-display text-sm uppercase tracking-wide">{category}</h2>
            </div>
            
            <div className="divide-y">
              {categories[category].map((element) => (
                <div key={element.element_key} className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Element Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm">{element.element_name}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {getVisibleCount(element.roles)}/{ROLES.length} roles
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {element.element_key}
                      </p>
                    </div>

                    {/* Role Toggles */}
                    <div className="flex flex-wrap gap-3 md:gap-4">
                      {ROLES.map((role) => {
                        const isVisible = element.roles[role] ?? true;
                        const config = ROLE_CONFIG[role];
                        const Icon = config.icon;
                        
                        return (
                          <div 
                            key={role}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors",
                              isVisible 
                                ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800" 
                                : "bg-muted/50 border-border"
                            )}
                          >
                            <Icon className={cn("w-4 h-4", isVisible ? config.color : "text-muted-foreground")} />
                            <span className={cn(
                              "text-xs font-medium hidden sm:inline",
                              isVisible ? "text-foreground" : "text-muted-foreground"
                            )}>
                              {config.label}
                            </span>
                            {isVisible ? (
                              <Eye className="w-3 h-3 text-green-600" />
                            ) : (
                              <EyeOff className="w-3 h-3 text-muted-foreground" />
                            )}
                            <Switch
                              checked={isVisible}
                              onCheckedChange={() => handleToggle(element.element_key, role, isVisible)}
                              disabled={toggleVisibility.isPending}
                              className="scale-75"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}

        {/* Empty State */}
        {!isLoading && elements.length === 0 && (
          <Card className="p-12 text-center">
            <LayoutDashboard className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-display text-lg mb-2">No Elements Configured</h3>
            <p className="text-sm text-muted-foreground">
              Dashboard visibility settings will appear here once configured.
            </p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
