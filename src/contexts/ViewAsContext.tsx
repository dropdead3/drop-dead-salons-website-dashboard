import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Admin',
  manager: 'Manager',
  stylist: 'Stylist',
  receptionist: 'Receptionist',
  assistant: 'Assistant', // Legacy
  stylist_assistant: 'Stylist Assistant',
  admin_assistant: 'Admin Assistant',
  operations_assistant: 'Operations Assistant',
};

interface ViewAsContextType {
  viewAsRole: AppRole | null;
  setViewAsRole: (role: AppRole | null) => void;
  isViewingAs: boolean;
}

const ViewAsContext = createContext<ViewAsContextType | undefined>(undefined);

export function ViewAsProvider({ children }: { children: ReactNode }) {
  const [viewAsRole, setViewAsRoleState] = useState<AppRole | null>(null);

  const setViewAsRole = useCallback((role: AppRole | null) => {
    const previousRole = viewAsRole;
    setViewAsRoleState(role);
    
    if (role && !previousRole) {
      // Entering view as mode
      toast.success(`Now viewing as ${ROLE_LABELS[role]}`, {
        description: 'Dashboard navigation updated to match role permissions',
        icon: '👁️',
        duration: 3000,
      });
    } else if (role && previousRole) {
      // Switching between roles
      toast.info(`Switched to ${ROLE_LABELS[role]}`, {
        icon: '🔄',
        duration: 2000,
      });
    } else if (!role && previousRole) {
      // Exiting view as mode
      toast.success('Exited View As mode', {
        description: 'Back to your full admin permissions',
        icon: '✨',
        duration: 2000,
      });
    }
  }, [viewAsRole]);

  return (
    <ViewAsContext.Provider
      value={{
        viewAsRole,
        setViewAsRole,
        isViewingAs: viewAsRole !== null,
      }}
    >
      {children}
    </ViewAsContext.Provider>
  );
}

export function useViewAs() {
  const context = useContext(ViewAsContext);
  if (context === undefined) {
    throw new Error('useViewAs must be used within a ViewAsProvider');
  }
  return context;
}
