import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { useViewAs } from '@/contexts/ViewAsContext';
import { useEffectiveRoles } from '@/hooks/useEffectiveUser';
import { useQueryClient } from '@tanstack/react-query';

/**
 * OWNER EMAIL — only this user's browser state is captured.
 * Change this to your email address.
 */
const OWNER_EMAIL = 'eric@dropdeadhair.com';

/**
 * How often to send context updates (in ms).
 * 2 seconds balances responsiveness with minimal overhead.
 */
const DEBOUNCE_MS = 2000;

interface BrowserContext {
  timestamp: string;
  route: string;
  user: {
    email: string | undefined;
    id: string | undefined;
    roles: string[];
    platformRoles: string[];
    isPlatformUser: boolean;
    isCoach: boolean;
  };
  organization: {
    id: string | undefined;
    name: string | undefined;
    slug: string | undefined;
  };
  viewAs: {
    isViewingAs: boolean;
    viewAsRole: string | null;
    viewAsUser: string | null;
  };
  effectiveRoles: string[];
  queryStates: Record<string, string>;
  screenSize: {
    width: number;
    height: number;
    breakpoint: string;
  };
}

function getBreakpoint(width: number): string {
  if (width < 640) return 'mobile';
  if (width < 768) return 'sm';
  if (width < 1024) return 'md';
  if (width < 1280) return 'lg';
  if (width < 1536) return 'xl';
  return '2xl';
}

function getQueryStates(queryClient: ReturnType<typeof useQueryClient>): Record<string, string> {
  const states: Record<string, string> = {};
  const cache = queryClient.getQueryCache().getAll();

  for (const query of cache) {
    const key = Array.isArray(query.queryKey) ? query.queryKey.join('/') : String(query.queryKey);
    states[key] = query.state.status;
  }

  return states;
}

async function sendContext(context: BrowserContext): Promise<void> {
  try {
    await fetch('/__dev-context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(context),
    });
  } catch {
    // Silently fail -- dev server might not be ready yet
  }
}

/**
 * DevContextBridge captures the current browser state and sends it
 * to the Vite dev server, which writes it to .cursor/browser-context.json.
 * 
 * Cursor agents can then read that file to understand what the user
 * is currently seeing in the browser.
 * 
 * SECURITY:
 * - Only runs in development mode (import.meta.env.DEV)
 * - Only captures state for OWNER_EMAIL
 * - Only writes to local dev server (localhost)
 * - Renders nothing to the DOM
 */
export function DevContextBridge() {
  const location = useLocation();
  const { user, roles, platformRoles, isPlatformUser, isCoach } = useAuth();
  const { effectiveOrganization } = useOrganizationContext();
  const { isViewingAs, viewAsRole, viewAsUser } = useViewAs();
  const effectiveRoles = useEffectiveRoles();
  const queryClient = useQueryClient();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Gate: dev mode only
    if (!import.meta.env.DEV) return;

    // Gate: owner email only
    if (!user?.email || user.email !== OWNER_EMAIL) return;

    // Debounce: wait for state to settle after navigation
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const context: BrowserContext = {
        timestamp: new Date().toISOString(),
        route: location.pathname + location.search + location.hash,
        user: {
          email: user.email,
          id: user.id,
          roles: roles as string[],
          platformRoles: platformRoles as string[],
          isPlatformUser,
          isCoach,
        },
        organization: {
          id: effectiveOrganization?.id,
          name: effectiveOrganization?.name,
          slug: (effectiveOrganization as any)?.slug,
        },
        viewAs: {
          isViewingAs,
          viewAsRole: viewAsRole || null,
          viewAsUser: viewAsUser?.full_name || null,
        },
        effectiveRoles: effectiveRoles as string[],
        queryStates: getQueryStates(queryClient),
        screenSize: {
          width: window.innerWidth,
          height: window.innerHeight,
          breakpoint: getBreakpoint(window.innerWidth),
        },
      };

      sendContext(context);
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    location.pathname,
    location.search,
    user?.email,
    user?.id,
    roles,
    platformRoles,
    isPlatformUser,
    isCoach,
    effectiveOrganization?.id,
    isViewingAs,
    viewAsRole,
    viewAsUser,
    effectiveRoles,
  ]);

  // Renders nothing -- pure side-effect component
  return null;
}
