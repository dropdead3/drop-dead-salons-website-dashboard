import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface HideNumbersContextType {
  hideNumbers: boolean;
  toggleHideNumbers: () => void;
  isLoading: boolean;
}

const HideNumbersContext = createContext<HideNumbersContextType | undefined>(undefined);

export function HideNumbersProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [hideNumbers, setHideNumbers] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load preference from database on mount
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const loadPreference = async () => {
      try {
        const { data, error } = await supabase
          .from('employee_profiles')
          .select('hide_numbers')
          .eq('user_id', user.id)
          .single();

        if (!error && data) {
          setHideNumbers(data.hide_numbers ?? false);
        }
      } catch (err) {
        console.error('Error loading hide_numbers preference:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreference();
  }, [user]);

  const toggleHideNumbers = async () => {
    if (!user) return;

    const newValue = !hideNumbers;
    setHideNumbers(newValue);

    // Persist to database
    try {
      await supabase
        .from('employee_profiles')
        .update({ hide_numbers: newValue })
        .eq('user_id', user.id);
    } catch (err) {
      console.error('Error saving hide_numbers preference:', err);
      // Revert on error
      setHideNumbers(!newValue);
    }
  };

  return (
    <HideNumbersContext.Provider value={{ hideNumbers, toggleHideNumbers, isLoading }}>
      {children}
    </HideNumbersContext.Provider>
  );
}

export function useHideNumbers() {
  const context = useContext(HideNumbersContext);
  if (context === undefined) {
    throw new Error('useHideNumbers must be used within a HideNumbersProvider');
  }
  return context;
}

// Utility component for blurring dollar amounts with tooltip hint
interface BlurredAmountProps {
  children: ReactNode;
  className?: string;
  as?: 'span' | 'p' | 'div';
}

export function BlurredAmount({ 
  children, 
  className,
  as: Component = 'span'
}: BlurredAmountProps) {
  const { hideNumbers } = useHideNumbers();
  
  if (!hideNumbers) {
    return <Component className={className}>{children}</Component>;
  }
  
  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <Component className={cn(className, 'blur-md select-none cursor-help')} tabIndex={0}>
          {children}
        </Component>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs z-[100]">
        Click the eye icon in the top menu to reveal
      </TooltipContent>
    </Tooltip>
  );
}

// Legacy alias for backwards compatibility
export const BlurredNumber = BlurredAmount;
