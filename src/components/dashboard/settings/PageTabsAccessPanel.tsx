import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Eye, 
  EyeOff,
  Loader2,
  Layers,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  useDashboardVisibility, 
  useToggleDashboardVisibility,
  useBulkUpdateVisibility,
  groupVisibilityByElement,
} from '@/hooks/useDashboardVisibility';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface PageTabsAccessPanelProps {
  role: AppRole;
  roleColor: string;
}

// Group tabs by their parent page for display
const PAGE_DISPLAY_NAMES: Record<string, string> = {
  'stats': 'My Stats',
  'analytics': 'Analytics Hub',
  'settings': 'Settings',
};

export function PageTabsAccessPanel({ role, roleColor }: PageTabsAccessPanelProps) {
  const { data: visibilityData = [], isLoading } = useDashboardVisibility();
  const toggleVisibility = useToggleDashboardVisibility();
  const bulkUpdate = useBulkUpdateVisibility();

  // Filter to only "Page Tabs" category items for this role
  const tabItems = useMemo(() => {
    return visibilityData.filter(
      v => v.role === role && v.element_category === 'Page Tabs'
    );
  }, [visibilityData, role]);

  // Group by page (extract page name from element_key like "stats_leaderboard_tab")
  const groupedByPage = useMemo(() => {
    const groups: Record<string, typeof tabItems> = {};
    
    tabItems.forEach(item => {
      // Extract page from key: "stats_leaderboard_tab" -> "stats"
      const parts = item.element_key.split('_');
      const page = parts[0] || 'other';
      
      if (!groups[page]) {
        groups[page] = [];
      }
      groups[page].push(item);
    });

    return groups;
  }, [tabItems]);

  const handleToggle = (elementKey: string, currentVisible: boolean) => {
    toggleVisibility.mutate({
      elementKey,
      role,
      isVisible: !currentVisible,
    });
  };

  const handleBulkToggle = async (page: string, showAll: boolean) => {
    const pageItems = groupedByPage[page] || [];
    const updates = pageItems.map(item => ({
      elementKey: item.element_key,
      role,
      isVisible: showAll,
    }));
    
    await bulkUpdate.mutateAsync(updates);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (tabItems.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No page tabs have been registered yet.</p>
        <p className="text-xs mt-1">
          Page tabs will appear here automatically when wrapped with VisibilityGate.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
        <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          Control which tabs are visible on each page for this role. Tabs wrapped with VisibilityGate 
          will auto-register here when first rendered.
        </p>
      </div>

      {Object.entries(groupedByPage).map(([page, items]) => {
        const visibleCount = items.filter(i => i.is_visible).length;
        const displayName = PAGE_DISPLAY_NAMES[page] || page;

        return (
          <Card key={page} className="overflow-hidden">
            <CardHeader className="py-3 px-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-muted-foreground" />
                  <span className="font-display text-sm uppercase tracking-wider">
                    {displayName}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {visibleCount}/{items.length}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs gap-1"
                    onClick={() => handleBulkToggle(page, true)}
                    disabled={visibleCount === items.length || bulkUpdate.isPending}
                  >
                    <Eye className="w-3 h-3" />
                    All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs gap-1"
                    onClick={() => handleBulkToggle(page, false)}
                    disabled={visibleCount === 0 || bulkUpdate.isPending}
                  >
                    <EyeOff className="w-3 h-3" />
                    None
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              {items.map(item => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md bg-background/50 border border-border/50",
                    !item.is_visible && "opacity-50"
                  )}
                >
                  <Switch
                    checked={item.is_visible}
                    onCheckedChange={() => handleToggle(item.element_key, item.is_visible)}
                    disabled={toggleVisibility.isPending}
                    className="data-[state=checked]:bg-primary"
                  />
                  <span className={cn(
                    "text-sm flex-1",
                    !item.is_visible && "line-through text-muted-foreground"
                  )}>
                    {item.element_name}
                  </span>
                  {!item.is_visible && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      Hidden
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
