import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, GripVertical, Eye, EyeOff, LayoutGrid, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { motion, Reorder } from 'framer-motion';
import {
  useWebsiteSections,
  useUpdateWebsiteSections,
  SECTION_LABELS,
  SECTION_DESCRIPTIONS,
  type HomepageSections,
  type SectionConfig,
} from '@/hooks/useWebsiteSections';

type SectionKey = keyof HomepageSections;

interface SectionItem {
  key: SectionKey;
  config: SectionConfig;
}

export default function WebsiteSectionsHub() {
  const { data: sectionsConfig, isLoading } = useWebsiteSections();
  const updateSections = useUpdateWebsiteSections();
  const [isSaving, setIsSaving] = useState(false);

  // Transform sections config into ordered array for drag-and-drop
  const orderedSections = useMemo<SectionItem[]>(() => {
    if (!sectionsConfig?.homepage) return [];
    
    return Object.entries(sectionsConfig.homepage)
      .map(([key, config]) => ({ key: key as SectionKey, config }))
      .sort((a, b) => a.config.order - b.config.order);
  }, [sectionsConfig]);

  const [localSections, setLocalSections] = useState<SectionItem[]>([]);

  // Sync local state when data loads
  useMemo(() => {
    if (orderedSections.length > 0 && localSections.length === 0) {
      setLocalSections(orderedSections);
    }
  }, [orderedSections, localSections.length]);

  const handleToggleSection = async (sectionKey: SectionKey, enabled: boolean) => {
    if (!sectionsConfig) return;

    const updatedSections = {
      ...sectionsConfig,
      homepage: {
        ...sectionsConfig.homepage,
        [sectionKey]: {
          ...sectionsConfig.homepage[sectionKey],
          enabled,
        },
      },
    };

    // Update local state immediately
    setLocalSections(prev => 
      prev.map(s => s.key === sectionKey ? { ...s, config: { ...s.config, enabled } } : s)
    );

    try {
      await updateSections.mutateAsync(updatedSections);
      toast.success(`${SECTION_LABELS[sectionKey]} ${enabled ? 'enabled' : 'disabled'}`);
    } catch {
      toast.error('Failed to update section');
      // Revert local state
      setLocalSections(orderedSections);
    }
  };

  const handleReorder = (reorderedItems: SectionItem[]) => {
    setLocalSections(reorderedItems);
  };

  const handleSaveOrder = async () => {
    if (!sectionsConfig) return;

    setIsSaving(true);
    
    // Build new config with updated orders
    const updatedHomepage = localSections.reduce((acc, item, index) => {
      acc[item.key] = {
        ...item.config,
        order: index + 1,
      };
      return acc;
    }, {} as HomepageSections);

    try {
      await updateSections.mutateAsync({
        ...sectionsConfig,
        homepage: updatedHomepage,
      });
      toast.success('Section order saved');
    } catch {
      toast.error('Failed to save order');
    } finally {
      setIsSaving(false);
    }
  };

  const hasOrderChanged = useMemo(() => {
    if (orderedSections.length === 0 || localSections.length === 0) return false;
    return orderedSections.some((s, i) => s.key !== localSections[i]?.key);
  }, [orderedSections, localSections]);

  const enabledCount = localSections.filter(s => s.config.enabled).length;
  const totalCount = localSections.length;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-[600px] w-full rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
                <LayoutGrid className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-2xl font-display font-medium">Website Sections</h1>
            </div>
            <p className="text-muted-foreground text-sm">
              Control visibility and order of homepage sections
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="font-mono">
              {enabledCount}/{totalCount} visible
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('/', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Preview Site
            </Button>
          </div>
        </div>

        {/* Main Card */}
        <Card className="premium-card">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-oat" />
                  Homepage Sections
                </CardTitle>
                <CardDescription className="mt-1">
                  Drag to reorder • Toggle to show/hide
                </CardDescription>
              </div>
              {hasOrderChanged && (
                <Button 
                  onClick={handleSaveOrder}
                  disabled={isSaving}
                  size="sm"
                >
                  {isSaving ? 'Saving...' : 'Save Order'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Reorder.Group 
              axis="y" 
              values={localSections} 
              onReorder={handleReorder}
              className="space-y-2"
            >
              {localSections.map((item) => (
                <Reorder.Item
                  key={item.key}
                  value={item}
                  className="touch-none"
                >
                  <motion.div
                    layout
                    initial={false}
                    className={`
                      flex items-center gap-4 p-4 rounded-xl border transition-all
                      ${item.config.enabled 
                        ? 'bg-card border-border hover:border-primary/30' 
                        : 'bg-muted/30 border-border/50 opacity-60'
                      }
                      cursor-grab active:cursor-grabbing
                    `}
                  >
                    {/* Drag Handle */}
                    <div className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                      <GripVertical className="h-5 w-5" />
                    </div>

                    {/* Section Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {SECTION_LABELS[item.key]}
                        </span>
                        <Badge 
                          variant={item.config.enabled ? 'default' : 'secondary'}
                          className="text-[10px] px-1.5 py-0"
                        >
                          #{item.config.order}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {SECTION_DESCRIPTIONS[item.key]}
                      </p>
                    </div>

                    {/* Status Icon */}
                    <div className="flex items-center gap-3">
                      {item.config.enabled ? (
                        <Eye className="h-4 w-4 text-green-500" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}

                      {/* Toggle */}
                      <Switch
                        checked={item.config.enabled}
                        onCheckedChange={(checked) => handleToggleSection(item.key, checked)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </motion.div>
                </Reorder.Item>
              ))}
            </Reorder.Group>

            {localSections.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <LayoutGrid className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p>No sections configured</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                <Eye className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">How it works</p>
                <p className="text-xs text-muted-foreground">
                  Changes are saved automatically when you toggle visibility. 
                  Drag sections to reorder, then click "Save Order" to apply.
                  Disabled sections will not appear on the public website.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
