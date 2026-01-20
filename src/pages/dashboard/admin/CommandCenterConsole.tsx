import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
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
  AlertTriangle,
  UserCheck,
  ClipboardList,
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

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

const ROLES: AppRole[] = ['admin', 'manager', 'stylist', 'receptionist', 'stylist_assistant', 'admin_assistant', 'operations_assistant'];

const ROLE_CONFIG: Record<AppRole, { label: string; shortLabel: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  admin: { label: 'Admin', shortLabel: 'Admin', icon: Crown, color: 'text-amber-600' },
  manager: { label: 'Manager', shortLabel: 'Mgr', icon: Shield, color: 'text-purple-600' },
  stylist: { label: 'Stylist', shortLabel: 'Styl', icon: Scissors, color: 'text-blue-600' },
  receptionist: { label: 'Front Desk', shortLabel: 'FD', icon: Headset, color: 'text-green-600' },
  assistant: { label: 'Assistant', shortLabel: 'Asst', icon: HandHelping, color: 'text-gray-600' }, // Legacy
  stylist_assistant: { label: 'Stylist Asst', shortLabel: 'SA', icon: HandHelping, color: 'text-orange-600' },
  admin_assistant: { label: 'Admin Asst', shortLabel: 'AA', icon: UserCheck, color: 'text-pink-600' },
  operations_assistant: { label: 'Ops Asst', shortLabel: 'OA', icon: ClipboardList, color: 'text-teal-600' },
};

const CATEGORY_ORDER = ['Dashboard Cards', 'Leadership Cards', 'Program Cards', 'Actions'];

export default function CommandCenterConsole() {
  const { data: visibilityData, isLoading } = useDashboardVisibility();
  const toggleVisibility = useToggleDashboardVisibility();
  const bulkUpdate = useBulkUpdateVisibility();
  const [confirmHideRole, setConfirmHideRole] = useState<AppRole | null>(null);

  const elements = visibilityData ? groupVisibilityByElement(visibilityData) : [];
  const categories = groupByCategory(elements);

  const sortedCategories = CATEGORY_ORDER.filter(cat => categories[cat]);

  const handleToggle = (elementKey: string, role: AppRole, currentValue: boolean) => {
    toggleVisibility.mutate({
      elementKey,
      role,
      isVisible: !currentValue,
    });
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
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-foreground text-background flex items-center justify-center rounded-lg shrink-0">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-display font-bold">Command Center Console</h1>
            <p className="text-muted-foreground text-sm">
              Control what each role sees on their dashboard
            </p>
          </div>
        </div>

        {/* Bulk Controls - Clean Grid */}
        <Card className="p-5">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {ROLES.map((role) => {
              const config = ROLE_CONFIG[role];
              const Icon = config.icon;
              const stats = getRoleVisibilityStats(role);
              const allVisible = stats.visible === stats.total;
              const noneVisible = stats.visible === 0;
              const percentage = stats.total > 0 ? Math.round((stats.visible / stats.total) * 100) : 0;
              
              return (
                <div 
                  key={role} 
                  className="group relative bg-muted/30 hover:bg-muted/50 border border-border/50 rounded-xl p-4 transition-all duration-200"
                >
                  {/* Role Header */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      "bg-background border border-border/50"
                    )}>
                      <Icon className={cn("w-4 h-4", config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium truncate">{config.label}</h3>
                      <p className="text-xs text-muted-foreground">
                        {stats.visible} of {stats.total} visible
                      </p>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        percentage === 100 ? "bg-green-500" : percentage === 0 ? "bg-muted-foreground/30" : "bg-primary"
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={allVisible ? "secondary" : "outline"}
                      className={cn(
                        "flex-1 h-8 text-xs gap-1.5",
                        allVisible && "bg-green-500/10 text-green-600 border-green-500/30 hover:bg-green-500/20"
                      )}
                      onClick={() => handleBulkToggle(role, true)}
                      disabled={allVisible || bulkUpdate.isPending}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Show All</span>
                    </Button>
                    <Button
                      size="sm"
                      variant={noneVisible ? "secondary" : "outline"}
                      className={cn(
                        "flex-1 h-8 text-xs gap-1.5",
                        noneVisible && "bg-muted text-muted-foreground"
                      )}
                      onClick={() => setConfirmHideRole(role)}
                      disabled={noneVisible || bulkUpdate.isPending}
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Hide All</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <Card className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </Card>
        )}

        {/* Visibility Table by Category */}
        {!isLoading && sortedCategories.map((category) => (
          <Card key={category} className="overflow-hidden">
            <div className="bg-muted/30 px-4 py-3 border-b">
              <h2 className="font-medium text-sm">{category}</h2>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[200px] font-medium">Element</TableHead>
                    {ROLES.map((role) => {
                      const config = ROLE_CONFIG[role];
                      const Icon = config.icon;
                      return (
                        <TableHead key={role} className="text-center w-[100px]">
                          <div className="flex flex-col items-center gap-1">
                            <Icon className={cn("w-4 h-4", config.color)} />
                            <span className="text-[10px] font-normal text-muted-foreground hidden md:block">
                              {config.label}
                            </span>
                            <span className="text-[10px] font-normal text-muted-foreground md:hidden">
                              {config.shortLabel}
                            </span>
                          </div>
                        </TableHead>
                      );
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories[category].map((element) => (
                    <TableRow key={element.element_key} className="hover:bg-muted/30">
                      <TableCell className="font-medium">
                        <span className="text-sm">{element.element_name}</span>
                      </TableCell>
                      {ROLES.map((role) => {
                        const isVisible = element.roles[role] ?? true;
                        return (
                          <TableCell key={role} className="text-center">
                            <div className="flex justify-center">
                              <Switch
                                checked={isVisible}
                                onCheckedChange={() => handleToggle(element.element_key, role, isVisible)}
                                disabled={toggleVisibility.isPending}
                                className="data-[state=checked]:bg-green-600"
                              />
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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

      {/* Confirmation Dialog for Bulk Hide */}
      <AlertDialog open={!!confirmHideRole} onOpenChange={() => setConfirmHideRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Hide All Dashboard Elements?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will hide all dashboard elements for the{' '}
              <strong>{confirmHideRole && ROLE_CONFIG[confirmHideRole].label}</strong> role.
              Users with this role won't see any of these elements on their dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmHideRole) {
                  handleBulkToggle(confirmHideRole, false);
                  setConfirmHideRole(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hide All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
