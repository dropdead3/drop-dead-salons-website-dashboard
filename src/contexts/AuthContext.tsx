import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];
type PlatformRole = 'platform_owner' | 'platform_admin' | 'platform_support' | 'platform_developer';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: AppRole[];
  permissions: string[];
  platformRoles: PlatformRole[];
  isPlatformUser: boolean;
  isCoach: boolean;
  hasPermission: (permissionName: string) => boolean;
  hasAnyPermission: (permissionNames: string[]) => boolean;
  hasAllPermissions: (permissionNames: string[]) => boolean;
  hasPlatformRole: (role: PlatformRole) => boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, role: AppRole) => Promise<{ error: Error | null; data?: { user: User | null } }>;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [platformRoles, setPlatformRoles] = useState<PlatformRole[]>([]);

  const isCoach = roles.includes('admin') || roles.includes('manager') || roles.includes('super_admin');
  const isPlatformUser = platformRoles.length > 0;

  const fetchRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching roles:', error);
        return [];
      }

      return (data?.map(r => r.role) || []) as AppRole[];
    } catch (err) {
      console.error('Error fetching roles:', err);
      return [];
    }
  };

  const fetchPlatformRoles = async (userId: string): Promise<PlatformRole[]> => {
    try {
      const { data, error } = await supabase
        .from('platform_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching platform roles:', error);
        return [];
      }

      return (data?.map(r => r.role) || []) as PlatformRole[];
    } catch (err) {
      console.error('Error fetching platform roles:', err);
      return [];
    }
  };

  const fetchPermissions = async (userRoles: AppRole[]) => {
    if (userRoles.length === 0) return [];
    
    try {
      // Get all permissions for the user's roles
      const { data, error } = await supabase
        .from('role_permissions')
        .select(`
          permission_id,
          permissions:permission_id (
            name
          )
        `)
        .in('role', userRoles);

      if (error) {
        console.error('Error fetching permissions:', error);
        return [];
      }

      // Extract unique permission names
      const permissionNames = new Set<string>();
      data?.forEach(rp => {
        if (rp.permissions && typeof rp.permissions === 'object' && 'name' in rp.permissions) {
          permissionNames.add((rp.permissions as { name: string }).name);
        }
      });

      return Array.from(permissionNames);
    } catch (err) {
      console.error('Error fetching permissions:', err);
      return [];
    }
  };

  const refreshRoles = async () => {
    if (user) {
      const userRoles = await fetchRoles(user.id);
      setRoles(userRoles);
      // Also refresh permissions when roles change
      const userPermissions = await fetchPermissions(userRoles);
      setPermissions(userPermissions);
    }
  };

  const refreshPermissions = async () => {
    if (roles.length > 0) {
      const userPermissions = await fetchPermissions(roles);
      setPermissions(userPermissions);
    }
  };

  // Permission check helpers
  const hasPermission = useCallback((permissionName: string): boolean => {
    return permissions.includes(permissionName);
  }, [permissions]);

  const hasAnyPermission = useCallback((permissionNames: string[]): boolean => {
    return permissionNames.some(name => permissions.includes(name));
  }, [permissions]);

  const hasAllPermissions = useCallback((permissionNames: string[]): boolean => {
    return permissionNames.every(name => permissions.includes(name));
  }, [permissions]);

  const hasPlatformRole = useCallback((role: PlatformRole): boolean => {
    return platformRoles.includes(role);
  }, [platformRoles]);

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, !!session);
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to avoid Supabase deadlock on concurrent requests
          setTimeout(async () => {
            if (!mounted) return;
            const [userRoles, userPlatformRoles] = await Promise.all([
              fetchRoles(session.user.id),
              fetchPlatformRoles(session.user.id)
            ]);
            if (mounted) {
              setRoles(userRoles);
              setPlatformRoles(userPlatformRoles);
              // Fetch permissions based on roles
              const userPermissions = await fetchPermissions(userRoles);
              if (mounted) {
                setPermissions(userPermissions);
                setLoading(false);
              }
            }
          }, 0);
        } else {
          setRoles([]);
          setPermissions([]);
          setPlatformRoles([]);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', !!session);
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        Promise.all([
          fetchRoles(session.user.id),
          fetchPlatformRoles(session.user.id)
        ]).then(async ([userRoles, userPlatformRoles]) => {
          if (mounted) {
            setRoles(userRoles);
            setPlatformRoles(userPlatformRoles);
            const userPermissions = await fetchPermissions(userRoles);
            if (mounted) {
              setPermissions(userPermissions);
              setLoading(false);
            }
          }
        });
      } else {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string, role: AppRole) => {
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });
    return { 
      error: error as Error | null, 
      data: data ? { user: data.user } : undefined 
    };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]);
    setPermissions([]);
    setPlatformRoles([]);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/staff-login`,
    });
    return { error: error as Error | null };
  };

  return (
    <AuthContext.Provider
        value={{
          user,
          session,
          loading,
          roles,
          permissions,
          platformRoles,
          isPlatformUser,
          isCoach,
          hasPermission,
          hasAnyPermission,
          hasAllPermissions,
          hasPlatformRole,
          signIn,
          signUp,
          signOut,
          refreshRoles,
          refreshPermissions,
          resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
