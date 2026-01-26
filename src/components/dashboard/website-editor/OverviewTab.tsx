import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { GripVertical, Eye, EyeOff, Sparkles } from 'lucide-react';
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

export function OverviewTab() {
  const { data: sectionsConfig, isLoading } = useWebsiteSections();
  const updateSections = useUpdateWebsiteSections();
  const [isSaving, setIsSaving] = useState(false);

  const orderedSections = useMemo<SectionItem[]>(() => {
    if (!sectionsConfig?.homepage) return [];
    
    return Object.entries(sectionsConfig.homepage)
      .map(([key, config]) => ({ key: key as SectionKey, config }))
      .sort((a, b) => a.config.order - b.config.order);
  }, [sectionsConfig]);

  const [localSections, setLocalSections] = useState<SectionItem[]>([]);

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

    setLocalSections(prev => 
      prev.map(s => s.key === sectionKey ? { ...s, config: { ...s.config, enabled } } : s)
    );

    try {
      await updateSections.mutateAsync(updatedSections);
      toast.success(`${SECTION_LABELS[sectionKey]} ${enabled ? 'enabled' : 'disabled'}`);
    } catch {
      toast.error('Failed to update section');
      setLocalSections(orderedSections);
    }
  };

  const handleReorder = (reorderedItems: SectionItem[]) => {
    setLocalSections(reorderedItems);
  };

  const handleSaveOrder = async () => {
    if (!sectionsConfig) return;

    setIsSaving(true);
    
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
      <div className="space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="premium-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-oat" />
                Section Visibility & Order
              </CardTitle>
              <CardDescription className="mt-1">
                Drag to reorder • Toggle to show/hide • {enabledCount}/{totalCount} visible
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
                  <div className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                    <GripVertical className="h-5 w-5" />
                  </div>

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

                  <div className="flex items-center gap-3">
                    {item.config.enabled ? (
                      <Eye className="h-4 w-4 text-green-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}

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
        </CardContent>
      </Card>
    </div>
  );
}
