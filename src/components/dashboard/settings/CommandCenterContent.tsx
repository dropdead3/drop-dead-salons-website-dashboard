import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
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
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  useDashboardVisibility, 
  useToggleDashboardVisibility,
  useBulkUpdateVisibility,
  useSyncVisibilityElements,
  groupVisibilityByElement,
  groupByCategory,
  getElementCategories,
  VISIBILITY_ELEMENTS,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

const ROLES: AppRole[] = ['super_admin', 'admin', 'manager', 'stylist', 'receptionist', 'stylist_assistant', 'admin_assistant', 'operations_assistant'];

const ROLE_CONFIG: Record<AppRole, { label: string; shortLabel: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  super_admin: { label: 'Super Admin', shortLabel: 'SA', icon: Crown, color: 'text-yellow-600' },
  admin: { label: 'Admin', shortLabel: 'Admin', icon: Crown, color: 'text-amber-600' },
  manager: { label: 'Manager', shortLabel: 'Mgr', icon: Shield, color: 'text-purple-600' },
  stylist: { label: 'Stylist', shortLabel: 'Styl', icon: Scissors, color: 'text-blue-600' },
  receptionist: { label: 'Front Desk', shortLabel: 'FD', icon: Headset, color: 'text-green-600' },
  assistant: { label: 'Assistant', shortLabel: 'Asst', icon: HandHelping, color: 'text-gray-600' },
  stylist_assistant: { label: 'Stylist Asst', shortLabel: 'SA', icon: HandHelping, color: 'text-orange-600' },
  admin_assistant: { label: 'Admin Asst', shortLabel: 'AA', icon: UserCheck, color: 'text-pink-600' },
  operations_assistant: { label: 'Ops Asst', shortLabel: 'OA', icon: ClipboardList, color: 'text-teal-600' },
};

// Dynamic category order based on registered elements
const CATEGORY_ORDER = [
  'Dashboard Home',
  'Dashboard Cards', 
  'Leadership Cards', 
  'Sales Dashboard',
  'Team Overview',
  'Client Engine Tracker',
  'Actions',
];

export function CommandCenterContent() {
  const { data: visibilityData, isLoading } = useDashboardVisibility();
  const toggleVisibility = useToggleDashboardVisibility();
  const bulkUpdate = useBulkUpdateVisibility();
  const syncElements = useSyncVisibilityElements();
  const [confirmHideRole, setConfirmHideRole] = useState<AppRole | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const elements = visibilityData ? groupVisibilityByElement(visibilityData) : [];

  // Filter elements by search query and category
  const filteredCategories = useMemo(() => {
    let filtered = elements;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(el => 
        el.element_name.toLowerCase().includes(query) ||
        el.element_key.toLowerCase().includes(query) ||
        el.element_category.toLowerCase().includes(query)
      );
    }
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(el => el.element_category === categoryFilter);
    }
    
    return groupByCategory(filtered);
  }, [elements, searchQuery, categoryFilter]);

  const sortedCategories = CATEGORY_ORDER.filter(cat => filteredCategories[cat]);
  // Add any categories not in the predefined order
  const otherCategories = Object.keys(filteredCategories).filter(cat => !CATEGORY_ORDER.includes(cat));
  const allCategories = [...sortedCategories, ...otherCategories];

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

  // Get all available categories for the filter dropdown
  const availableCategories = useMemo(() => {
    const cats = new Set(elements.map(el => el.element_category));
    return Array.from(cats).sort();
  }, [elements]);

  return (
    <div className="space-y-6">
      {/* Header with Sync Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display">Element Visibility</h2>
          <p className="text-sm text-muted-foreground">
            Control which dashboard elements are visible for each role
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => syncElements.mutate()}
          disabled={syncElements.isPending}
          className="gap-2"
        >
          <RefreshCw className={cn("w-4 h-4", syncElements.isPending && "animate-spin")} />
          Sync Elements
        </Button>
      </div>

      {/* Search and Filter */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search elements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {availableCategories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {elements.length} elements registered • {VISIBILITY_ELEMENTS.length} in code registry
        </p>
      </Card>

      {/* Bulk Controls */}
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
                
                <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      percentage === 100 ? "bg-green-500" : percentage === 0 ? "bg-muted-foreground/30" : "bg-primary"
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                
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
      {!isLoading && allCategories.map((category) => (
        <Card key={category} className="overflow-hidden">
          <div className="bg-muted/30 px-4 py-3 border-b flex items-center justify-between">
            <h2 className="font-medium text-sm">{category}</h2>
            <span className="text-xs text-muted-foreground">
              {filteredCategories[category]?.length || 0} elements
            </span>
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
                {filteredCategories[category].map((element) => (
                  <TableRow key={element.element_key} className="hover:bg-muted/30">
                    <TableCell className="font-medium">
                      <div>
                        <span className="text-sm">{element.element_name}</span>
                        <p className="text-[10px] text-muted-foreground font-mono">{element.element_key}</p>
                      </div>
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
    </div>
  );
}
