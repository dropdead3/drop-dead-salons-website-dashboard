import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Calendar, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  useServiceCategoryColors, 
  useUpdateCategoryColor,
  useSyncServiceCategories,
  getCategoryAbbreviation,
} from '@/hooks/useServiceCategoryColors';
import { toast } from 'sonner';

// Curated luxury color palette
const CATEGORY_PALETTE = [
  // Warm tones
  '#D4A574', '#C4A77D', '#B5A48C',
  // Rose tones
  '#F472B6', '#EC4899', '#DB2777',
  // Gold tones
  '#FACC15', '#EAB308', '#CA8A04',
  // Blue tones
  '#60A5FA', '#3B82F6', '#2563EB',
  // Green tones
  '#10B981', '#059669', '#047857',
  // Purple tones
  '#A78BFA', '#8B5CF6', '#7C3AED',
];

export function ScheduleSettingsContent() {
  const { data: categories, isLoading, error } = useServiceCategoryColors();
  const updateColor = useUpdateCategoryColor();
  const syncCategories = useSyncServiceCategories();

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
                    <p className="font-medium text-sm truncate">{category.category_name}</p>
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
    </div>
  );
}
