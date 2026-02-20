import { useState } from 'react';
import { Plus, X, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  useCategoryAddons,
  useCreateCategoryAddon,
  useDeleteCategoryAddon,
} from '@/hooks/useCategoryAddons';

interface CategoryAddonManagerProps {
  categoryId: string;
  categoryName: string;
  organizationId: string;
  availableCategories: string[];    // other category names for "by category" link
  availableServiceNames: string[];  // flat list of service names for "by service" link
}

type LinkMode = 'service' | 'category';

export function CategoryAddonManager({
  categoryId,
  categoryName,
  organizationId,
  availableCategories,
  availableServiceNames,
}: CategoryAddonManagerProps) {
  const [expanded, setExpanded] = useState(false);
  const [addLabel, setAddLabel] = useState('');
  const [linkMode, setLinkMode] = useState<LinkMode>('service');
  const [selectedService, setSelectedService] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const { data: addons = [], isLoading } = useCategoryAddons(expanded ? categoryId : undefined);
  const createAddon = useCreateCategoryAddon();
  const deleteAddon = useDeleteCategoryAddon();

  const resetForm = () => {
    setAddLabel('');
    setSelectedService('');
    setSelectedCategory('');
    setIsAdding(false);
  };

  const handleCreate = () => {
    if (!addLabel.trim()) return;

    createAddon.mutate(
      {
        organization_id: organizationId,
        source_category_id: categoryId,
        addon_label: addLabel.trim(),
        addon_service_name: linkMode === 'service' ? selectedService || null : null,
        addon_category_name: linkMode === 'category' ? selectedCategory || null : null,
        display_order: addons.length,
      },
      { onSuccess: resetForm }
    );
  };

  return (
    <div className="mt-2">
      {/* Toggle button */}
      <button
        onClick={() => setExpanded(prev => !prev)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        Add-On Recommendations
        {!expanded && addons.length === 0 && isLoading ? null : null}
      </button>

      {expanded && (
        <div className="mt-2 space-y-2 pl-1 border-l-2 border-primary/20">
          {/* Existing add-ons */}
          {isLoading ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground py-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Loading…
            </div>
          ) : addons.length === 0 ? (
            <p className="text-xs text-muted-foreground py-1">
              No add-ons configured for <span className="font-medium">{categoryName}</span> yet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {addons.map(addon => (
                <Badge
                  key={addon.id}
                  variant="secondary"
                  className="text-xs font-normal gap-1 pr-1"
                >
                  {addon.addon_label}
                  <button
                    onClick={() => deleteAddon.mutate({
                      id: addon.id,
                      categoryId,
                      organizationId,
                    })}
                    className="text-muted-foreground hover:text-destructive transition-colors ml-0.5"
                    aria-label={`Remove ${addon.addon_label}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Add new form */}
          {!isAdding ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground px-2"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="h-3 w-3 mr-1" /> Add Add-On
            </Button>
          ) : (
            <div className="space-y-2 bg-muted/30 rounded-lg p-2.5">
              <Input
                placeholder="Add-on label (e.g. Scalp Treatment)"
                value={addLabel}
                onChange={e => setAddLabel(e.target.value)}
                className="h-8 text-xs"
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') resetForm(); }}
              />

              {/* Link mode toggle */}
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant={linkMode === 'service' ? 'default' : 'outline'}
                  className="h-6 text-xs px-2"
                  onClick={() => setLinkMode('service')}
                >
                  By Service
                </Button>
                <Button
                  size="sm"
                  variant={linkMode === 'category' ? 'default' : 'outline'}
                  className="h-6 text-xs px-2"
                  onClick={() => setLinkMode('category')}
                >
                  By Category
                </Button>
              </div>

              {linkMode === 'service' && availableServiceNames.length > 0 && (
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Link to a specific service (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableServiceNames.map(name => (
                      <SelectItem key={name} value={name} className="text-xs">
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {linkMode === 'category' && availableCategories.length > 0 && (
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Link to a category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map(cat => (
                      <SelectItem key={cat} value={cat} className="text-xs">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleCreate}
                  disabled={!addLabel.trim() || createAddon.isPending}
                >
                  {createAddon.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={resetForm}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
