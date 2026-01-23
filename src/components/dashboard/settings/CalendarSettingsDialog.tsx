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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useServiceCategoryColors,
  useUpdateServiceCategoryColor,
  useCreateServiceCategoryColor,
  useDeleteServiceCategoryColor,
} from '@/hooks/useServiceCategoryColors';
import { useCalendarTheme, CALENDAR_THEME_PRESETS, type CalendarThemeSettings } from '@/hooks/useCalendarTheme';
import { Loader2, Plus, Trash2, Palette, Calendar, Check, X, Paintbrush, Sparkles, Monitor, RotateCcw, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Curated color palette matching the premium dashboard theme
const COLOR_PALETTE = [
  // Row 1: Warm tones
  { hex: '#f472b6', name: 'Rose' },
  { hex: '#fb7185', name: 'Coral' },
  { hex: '#f87171', name: 'Red' },
  { hex: '#fb923c', name: 'Orange' },
  { hex: '#facc15', name: 'Yellow' },
  { hex: '#d4a574', name: 'Tan' },
  // Row 2: Cool tones
  { hex: '#22c55e', name: 'Green' },
  { hex: '#2dd4bf', name: 'Teal' },
  { hex: '#60a5fa', name: 'Blue' },
  { hex: '#818cf8', name: 'Indigo' },
  { hex: '#a78bfa', name: 'Purple' },
  { hex: '#c084fc', name: 'Violet' },
  // Row 3: Neutrals
  { hex: '#374151', name: 'Charcoal' },
  { hex: '#4b5563', name: 'Gray' },
  { hex: '#6b7280', name: 'Slate' },
  { hex: '#9ca3af', name: 'Silver' },
  { hex: '#d1d5db', name: 'Light Gray' },
  { hex: '#1f2937', name: 'Dark' },
];

// Generate abbreviation from category name
const getAbbreviation = (name: string): string => {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

// Determine if a color is light for text contrast
const isLightColor = (hex: string): boolean => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
};

// Theme color setting component
interface ThemeColorSettingProps {
  label: string;
  description?: string;
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}

function ThemeColorSetting({ label, description, value, onChange, disabled }: ThemeColorSettingProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex-1 min-w-0">
        <Label className="text-sm font-medium">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-10 h-10 rounded-lg cursor-pointer border border-border disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <Input
          value={value.toUpperCase()}
          onChange={(e) => {
            const val = e.target.value;
            if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
              onChange(val);
            }
          }}
          disabled={disabled}
          className="h-10 w-24 text-xs font-mono"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

// Mini calendar preview for theme
interface CalendarPreviewProps {
  theme: CalendarThemeSettings;
}

function CalendarPreview({ theme }: CalendarPreviewProps) {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const todayIndex = 3; // Wednesday for demo
  
  return (
    <div 
      className="rounded-xl border overflow-hidden shadow-sm"
      style={{ backgroundColor: theme.calendar_bg_color }}
    >
      {/* Header */}
      <div 
        className="px-3 py-2 text-center text-sm font-medium"
        style={{ 
          backgroundColor: theme.header_bg_color, 
          color: theme.header_text_color 
        }}
      >
        January 2026
      </div>
      
      {/* Days Row */}
      <div 
        className="grid grid-cols-7 text-center text-[10px] py-1.5"
        style={{ 
          backgroundColor: theme.days_row_bg_color, 
          color: theme.days_row_text_color 
        }}
      >
        {days.map((d, i) => (
          <span 
            key={i} 
            className="font-medium"
            style={i === todayIndex ? { color: theme.today_highlight_color } : undefined}
          >
            {d}
          </span>
        ))}
      </div>
      
      {/* Calendar Grid */}
      <div className="p-2">
        {[0, 1, 2].map((week) => (
          <div 
            key={week} 
            className="grid grid-cols-7 gap-0.5"
            style={{ 
              borderTop: week > 0 ? `${theme.cell_border_width}px ${theme.cell_border_style} ${theme.cell_border_color}` : undefined 
            }}
          >
            {Array.from({ length: 7 }, (_, i) => {
              const day = week * 7 + i + 1;
              const isToday = week === 1 && i === todayIndex;
              const isOutside = day > 31;
              
              return (
                <div 
                  key={i}
                  className="h-6 flex items-center justify-center text-[10px]"
                  style={{ 
                    backgroundColor: isOutside ? theme.outside_month_bg_color : 'transparent',
                    borderLeft: i > 0 ? `${theme.cell_border_width}px ${theme.cell_border_style} ${theme.cell_border_color}` : undefined
                  }}
                >
                  {!isOutside && (
                    <span
                      className={cn(
                        'w-5 h-5 flex items-center justify-center rounded-full text-[10px]',
                        isToday && 'font-bold'
                      )}
                      style={isToday ? { 
                        backgroundColor: theme.today_badge_bg_color, 
                        color: theme.today_badge_text_color 
                      } : undefined}
                    >
                      {day}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      
      {/* Current time indicator demo */}
      <div className="px-3 pb-2">
        <div 
          className="h-0.5 rounded-full"
          style={{ backgroundColor: theme.current_time_color }}
        />
      </div>
    </div>
  );
}

export function CalendarSettingsDialog({ open, onOpenChange }: CalendarSettingsDialogProps) {
  const { data: colors = [], isLoading } = useServiceCategoryColors();
  const updateColor = useUpdateServiceCategoryColor();
  const createColor = useCreateServiceCategoryColor();
  const deleteColor = useDeleteServiceCategoryColor();
  
  const { theme, updateTheme, applyPreset, resetToDefault, isUpdating, isLoading: themeLoading } = useCalendarTheme();
  
  const [newCategory, setNewCategory] = useState('');
  const [newColor, setNewColor] = useState('#22c55e');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    
    const textColor = isLightColor(newColor) ? '#1f2937' : '#ffffff';
    
    createColor.mutate({
      category_name: newCategory.trim(),
      color_hex: newColor,
      text_color_hex: textColor,
    }, {
      onSuccess: () => {
        setNewCategory('');
        setNewColor('#22c55e');
        setShowAddForm(false);
      }
    });
  };

  const handleUpdateColor = (id: string, colorHex: string) => {
    const textColor = isLightColor(colorHex) ? '#1f2937' : '#ffffff';
    updateColor.mutate({ id, color_hex: colorHex, text_color_hex: textColor });
  };

  const handleClose = () => {
    setEditingId(null);
    setShowAddForm(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden p-0 [&>button]:hidden">
        {/* Premium Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border bg-gradient-to-r from-background via-background to-muted/30">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 font-display uppercase tracking-wider text-lg">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              Calendar Settings
            </DialogTitle>
            <button 
              onClick={handleClose}
              className="rounded-full p-2 opacity-70 hover:opacity-100 hover:bg-muted transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="colors" className="flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-4">
            <TabsList className="grid w-full grid-cols-2 h-12 bg-muted/30 rounded-full p-1 border border-border/50">
              <TabsTrigger 
                value="colors" 
                className="gap-2 rounded-full text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/60 transition-all"
              >
                <Palette className="h-4 w-4" />
                Service Colors
              </TabsTrigger>
              <TabsTrigger 
                value="display"
                className="gap-2 rounded-full text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/60 transition-all"
              >
                <Monitor className="h-4 w-4" />
                Display Options
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="colors" className="flex-1 flex flex-col min-h-0 mt-0 p-0">
            {/* Intro section */}
            <div className="px-6 py-4 border-b border-border/50">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
                <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Customize how service categories appear on your calendar. Colors help your team quickly identify appointment types at a glance.
                </p>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-6 space-y-2">
                {isLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    {/* Color List */}
                    {colors.map((color) => {
                      const abbr = getAbbreviation(color.category_name);
                      const isEditing = editingId === color.id;
                      
                      return (
                        <div
                          key={color.id}
                          className={cn(
                            'rounded-xl border transition-all',
                            isEditing 
                              ? 'border-primary/30 bg-primary/5 shadow-sm' 
                              : 'border-border/50 bg-card hover:border-border hover:shadow-sm'
                          )}
                        >
                          {/* Main Row */}
                          <div className="flex items-center gap-4 p-4">
                            {/* Circular Badge */}
                            <button
                              className={cn(
                                'w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold transition-all shrink-0',
                                isEditing ? 'ring-2 ring-primary ring-offset-2' : 'hover:scale-105'
                              )}
                              style={{ 
                                backgroundColor: color.color_hex, 
                                color: color.text_color_hex 
                              }}
                              onClick={() => setEditingId(isEditing ? null : color.id)}
                            >
                              {abbr}
                            </button>

                            {/* Category Info */}
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-sm block">{color.category_name}</span>
                              <span className="text-xs text-muted-foreground">{color.color_hex.toUpperCase()}</span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                  "h-8 px-3 gap-1.5 text-xs",
                                  isEditing && "bg-primary/10 text-primary"
                                )}
                                onClick={() => setEditingId(isEditing ? null : color.id)}
                              >
                                <Paintbrush className="h-3.5 w-3.5" />
                                {isEditing ? 'Done' : 'Edit'}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => deleteColor.mutate(color.id)}
                                disabled={deleteColor.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Expanded Color Picker */}
                          {isEditing && (
                            <div className="px-4 pb-4 pt-2 border-t border-border/30">
                              <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-3 block">
                                Choose Color
                              </Label>
                              <div className="grid grid-cols-6 gap-2">
                                {COLOR_PALETTE.map((preset) => (
                                  <button
                                    key={preset.hex}
                                    className={cn(
                                      "w-full aspect-square rounded-lg transition-all hover:scale-105 relative",
                                      color.color_hex === preset.hex && "ring-2 ring-primary ring-offset-2"
                                    )}
                                    style={{ backgroundColor: preset.hex }}
                                    onClick={() => handleUpdateColor(color.id, preset.hex)}
                                    title={preset.name}
                                  >
                                    {color.color_hex === preset.hex && (
                                      <Check 
                                        className="absolute inset-0 m-auto h-4 w-4" 
                                        style={{ color: isLightColor(preset.hex) ? '#1f2937' : '#ffffff' }}
                                      />
                                    )}
                                  </button>
                                ))}
                              </div>
                              {/* Custom color input */}
                              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border/30">
                                <Label className="text-xs text-muted-foreground shrink-0">Custom:</Label>
                                <div className="flex items-center gap-2 flex-1">
                                  <input
                                    type="color"
                                    value={color.color_hex}
                                    onChange={(e) => handleUpdateColor(color.id, e.target.value)}
                                    className="w-8 h-8 rounded-lg cursor-pointer border border-border"
                                  />
                                  <Input
                                    value={color.color_hex.toUpperCase()}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                                        handleUpdateColor(color.id, val);
                                      }
                                    }}
                                    className="h-8 w-24 text-xs font-mono"
                                    placeholder="#000000"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Add New Category Form */}
                    {showAddForm ? (
                      <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 space-y-4">
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ring-2 ring-primary/20"
                            style={{ 
                              backgroundColor: newColor, 
                              color: isLightColor(newColor) ? '#1f2937' : '#ffffff' 
                            }}
                          >
                            {newCategory ? getAbbreviation(newCategory) : '??'}
                          </div>
                          <Input
                            placeholder="Category name (e.g., Balayage)"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                            className="flex-1 h-10"
                            autoFocus
                          />
                        </div>

                        {/* Color Selection */}
                        <div>
                          <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                            Select Color
                          </Label>
                          <div className="grid grid-cols-6 gap-2">
                            {COLOR_PALETTE.slice(0, 12).map((preset) => (
                              <button
                                key={preset.hex}
                                className={cn(
                                  "w-full aspect-square rounded-lg transition-all hover:scale-105 relative",
                                  newColor === preset.hex && "ring-2 ring-primary ring-offset-2"
                                )}
                                style={{ backgroundColor: preset.hex }}
                                onClick={() => setNewColor(preset.hex)}
                                title={preset.name}
                              >
                                {newColor === preset.hex && (
                                  <Check 
                                    className="absolute inset-0 m-auto h-4 w-4" 
                                    style={{ color: isLightColor(preset.hex) ? '#1f2937' : '#ffffff' }}
                                  />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 pt-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setShowAddForm(false);
                              setNewCategory('');
                              setNewColor('#22c55e');
                            }}
                          >
                            Cancel
                          </Button>
                          <Button 
                            size="sm"
                            onClick={handleAddCategory} 
                            disabled={!newCategory.trim() || createColor.isPending}
                            className="gap-1.5"
                          >
                            {createColor.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Plus className="h-4 w-4" />
                            )}
                            Add Category
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowAddForm(true)}
                        className="w-full rounded-xl border border-dashed border-border/60 bg-muted/20 hover:bg-muted/40 hover:border-border p-4 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all"
                      >
                        <Plus className="h-4 w-4" />
                        Add Service Category
                      </button>
                    )}
                  </>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Display Options Tab */}
          <TabsContent value="display" className="flex-1 flex flex-col min-h-0 mt-0 p-0">
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                {themeLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    {/* Preview + Presets Row */}
                    <div className="grid grid-cols-[180px_1fr] gap-6">
                      {/* Live Preview */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider font-medium">
                          <Eye className="h-3.5 w-3.5" />
                          Preview
                        </div>
                        <CalendarPreview theme={theme} />
                      </div>
                      
                      {/* Theme Presets */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                            Theme Presets
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 text-xs gap-1.5"
                            onClick={resetToDefault}
                            disabled={isUpdating}
                          >
                            <RotateCcw className="h-3 w-3" />
                            Reset
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {Object.entries(CALENDAR_THEME_PRESETS).map(([key, preset]) => (
                            <button
                              key={key}
                              className={cn(
                                'rounded-xl border p-3 text-left transition-all hover:border-primary/50 hover:shadow-sm',
                                theme.header_bg_color === preset.header_bg_color && theme.today_highlight_color === preset.today_highlight_color
                                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                                  : 'border-border/50 bg-card'
                              )}
                              onClick={() => applyPreset(key as keyof typeof CALENDAR_THEME_PRESETS)}
                              disabled={isUpdating}
                            >
                              <div className="flex items-center gap-2 mb-1.5">
                                <div 
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: preset.header_bg_color }}
                                />
                                <div 
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: preset.today_highlight_color }}
                                />
                              </div>
                              <div className="text-sm font-medium">{preset.name}</div>
                              <div className="text-[10px] text-muted-foreground">{preset.description}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-border/50" />

                    {/* Color Settings Sections */}
                    <div className="space-y-6">
                      {/* Header Colors */}
                      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
                        <div className="px-4 py-3 bg-muted/30 border-b border-border/30">
                          <span className="text-sm font-medium">Header & Banner</span>
                        </div>
                        <div className="px-4 divide-y divide-border/30">
                          <ThemeColorSetting
                            label="Header Background"
                            description="Top banner with month/year"
                            value={theme.header_bg_color}
                            onChange={(c) => updateTheme({ header_bg_color: c })}
                            disabled={isUpdating}
                          />
                          <ThemeColorSetting
                            label="Header Text"
                            description="Month and year text color"
                            value={theme.header_text_color}
                            onChange={(c) => updateTheme({ header_text_color: c })}
                            disabled={isUpdating}
                          />
                        </div>
                      </div>

                      {/* Days Row */}
                      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
                        <div className="px-4 py-3 bg-muted/30 border-b border-border/30">
                          <span className="text-sm font-medium">Weekday Labels Row</span>
                        </div>
                        <div className="px-4 divide-y divide-border/30">
                          <ThemeColorSetting
                            label="Background"
                            description="Sun, Mon, Tue, etc. row"
                            value={theme.days_row_bg_color}
                            onChange={(c) => updateTheme({ days_row_bg_color: c })}
                            disabled={isUpdating}
                          />
                          <ThemeColorSetting
                            label="Text Color"
                            description="Day label text"
                            value={theme.days_row_text_color}
                            onChange={(c) => updateTheme({ days_row_text_color: c })}
                            disabled={isUpdating}
                          />
                        </div>
                      </div>

                      {/* Today Highlight */}
                      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
                        <div className="px-4 py-3 bg-muted/30 border-b border-border/30">
                          <span className="text-sm font-medium">Today Highlight</span>
                        </div>
                        <div className="px-4 divide-y divide-border/30">
                          <ThemeColorSetting
                            label="Accent Color"
                            description="Column highlight for today"
                            value={theme.today_highlight_color}
                            onChange={(c) => updateTheme({ today_highlight_color: c })}
                            disabled={isUpdating}
                          />
                          <ThemeColorSetting
                            label="Badge Background"
                            description="Circle around today's date"
                            value={theme.today_badge_bg_color}
                            onChange={(c) => updateTheme({ today_badge_bg_color: c })}
                            disabled={isUpdating}
                          />
                          <ThemeColorSetting
                            label="Badge Text"
                            description="Number inside badge"
                            value={theme.today_badge_text_color}
                            onChange={(c) => updateTheme({ today_badge_text_color: c })}
                            disabled={isUpdating}
                          />
                        </div>
                      </div>

                      {/* Cell Styling */}
                      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
                        <div className="px-4 py-3 bg-muted/30 border-b border-border/30">
                          <span className="text-sm font-medium">Grid & Cell Styling</span>
                        </div>
                        <div className="px-4 divide-y divide-border/30">
                          <ThemeColorSetting
                            label="Cell Borders"
                            description="Lines between cells"
                            value={theme.cell_border_color}
                            onChange={(c) => updateTheme({ cell_border_color: c })}
                            disabled={isUpdating}
                          />
                          <div className="flex items-center justify-between gap-4 py-3">
                            <div className="flex-1 min-w-0">
                              <Label className="text-sm font-medium">Border Style</Label>
                              <p className="text-xs text-muted-foreground mt-0.5">Solid, dashed, or dotted</p>
                            </div>
                            <Select
                              value={theme.cell_border_style}
                              onValueChange={(v) => updateTheme({ cell_border_style: v as 'solid' | 'dashed' | 'dotted' | 'none' })}
                              disabled={isUpdating}
                            >
                              <SelectTrigger className="w-28 h-10">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="solid">Solid</SelectItem>
                                <SelectItem value="dashed">Dashed</SelectItem>
                                <SelectItem value="dotted">Dotted</SelectItem>
                                <SelectItem value="none">None</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <ThemeColorSetting
                            label="Hour Lines"
                            description="Full hour grid lines"
                            value={theme.hour_line_color}
                            onChange={(c) => updateTheme({ hour_line_color: c })}
                            disabled={isUpdating}
                          />
                          <ThemeColorSetting
                            label="Half-Hour Lines"
                            description="30-minute grid lines"
                            value={theme.half_hour_line_color}
                            onChange={(c) => updateTheme({ half_hour_line_color: c })}
                            disabled={isUpdating}
                          />
                          <ThemeColorSetting
                            label="Quarter-Hour Lines"
                            description="15-minute grid lines"
                            value={theme.quarter_hour_line_color}
                            onChange={(c) => updateTheme({ quarter_hour_line_color: c })}
                            disabled={isUpdating}
                          />
                        </div>
                      </div>

                      {/* Background Colors */}
                      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
                        <div className="px-4 py-3 bg-muted/30 border-b border-border/30">
                          <span className="text-sm font-medium">Background Colors</span>
                        </div>
                        <div className="px-4 divide-y divide-border/30">
                          <ThemeColorSetting
                            label="Calendar Background"
                            description="Main calendar area"
                            value={theme.calendar_bg_color}
                            onChange={(c) => updateTheme({ calendar_bg_color: c })}
                            disabled={isUpdating}
                          />
                          <ThemeColorSetting
                            label="Outside Month Days"
                            description="Days from adjacent months"
                            value={theme.outside_month_bg_color}
                            onChange={(c) => updateTheme({ outside_month_bg_color: c })}
                            disabled={isUpdating}
                          />
                          <ThemeColorSetting
                            label="Current Time Indicator"
                            description="Now line color"
                            value={theme.current_time_color}
                            onChange={(c) => updateTheme({ current_time_color: c })}
                            disabled={isUpdating}
                          />
                        </div>
                      </div>
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