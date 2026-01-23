import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useServiceCategoryColors,
  useUpdateServiceCategoryColor,
  useCreateServiceCategoryColor,
  useDeleteServiceCategoryColor,
} from '@/hooks/useServiceCategoryColors';
import { Loader2, Plus, Trash2, Palette, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Preset color options
const PRESET_COLORS = [
  { hex: '#22c55e', name: 'Green' },
  { hex: '#facc15', name: 'Yellow' },
  { hex: '#f472b6', name: 'Pink' },
  { hex: '#60a5fa', name: 'Blue' },
  { hex: '#a78bfa', name: 'Purple' },
  { hex: '#2dd4bf', name: 'Teal' },
  { hex: '#fb923c', name: 'Orange' },
  { hex: '#f87171', name: 'Red' },
  { hex: '#d4a574', name: 'Oat' },
  { hex: '#4b5563', name: 'Gray' },
  { hex: '#374151', name: 'Dark Gray' },
  { hex: '#1f2937', name: 'Charcoal' },
];

// Generate abbreviation from category name
const getAbbreviation = (name: string): string => {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export function CalendarSettingsDialog({ open, onOpenChange }: CalendarSettingsDialogProps) {
  const { data: colors = [], isLoading } = useServiceCategoryColors();
  const updateColor = useUpdateServiceCategoryColor();
  const createColor = useCreateServiceCategoryColor();
  const deleteColor = useDeleteServiceCategoryColor();
  
  const [newCategory, setNewCategory] = useState('');
  const [newColor, setNewColor] = useState('#22c55e');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    
    const textColor = isLightColor(newColor) ? '#1f2937' : '#ffffff';
    
    createColor.mutate({
      category_name: newCategory.trim(),
      color_hex: newColor,
      text_color_hex: textColor,
    });
    
    setNewCategory('');
    setNewColor('#22c55e');
  };

  const handleUpdateColor = (id: string, colorHex: string) => {
    const textColor = isLightColor(colorHex) ? '#1f2937' : '#ffffff';
    updateColor.mutate({ id, color_hex: colorHex, text_color_hex: textColor });
    setEditingId(null);
  };

  const isLightColor = (hex: string): boolean => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] p-0 overflow-hidden bg-card">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2.5 font-display uppercase tracking-wider text-lg">
            <Calendar className="h-5 w-5" />
            Calendar Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="colors" className="flex-1">
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-2 h-11 bg-muted/50 rounded-full p-1">
              <TabsTrigger 
                value="colors" 
                className="gap-2 rounded-full text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Palette className="h-4 w-4" />
                Service Colors
              </TabsTrigger>
              <TabsTrigger 
                value="display" 
                disabled 
                className="gap-2 rounded-full text-sm"
              >
                Display Options
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="colors" className="mt-0 p-0">
            <ScrollArea className="h-[400px]">
              <div className="p-6 space-y-1">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    {/* Color List */}
                    {colors.map((color) => {
                      const abbr = getAbbreviation(color.category_name);
                      return (
                        <div
                          key={color.id}
                          className="flex items-center gap-4 py-2.5 group"
                        >
                          {/* Circular Badge with Abbreviation */}
                          <div className="relative">
                            {editingId === color.id && (
                              <div className="absolute top-full left-0 mt-2 p-3 bg-popover border border-border rounded-xl shadow-xl z-50 grid grid-cols-6 gap-2">
                                {PRESET_COLORS.map((preset) => (
                                  <button
                                    key={preset.hex}
                                    className={cn(
                                      "w-7 h-7 rounded-full transition-all hover:scale-110",
                                      color.color_hex === preset.hex && "ring-2 ring-primary ring-offset-2"
                                    )}
                                    style={{ backgroundColor: preset.hex }}
                                    onClick={() => handleUpdateColor(color.id, preset.hex)}
                                    title={preset.name}
                                  />
                                ))}
                                <input
                                  type="color"
                                  value={color.color_hex}
                                  onChange={(e) => handleUpdateColor(color.id, e.target.value)}
                                  className="w-7 h-7 rounded-full cursor-pointer col-span-2"
                                />
                              </div>
                            )}
                            <button
                              className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-semibold transition-all hover:scale-105 hover:shadow-md"
                              style={{ 
                                backgroundColor: color.color_hex, 
                                color: color.text_color_hex 
                              }}
                              onClick={() => setEditingId(editingId === color.id ? null : color.id)}
                            >
                              {abbr}
                            </button>
                          </div>

                          {/* Category Name */}
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-sm">{color.category_name}</span>
                          </div>

                          {/* Delete Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() => deleteColor.mutate(color.id)}
                            disabled={deleteColor.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}

                    {/* Add New Category */}
                    <div className="flex items-center gap-4 py-3 border-t border-border/40 mt-4 pt-5">
                      <div className="relative">
                        <div 
                          className="w-11 h-11 rounded-full flex items-center justify-center border-2 border-dashed border-border/60 cursor-pointer overflow-hidden"
                          style={{ backgroundColor: newColor }}
                        >
                          <input
                            type="color"
                            value={newColor}
                            onChange={(e) => setNewColor(e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <span 
                            className="text-xs font-semibold pointer-events-none"
                            style={{ color: isLightColor(newColor) ? '#1f2937' : '#ffffff' }}
                          >
                            {newCategory ? getAbbreviation(newCategory) : '++'}
                          </span>
                        </div>
                      </div>
                      <Input
                        placeholder="New category name..."
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                        className="flex-1 h-10 bg-muted/30"
                      />
                      <Button 
                        onClick={handleAddCategory} 
                        disabled={!newCategory.trim() || createColor.isPending}
                        size="sm"
                        className="h-9 px-4 gap-1.5"
                      >
                        {createColor.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        Add
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}