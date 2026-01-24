import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// All editable CSS variable tokens organized by category
export const editableTokens = {
  core: [
    { key: 'background', label: 'Background', category: 'core' },
    { key: 'foreground', label: 'Foreground', category: 'core' },
    { key: 'card', label: 'Card', category: 'core' },
    { key: 'card-foreground', label: 'Card Text', category: 'core' },
    { key: 'popover', label: 'Popover', category: 'core' },
    { key: 'popover-foreground', label: 'Popover Text', category: 'core' },
  ],
  brand: [
    { key: 'primary', label: 'Primary', category: 'brand' },
    { key: 'primary-foreground', label: 'Primary Text', category: 'brand' },
    { key: 'secondary', label: 'Secondary', category: 'brand' },
    { key: 'secondary-foreground', label: 'Secondary Text', category: 'brand' },
    { key: 'accent', label: 'Accent', category: 'brand' },
    { key: 'accent-foreground', label: 'Accent Text', category: 'brand' },
  ],
  special: [
    { key: 'oat', label: 'Oat', category: 'special' },
    { key: 'gold', label: 'Gold', category: 'special' },
    { key: 'muted', label: 'Muted', category: 'special' },
    { key: 'muted-foreground', label: 'Muted Text', category: 'special' },
    { key: 'destructive', label: 'Destructive', category: 'special' },
    { key: 'destructive-foreground', label: 'Destructive Text', category: 'special' },
  ],
  ui: [
    { key: 'border', label: 'Border', category: 'ui' },
    { key: 'input', label: 'Input', category: 'ui' },
    { key: 'ring', label: 'Ring', category: 'ui' },
  ],
  sidebar: [
    { key: 'sidebar-background', label: 'Sidebar BG', category: 'sidebar' },
    { key: 'sidebar-foreground', label: 'Sidebar Text', category: 'sidebar' },
    { key: 'sidebar-primary', label: 'Sidebar Primary', category: 'sidebar' },
    { key: 'sidebar-primary-foreground', label: 'Sidebar Primary Text', category: 'sidebar' },
    { key: 'sidebar-accent', label: 'Sidebar Accent', category: 'sidebar' },
    { key: 'sidebar-accent-foreground', label: 'Sidebar Accent Text', category: 'sidebar' },
    { key: 'sidebar-border', label: 'Sidebar Border', category: 'sidebar' },
    { key: 'sidebar-ring', label: 'Sidebar Ring', category: 'sidebar' },
  ],
};

export type CustomTheme = Record<string, string>;

// Convert HSL string to hex for color picker
export function hslStringToHex(hslString: string): string {
  if (!hslString || hslString === 'transparent') return '#ffffff';
  
  // Parse "40 30% 96%" format
  const parts = hslString.trim().split(/\s+/);
  if (parts.length < 3) return '#ffffff';
  
  const h = parseFloat(parts[0]) || 0;
  const s = parseFloat(parts[1]) / 100 || 0;
  const l = parseFloat(parts[2]) / 100 || 0;
  
  // HSL to RGB conversion
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Convert hex to HSL string for CSS variables
export function hexToHslString(hex: string): string {
  if (!hex || hex === 'transparent') return '';
  
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '';
  
  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Get current computed value of a CSS variable
export function getCSSVariable(varName: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(`--${varName}`).trim();
  return value;
}

// Apply CSS variable override
function setCSSVariable(varName: string, value: string): void {
  document.documentElement.style.setProperty(`--${varName}`, value);
}

// Remove CSS variable override (revert to stylesheet value)
function removeCSSVariable(varName: string): void {
  document.documentElement.style.removeProperty(`--${varName}`);
}

export function useCustomTheme() {
  const [customTheme, setCustomTheme] = useState<CustomTheme | null>(null);
  const [pendingChanges, setPendingChanges] = useState<CustomTheme>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Fetch current user and their custom theme
  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }
        
        setUserId(user.id);
        
        const { data, error } = await supabase
          .from('user_preferences')
          .select('custom_theme')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (error) throw error;
        
        if (data?.custom_theme) {
          const theme = data.custom_theme as CustomTheme;
          setCustomTheme(theme);
          // Apply saved theme on load
          applyTheme(theme);
        }
      } catch (error) {
        console.error('Error fetching custom theme:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTheme();
  }, []);
  
  // Apply theme overrides to CSS variables
  const applyTheme = useCallback((theme: CustomTheme) => {
    Object.entries(theme).forEach(([key, value]) => {
      if (value) {
        setCSSVariable(key, value);
      }
    });
  }, []);
  
  // Set a single variable (for live preview)
  const setVariable = useCallback((key: string, hexValue: string) => {
    const hslValue = hexToHslString(hexValue);
    if (hslValue) {
      setCSSVariable(key, hslValue);
      setPendingChanges(prev => ({ ...prev, [key]: hslValue }));
    }
  }, []);
  
  // Check if there are unsaved changes
  const hasUnsavedChanges = Object.keys(pendingChanges).length > 0;
  
  // Get merged theme (saved + pending)
  const getMergedTheme = useCallback((): CustomTheme => {
    return { ...customTheme, ...pendingChanges };
  }, [customTheme, pendingChanges]);
  
  // Save all pending changes to database
  const saveTheme = useCallback(async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "You must be logged in to save theme changes",
        variant: "destructive",
      });
      return false;
    }
    
    setIsSaving(true);
    try {
      const mergedTheme = getMergedTheme();
      
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          custom_theme: mergedTheme,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });
      
      if (error) throw error;
      
      setCustomTheme(mergedTheme);
      setPendingChanges({});
      
      toast({
        title: "Theme saved",
        description: "Your custom theme has been saved and will persist across sessions",
      });
      
      return true;
    } catch (error) {
      console.error('Error saving theme:', error);
      toast({
        title: "Error",
        description: "Failed to save theme. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [userId, getMergedTheme, toast]);
  
  // Discard pending changes (revert to saved theme)
  const discardChanges = useCallback(() => {
    // Remove all CSS overrides
    Object.keys(pendingChanges).forEach(key => {
      removeCSSVariable(key);
    });
    
    // Re-apply saved theme
    if (customTheme) {
      applyTheme(customTheme);
    }
    
    setPendingChanges({});
  }, [pendingChanges, customTheme, applyTheme]);
  
  // Reset to default theme (clear all customizations)
  const resetToDefault = useCallback(async () => {
    if (!userId) return false;
    
    setIsSaving(true);
    try {
      // Clear all custom CSS overrides
      const allTokens = [
        ...editableTokens.core,
        ...editableTokens.brand,
        ...editableTokens.special,
        ...editableTokens.ui,
        ...editableTokens.sidebar,
      ];
      
      allTokens.forEach(token => {
        removeCSSVariable(token.key);
      });
      
      // Clear from database
      const { error } = await supabase
        .from('user_preferences')
        .update({ custom_theme: null })
        .eq('user_id', userId);
      
      if (error) throw error;
      
      setCustomTheme(null);
      setPendingChanges({});
      
      toast({
        title: "Theme reset",
        description: "Your theme has been reset to the default",
      });
      
      return true;
    } catch (error) {
      console.error('Error resetting theme:', error);
      toast({
        title: "Error",
        description: "Failed to reset theme. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [userId, toast]);
  
  // Export theme as JSON
  const exportTheme = useCallback(() => {
    const theme = getMergedTheme();
    const blob = new Blob([JSON.stringify(theme, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'custom-theme.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [getMergedTheme]);
  
  // Import theme from JSON
  const importTheme = useCallback((jsonString: string) => {
    try {
      const theme = JSON.parse(jsonString) as CustomTheme;
      applyTheme(theme);
      setPendingChanges(theme);
      toast({
        title: "Theme imported",
        description: "Theme applied. Click Save to persist your changes.",
      });
      return true;
    } catch (error) {
      toast({
        title: "Invalid file",
        description: "The file could not be parsed as a valid theme",
        variant: "destructive",
      });
      return false;
    }
  }, [applyTheme, toast]);
  
  return {
    customTheme,
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
    getMergedTheme,
  };
}
