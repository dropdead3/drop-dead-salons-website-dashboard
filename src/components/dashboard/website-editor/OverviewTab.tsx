import { useState, useMemo } from 'react';
import { tokens } from '@/lib/design-tokens';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { GripVertical, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { motion, Reorder } from 'framer-motion';
import {
  useWebsiteSections,
  useUpdateWebsiteSections,
  isBuiltinSection,
  type SectionConfig,
} from '@/hooks/useWebsiteSections';

export function OverviewTab() {
  const { data: sectionsConfig, isLoading } = useWebsiteSections();
  const updateSections = useUpdateWebsiteSections();
  const [isSaving, setIsSaving] = useState(false);

  const orderedSections = useMemo<SectionConfig[]>(() => {
    if (!sectionsConfig?.homepage) return [];
    return [...sectionsConfig.homepage].sort((a, b) => a.order - b.order);
  }, [sectionsConfig]);

  const [localSections, setLocalSections] = useState<SectionConfig[]>([]);

  useMemo(() => {
    if (orderedSections.length > 0 && localSections.length === 0) {
      setLocalSections(orderedSections);
    }
  }, [orderedSections, localSections.length]);

  const handleToggleSection = async (sectionId: string, enabled: boolean) => {
    if (!sectionsConfig) return;

    const newSections = sectionsConfig.homepage.map(s =>
      s.id === sectionId ? { ...s, enabled } : s
    );

    setLocalSections(prev =>
      prev.map(s => s.id === sectionId ? { ...s, enabled } : s)
    );

    try {
      await updateSections.mutateAsync({ homepage: newSections });
      const label = newSections.find(s => s.id === sectionId)?.label ?? 'Section';
      toast.success(`${label} ${enabled ? 'enabled' : 'disabled'}`);
    } catch {
      toast.error('Failed to update section');
      setLocalSections(orderedSections);
    }
  };

  const handleReorder = (reorderedItems: SectionConfig[]) => {
    setLocalSections(reorderedItems);
  };

  const handleSaveOrder = async () => {
    if (!sectionsConfig) return;

    setIsSaving(true);

    const reordered = localSections.map((s, i) => ({ ...s, order: i + 1 }));

    try {
      await updateSections.mutateAsync({ homepage: reordered });
      toast.success('Section order saved');
    } catch {
      toast.error('Failed to save order');
    } finally {
      setIsSaving(false);
    }
  };

  const hasOrderChanged = useMemo(() => {
    if (orderedSections.length === 0 || localSections.length === 0) return false;
    return orderedSections.some((s, i) => s.id !== localSections[i]?.id);
  }, [orderedSections, localSections]);

  const enabledCount = localSections.filter(s => s.enabled).length;
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
      <Card className={tokens.card.wrapper}>
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
                key={item.id}
                value={item}
                className="touch-none"
              >
                <motion.div
                  layout
                  initial={false}
                  className={`
                    flex items-center gap-4 p-4 rounded-xl border transition-all
                    ${item.enabled
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
                        {item.label}
                      </span>
                      <Badge
                        variant={item.enabled ? 'default' : 'secondary'}
                        className="text-[10px] px-1.5 py-0"
                      >
                        #{item.order}
                      </Badge>
                      {item.deletable && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0">Custom</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      checked={item.enabled}
                      onCheckedChange={(checked) => handleToggleSection(item.id, checked)}
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
