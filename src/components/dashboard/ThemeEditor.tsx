import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ColorWheelPicker } from '@/components/ui/color-wheel-picker';
import { 
  useCustomTheme, 
  editableTokens, 
  getCSSVariable, 
  hslStringToHex,
  hexToHslString,
} from '@/hooks/useCustomTheme';
import { 
  Palette, 
  Save, 
  RotateCcw, 
  X, 
  Download, 
  Upload,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ThemeEditorProps {
  isEditMode: boolean;
  onToggleEditMode: () => void;
}

interface ColorSwatchProps {
  tokenKey: string;
  label: string;
  isEditMode: boolean;
  isModified: boolean;
  onColorChange: (key: string, hex: string) => void;
}

function ColorSwatch({ tokenKey, label, isEditMode, isModified, onColorChange }: ColorSwatchProps) {
  const currentValue = getCSSVariable(tokenKey);
  const hexValue = hslStringToHex(currentValue);
  
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="relative">
        {isEditMode ? (
          <ColorWheelPicker
            value={hexValue}
            onChange={(hex) => onColorChange(tokenKey, hex)}
            colorType="primary"
            label={label}
          />
        ) : (
          <div 
            className="w-7 h-7 rounded-md border border-border shadow-sm"
            style={{ backgroundColor: `hsl(${currentValue})` }}
          />
        )}
        {isModified && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-gold rounded-full" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{label}</p>
        <p className="text-xs text-muted-foreground font-mono truncate">
          --{tokenKey}
        </p>
      </div>
    </div>
  );
}

export function ThemeEditor({ isEditMode, onToggleEditMode }: ThemeEditorProps) {
  const {
    pendingChanges,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    setVariable,
    saveTheme,
    discardChanges,
    resetToDefault,
    exportTheme,
    importTheme,
  } = useCustomTheme();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeCategory, setActiveCategory] = useState('core');
  
  const handleColorChange = (key: string, hex: string) => {
    if (hex === 'transparent') return;
    setVariable(key, hex);
  };
  
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      importTheme(content);
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleDiscard = () => {
    discardChanges();
    onToggleEditMode();
  };
  
  const handleSave = async () => {
    const success = await saveTheme();
    if (success) {
      onToggleEditMode();
    }
  };
  
  const categories = [
    { id: 'core', label: 'Core', tokens: editableTokens.core },
    { id: 'brand', label: 'Brand', tokens: editableTokens.brand },
    { id: 'special', label: 'Special', tokens: editableTokens.special },
    { id: 'ui', label: 'UI', tokens: editableTokens.ui },
    { id: 'sidebar', label: 'Sidebar', tokens: editableTokens.sidebar },
  ];
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <Card className="border-gold/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-gold" />
            <CardTitle className="text-lg">Theme Editor</CardTitle>
            {hasUnsavedChanges && (
              <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-3 h-3" />
                Unsaved changes
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {isEditMode ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDiscard}
                  disabled={isSaving}
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={isSaving}>
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Reset
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset to Default Theme?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove all your custom color settings and restore the default theme. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={resetToDefault}>
                        Reset Theme
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || !hasUnsavedChanges}
                  className="bg-gold hover:bg-gold/90 text-gold-foreground"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-1" />
                  )}
                  Save
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportTheme}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Import
                </Button>
                
                <Button
                  size="sm"
                  onClick={onToggleEditMode}
                  className="bg-gold hover:bg-gold/90 text-gold-foreground"
                >
                  <Palette className="w-4 h-4 mr-1" />
                  Edit Theme
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isEditMode ? (
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="mb-4">
              {categories.map(cat => (
                <TabsTrigger key={cat.id} value={cat.id} className="text-xs">
                  {cat.label}
                  {cat.tokens.some(t => pendingChanges[t.key]) && (
                    <span className="ml-1 w-1.5 h-1.5 bg-gold rounded-full" />
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {categories.map(cat => (
              <TabsContent key={cat.id} value={cat.id}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
                  {cat.tokens.map(token => (
                    <ColorSwatch
                      key={token.key}
                      tokenKey={token.key}
                      label={token.label}
                      isEditMode={isEditMode}
                      isModified={!!pendingChanges[token.key]}
                      onColorChange={handleColorChange}
                    />
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="text-sm text-muted-foreground">
            <p>Click <strong>Edit Theme</strong> to customize colors. Changes will be applied in real-time and can be saved to persist across sessions.</p>
            <p className="mt-2 text-xs">Tip: Use <strong>Export</strong> to backup your theme or share it with others.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
