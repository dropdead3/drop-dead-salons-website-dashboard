import { createContext, useContext, useState, ReactNode, useCallback, useRef, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRoles, getRoleLabel } from '@/hooks/useRoles';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

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
  
  // Session ID for audit tracking
  sessionId: string | null;
}

const ViewAsContext = createContext<ViewAsContextType | undefined>(undefined);

// Generate a UUID for session tracking
function generateSessionId(): string {
  return crypto.randomUUID();
}

// Log impersonation action to database
async function logImpersonationAction(
  adminUserId: string,
  action: 'start_role' | 'start_user' | 'end' | 'switch_role' | 'switch_user',
  sessionId: string,
  targetRole?: string | null,
  targetUserId?: string | null,
  targetUserName?: string | null,
) {
  try {
    const insertData: {
      admin_user_id: string;
      action: string;
      session_id: string;
      target_role?: string;
      target_user_id?: string;
      target_user_name?: string;
    } = {
      admin_user_id: adminUserId,
      action,
      session_id: sessionId,
    };

    if (targetRole) insertData.target_role = targetRole;
    if (targetUserId) insertData.target_user_id = targetUserId;
    if (targetUserName) insertData.target_user_name = targetUserName;

    await supabase.from('impersonation_logs').insert(insertData);
  } catch (error) {
    console.error('Failed to log impersonation action:', error);
  }
}

export function ViewAsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { data: roles = [] } = useRoles();
  const [viewAsRole, setViewAsRoleState] = useState<AppRole | null>(null);
  const [viewAsUser, setViewAsUserState] = useState<ViewAsUser | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Memoize role labels lookup
  const roleLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    roles.forEach(r => { labels[r.name] = r.display_name; });
    return labels;
  }, [roles]);
  
  // Track previous state for comparison
  const prevStateRef = useRef<{ role: AppRole | null; user: ViewAsUser | null }>({
    role: null,
    user: null,
  });

  const setViewAsRole = useCallback((role: AppRole | null) => {
    const previousRole = viewAsRole;
    const wasViewingUser = !!viewAsUser;
    
    // Clear user impersonation when switching to role-based
    if (role) {
      setViewAsUserState(null);
    }
    
    setViewAsRoleState(role);
    
    // Audit logging
    if (user?.id) {
      if (role && !previousRole && !wasViewingUser) {
        // Starting new session with role
        const newSessionId = generateSessionId();
        setSessionId(newSessionId);
        logImpersonationAction(user.id, 'start_role', newSessionId, role);
        
        toast.success(`Now viewing as ${roleLabels[role] || role}`, {
          description: 'Dashboard navigation updated to match role permissions',
          icon: '👁️',
          duration: 3000,
        });
      } else if (role && (previousRole || wasViewingUser)) {
        // Switching between roles or from user to role
        const currentSessionId = sessionId || generateSessionId();
        if (!sessionId) setSessionId(currentSessionId);
        logImpersonationAction(user.id, 'switch_role', currentSessionId, role);
        
        toast.info(`Switched to ${roleLabels[role] || role}`, {
          icon: '🔄',
          duration: 2000,
        });
      } else if (!role && previousRole && !wasViewingUser) {
        // Exiting view as mode (only if not switching to user)
        if (sessionId) {
          logImpersonationAction(user.id, 'end', sessionId);
          setSessionId(null);
        }
        
        toast.success('Exited View As mode', {
          description: 'Back to your full admin permissions',
          icon: '✨',
          duration: 2000,
        });
      }
    }
  }, [viewAsRole, viewAsUser, user?.id, sessionId]);

  const setViewAsUser = useCallback((targetUser: ViewAsUser | null) => {
    const wasViewingRole = !!viewAsRole;
    const previousUser = viewAsUser;
    
    // Clear role impersonation when switching to user-based
    if (targetUser) {
      setViewAsRoleState(null);
    }
    
    setViewAsUserState(targetUser);
    
    // Audit logging
    if (user?.id) {
      if (targetUser && !previousUser && !wasViewingRole) {
        // Starting new session with user
        const newSessionId = generateSessionId();
        setSessionId(newSessionId);
        logImpersonationAction(
          user.id, 
          'start_user', 
          newSessionId, 
          null, 
          targetUser.id, 
          targetUser.full_name
        );
        
        toast.success(`Now viewing as ${targetUser.full_name}`, {
          description: 'Seeing dashboard exactly as they would see it',
          icon: '👤',
          duration: 3000,
        });
      } else if (targetUser && (previousUser || wasViewingRole)) {
        // Switching to a different user
        const currentSessionId = sessionId || generateSessionId();
        if (!sessionId) setSessionId(currentSessionId);
        logImpersonationAction(
          user.id, 
          'switch_user', 
          currentSessionId, 
          null, 
          targetUser.id, 
          targetUser.full_name
        );
        
        toast.info(`Switched to ${targetUser.full_name}`, {
          icon: '🔄',
          duration: 2000,
        });
      } else if (!targetUser && previousUser && !wasViewingRole) {
        // Exiting user impersonation (only if not switching to role)
        if (sessionId) {
          logImpersonationAction(user.id, 'end', sessionId);
          setSessionId(null);
        }
        
        toast.success('Exited View As mode', {
          description: 'Back to your full admin permissions',
          icon: '✨',
          duration: 2000,
        });
      }
    }
  }, [viewAsRole, viewAsUser, user?.id, sessionId]);

  const clearViewAs = useCallback(() => {
    const wasViewing = !!viewAsRole || !!viewAsUser;
    setViewAsRoleState(null);
    setViewAsUserState(null);
    
    // Audit logging
    if (wasViewing && user?.id && sessionId) {
      logImpersonationAction(user.id, 'end', sessionId);
      setSessionId(null);
    }
    
    if (wasViewing) {
      toast.success('Exited View As mode', {
        description: 'Back to your full admin permissions',
        icon: '✨',
        duration: 2000,
      });
    }
  }, [viewAsRole, viewAsUser, user?.id, sessionId]);

  // Update previous state ref
  useEffect(() => {
    prevStateRef.current = { role: viewAsRole, user: viewAsUser };
  }, [viewAsRole, viewAsUser]);

  // Escape key shortcut to exit impersonation mode
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger if Escape is pressed and we're currently impersonating
      if (event.key === 'Escape' && (viewAsRole !== null || viewAsUser !== null)) {
        // Don't trigger if user is typing in an input, textarea, or contenteditable
        const target = event.target as HTMLElement;
        const isEditing = 
          target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' || 
          target.isContentEditable ||
          target.closest('[role="dialog"]') !== null; // Don't close if in a modal
        
        if (!isEditing) {
          event.preventDefault();
          clearViewAs();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewAsRole, viewAsUser, clearViewAs]);

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
        sessionId,
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
