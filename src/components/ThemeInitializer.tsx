import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * ThemeInitializer component
 * Loads and applies custom theme overrides from user_preferences on app load.
 * Should be placed inside AuthProvider to have access to the authenticated user.
 */
export function ThemeInitializer() {
  useEffect(() => {
    const loadCustomTheme = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data, error } = await supabase
          .from('user_preferences')
          .select('custom_theme')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (error) {
          console.error('Error loading custom theme:', error);
          return;
        }
        
        if (data?.custom_theme && typeof data.custom_theme === 'object') {
          const theme = data.custom_theme as Record<string, string>;
          // Apply each CSS variable override
          Object.entries(theme).forEach(([key, value]) => {
            if (value && typeof value === 'string') {
              document.documentElement.style.setProperty(`--${key}`, value);
            }
          });
        }
      } catch (error) {
        console.error('Error initializing custom theme:', error);
      }
    };
    
    loadCustomTheme();
    
    // Also listen for auth state changes to reload theme when user logs in
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        loadCustomTheme();
      } else if (event === 'SIGNED_OUT') {
        // Clear custom CSS variables on sign out
        // Get all custom CSS properties and remove them
        const style = document.documentElement.style;
        const propsToRemove: string[] = [];
        for (let i = 0; i < style.length; i++) {
          const prop = style[i];
          if (prop.startsWith('--')) {
            propsToRemove.push(prop);
          }
        }
        propsToRemove.forEach(prop => style.removeProperty(prop));
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // This component doesn't render anything
  return null;
}
