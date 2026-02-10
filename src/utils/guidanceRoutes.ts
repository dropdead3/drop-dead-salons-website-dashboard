/**
 * AI-generated guidance text sometimes produces incorrect dashboard routes.
 * This map corrects known mismatches to actual app routes.
 */
const ROUTE_CORRECTIONS: Record<string, string> = {
  '/dashboard/admin/leaderboard': '/dashboard/leaderboard',
  '/dashboard/admin/stats': '/dashboard/stats',
  '/dashboard/admin/training': '/dashboard/training',
  '/dashboard/admin/schedule': '/dashboard/schedule',
  '/dashboard/admin/team-chat': '/dashboard/team-chat',
  '/dashboard/admin/profile': '/dashboard/profile',
  '/dashboard/admin/my-pay': '/dashboard/my-pay',
  '/dashboard/admin/ring-the-bell': '/dashboard/ring-the-bell',
  '/dashboard/admin/program': '/dashboard/program',
  '/dashboard/admin/onboarding': '/dashboard/onboarding',
  '/dashboard/admin/directory': '/dashboard/directory',
  '/dashboard/admin/clients': '/dashboard/clients',
  '/dashboard/admin/shift-swaps': '/dashboard/shift-swaps',
  '/dashboard/admin/rewards': '/dashboard/rewards',
  '/dashboard/admin/help': '/dashboard/help',
  '/dashboard/admin/assistant-schedule': '/dashboard/assistant-schedule',
  '/dashboard/admin/schedule-meeting': '/dashboard/schedule-meeting',
  '/dashboard/settings': '/dashboard/admin/settings',
  '/dashboard/integrations': '/dashboard/admin/settings',
};

/**
 * Normalize a route from AI-generated guidance to an actual app route.
 */
export function normalizeGuidanceRoute(href: string): string {
  // Exact match
  if (ROUTE_CORRECTIONS[href]) {
    return ROUTE_CORRECTIONS[href];
  }
  
  // Check if any correction key is a prefix match (for routes with query params/hash)
  for (const [wrong, correct] of Object.entries(ROUTE_CORRECTIONS)) {
    if (href.startsWith(wrong + '?') || href.startsWith(wrong + '#')) {
      return correct + href.slice(wrong.length);
    }
  }
  
  return href;
}
