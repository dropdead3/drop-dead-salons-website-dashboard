import { useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, Calendar, Palette, Eye, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  useServiceCategoryColors, 
  useUpdateCategoryColor,
  useSyncServiceCategories,
  getCategoryAbbreviation,
} from '@/hooks/useServiceCategoryColors';
import { toast } from 'sonner';
import { CalendarColorPreview } from './CalendarColorPreview';
import { getCategoryAbbreviation as getAbbr } from '@/utils/categoryColors';

// Explanations for non-service category types
const CATEGORY_EXPLANATIONS: Record<string, string> = {
  'Block': 'Blocked time slots for stylists (e.g., admin tasks, personal time off)',
  'Break': 'Scheduled breaks (e.g., lunch)',
};

// Curated luxury color palette - 36 colors organized by family
const CATEGORY_PALETTE = [
  // Row 1: Neutrals & Blacks
  '#1a1a1a', '#2d2d2d', '#4a4a4a', '#6b7280', '#9ca3af', '#d1d5db',
  // Row 2: Creams & Oats (Brand Aligned)
  '#f5f5dc', '#e8e4d9', '#d4cfc4', '#c9c2b5', '#b8b0a2', '#a39e93',
  // Row 3: Warm Pastels
  '#fde8d7', '#fbd5c4', '#f5c6aa', '#D4A574', '#C4A77D', '#B5A48C',
  // Row 4: Rose & Blush Pastels
  '#fce7f3', '#fbcfe8', '#f9a8d4', '#F472B6', '#EC4899', '#DB2777',
  // Row 5: Cool Pastels (Blues)
  '#e0f2fe', '#bae6fd', '#7dd3fc', '#60A5FA', '#3B82F6', '#2563EB',
  // Row 6: Sage, Mint & Lavender
  '#d1fae5', '#a7f3d0', '#6ee7b7', '#f3e8ff', '#e9d5ff', '#c4b5fd',
];

export function ScheduleSettingsContent() {
  const { data: categories, isLoading, error } = useServiceCategoryColors();
  const updateColor = useUpdateCategoryColor();
  const syncCategories = useSyncServiceCategories();

  // Build color map for preview
  const colorMap = useMemo(() => {
    if (!categories) return {};
    const map: Record<string, { bg: string; text: string; abbr: string }> = {};
    categories.forEach((cat) => {
      map[cat.category_name.toLowerCase()] = {
        bg: cat.color_hex,
        text: cat.text_color_hex,
        abbr: getAbbr(cat.category_name),
      };
    });
    return map;
  }, [categories]);

  // Auto-sync new categories on mount
  useEffect(() => {
    syncCategories.mutate(undefined, {
      onSuccess: (result) => {
        if (result.added > 0) {
          toast.success(`Added ${result.added} new ${result.added === 1 ? 'category' : 'categories'}`);
        }
      },
    });
  }, []);

  const handleColorChange = (categoryId: string, colorHex: string) => {
    updateColor.mutate(
      { categoryId, colorHex },
      {
        onSuccess: () => {
          toast.success('Color updated');
        },
        onError: () => {
          toast.error('Failed to update color');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-8 text-center">
          <p className="text-destructive">Failed to load category colors</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            <CardTitle className="font-display text-lg">SERVICE CATEGORY COLORS</CardTitle>
          </div>
          <CardDescription>
            Customize colors for each service category. These colors appear on the calendar and in booking flows throughout the app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories?.map((category) => {
              const abbr = getCategoryAbbreviation(category.category_name);
              
              return (
                <div
                  key={category.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                >
                  {/* Color badge */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className={cn(
                          'w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
                          'transition-transform hover:scale-105 active:scale-95',
                          'ring-2 ring-offset-2 ring-offset-background ring-transparent hover:ring-primary/50'
                        )}
                        style={{
                          backgroundColor: category.color_hex,
                          color: category.text_color_hex,
                        }}
                      >
                        {abbr}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-4" align="start">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{
                              backgroundColor: category.color_hex,
                              color: category.text_color_hex,
                            }}
                          >
                            {abbr}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{category.category_name}</p>
                            <p className="text-xs text-muted-foreground uppercase">{category.color_hex}</p>
                          </div>
                        </div>
                        
                        <div className="h-px bg-border" />
                        
                        <div className="grid grid-cols-6 gap-1.5">
                          {CATEGORY_PALETTE.map((color) => (
                            <button
                              key={color}
                              className={cn(
                                'w-8 h-8 rounded-full transition-transform hover:scale-110',
                                category.color_hex.toLowerCase() === color.toLowerCase() &&
                                  'ring-2 ring-offset-2 ring-primary'
                              )}
                              style={{ backgroundColor: color }}
                              onClick={() => handleColorChange(category.id, color)}
                              disabled={updateColor.isPending}
                            />
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Category name */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium text-sm truncate">{category.category_name}</p>
                      {CATEGORY_EXPLANATIONS[category.category_name] && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground cursor-help shrink-0" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[200px]">
                            <p className="text-xs">{CATEGORY_EXPLANATIONS[category.category_name]}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground uppercase">{category.color_hex}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {categories?.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No service categories found.</p>
              <p className="text-sm text-muted-foreground">
                Categories will appear here once services are synced from Phorest.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calendar Preview */}
      {categories && categories.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              <CardTitle className="font-display text-lg">CALENDAR PREVIEW</CardTitle>
            </div>
            <CardDescription>
              See how your color choices will look on the schedule. Changes update instantly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CalendarColorPreview colorMap={colorMap} />
          </CardContent>
        </Card>
      )}
    </div>
    </TooltipProvider>
  );
}
