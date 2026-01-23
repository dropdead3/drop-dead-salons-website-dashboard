import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    
    // Determine text color based on brightness
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
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="colors" className="flex-1">
          <div className="px-6 pt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="colors" className="gap-2">
                <Palette className="h-4 w-4" />
                Service Colors
              </TabsTrigger>
              <TabsTrigger value="display" disabled className="gap-2">
                Display Options
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="colors" className="mt-0 p-0">
            <ScrollArea className="h-[400px]">
              <div className="p-6 space-y-6">
                {/* Preview Section */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Preview</Label>
                  <div className="flex gap-2 flex-wrap">
                    {colors.slice(0, 5).map((color) => (
                      <div
                        key={color.id}
                        className="px-3 py-1.5 rounded-md text-xs font-medium shadow-sm"
                        style={{ 
                          backgroundColor: color.color_hex, 
                          color: color.text_color_hex 
                        }}
                      >
                        {color.category_name}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add New Category */}
                <div className="space-y-3 p-4 rounded-xl bg-muted/50 border border-border">
                  <Label className="text-sm font-medium">Add Service Category</Label>
                  <div className="flex gap-3">
                    <Input
                      placeholder="Category name (e.g., Balayage)"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="flex-1"
                    />
                    <div className="relative">
                      <input
                        type="color"
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border-2 border-border"
                      />
                    </div>
                    <Button 
                      onClick={handleAddCategory} 
                      disabled={!newCategory.trim() || createColor.isPending}
                      size="icon"
                      className="h-10 w-10"
                    >
                      {createColor.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Color List */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Service Categories ({colors.length})
                  </Label>
                  
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {colors.map((color) => (
                        <div
                          key={color.id}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                        >
                          {/* Color Swatch */}
                          <div className="relative">
                            {editingId === color.id ? (
                              <div className="absolute top-full left-0 mt-2 p-2 bg-popover border border-border rounded-xl shadow-xl z-50 grid grid-cols-6 gap-1.5">
                                {PRESET_COLORS.map((preset) => (
                                  <button
                                    key={preset.hex}
                                    className={cn(
                                      "w-7 h-7 rounded-md transition-transform hover:scale-110",
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
                                  className="w-7 h-7 rounded-md cursor-pointer col-span-2"
                                />
                              </div>
                            ) : null}
                            <button
                              className="w-10 h-10 rounded-lg shadow-sm border-2 border-border transition-transform hover:scale-105"
                              style={{ backgroundColor: color.color_hex }}
                              onClick={() => setEditingId(editingId === color.id ? null : color.id)}
                            />
                          </div>

                          {/* Category Name */}
                          <div className="flex-1">
                            <span className="font-medium text-sm">{color.category_name}</span>
                            <div className="text-xs text-muted-foreground">{color.color_hex}</div>
                          </div>

                          {/* Sample Badge */}
                          <div
                            className="px-2.5 py-1 rounded text-xs font-medium"
                            style={{ 
                              backgroundColor: color.color_hex, 
                              color: color.text_color_hex 
                            }}
                          >
                            Sample
                          </div>

                          {/* Delete Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                            onClick={() => deleteColor.mutate(color.id)}
                            disabled={deleteColor.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
