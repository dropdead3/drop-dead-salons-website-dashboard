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

// Represents a user being impersonated
export interface ViewAsUser {
  id: string;
  full_name: string;
  photo_url?: string | null;
  roles: AppRole[];
}

interface ViewAsContextType {
  // Role-based impersonation
  viewAsRole: AppRole | null;
  setViewAsRole: (role: AppRole | null) => void;
  isViewingAs: boolean;
  
  // User-specific impersonation (super admin only)
  viewAsUser: ViewAsUser | null;
  setViewAsUser: (user: ViewAsUser | null) => void;
  isViewingAsUser: boolean;
  
  // Clear all impersonation
  clearViewAs: () => void;
}

const ViewAsContext = createContext<ViewAsContextType | undefined>(undefined);

export function ViewAsProvider({ children }: { children: ReactNode }) {
  const [viewAsRole, setViewAsRoleState] = useState<AppRole | null>(null);
  const [viewAsUser, setViewAsUserState] = useState<ViewAsUser | null>(null);

  const setViewAsRole = useCallback((role: AppRole | null) => {
    const previousRole = viewAsRole;
    const wasViewingUser = !!viewAsUser;
    
    // Clear user impersonation when switching to role-based
    if (role) {
      setViewAsUserState(null);
    }
    
    setViewAsRoleState(role);
    
    if (role && !previousRole && !wasViewingUser) {
      // Entering view as mode
      toast.success(`Now viewing as ${ROLE_LABELS[role]}`, {
        description: 'Dashboard navigation updated to match role permissions',
        icon: '👁️',
        duration: 3000,
      });
    } else if (role && (previousRole || wasViewingUser)) {
      // Switching between roles or from user to role
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
  }, [viewAsRole, viewAsUser]);

  const setViewAsUser = useCallback((user: ViewAsUser | null) => {
    const wasViewingRole = !!viewAsRole;
    const previousUser = viewAsUser;
    
    // Clear role impersonation when switching to user-based
    if (user) {
      setViewAsRoleState(null);
    }
    
    setViewAsUserState(user);
    
    if (user && !previousUser && !wasViewingRole) {
      // Entering user impersonation
      toast.success(`Now viewing as ${user.full_name}`, {
        description: 'Seeing dashboard exactly as they would see it',
        icon: '👤',
        duration: 3000,
      });
    } else if (user && (previousUser || wasViewingRole)) {
      // Switching to a different user
      toast.info(`Switched to ${user.full_name}`, {
        icon: '🔄',
        duration: 2000,
      });
    } else if (!user && previousUser) {
      // Exiting user impersonation
      toast.success('Exited View As mode', {
        description: 'Back to your full admin permissions',
        icon: '✨',
        duration: 2000,
      });
    }
  }, [viewAsRole, viewAsUser]);

  const clearViewAs = useCallback(() => {
    const wasViewing = !!viewAsRole || !!viewAsUser;
    setViewAsRoleState(null);
    setViewAsUserState(null);
    
    if (wasViewing) {
      toast.success('Exited View As mode', {
        description: 'Back to your full admin permissions',
        icon: '✨',
        duration: 2000,
      });
    }
  }, [viewAsRole, viewAsUser]);

  return (
    <ViewAsContext.Provider
      value={{
        viewAsRole,
        setViewAsRole,
        isViewingAs: viewAsRole !== null || viewAsUser !== null,
        viewAsUser,
        setViewAsUser,
        isViewingAsUser: viewAsUser !== null,
        clearViewAs,
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
