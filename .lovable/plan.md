
# Fix AI Route Generation at the Source

## Problem
The AI guidance edge function (`ai-insight-guidance`) has a `ROUTE_MAP` in its system prompt with incorrect routes (e.g., `/dashboard/admin/leaderboard` instead of `/dashboard/leaderboard`, `/dashboard/admin/clients` instead of `/dashboard/clients`). The client-side `guidanceRoutes.ts` file patches these after the fact, but that's a band-aid — the AI should never produce wrong links in the first place.

## Solution
Two changes:

### 1. Fix the ROUTE_MAP in the edge function
Update `supabase/functions/ai-insight-guidance/index.ts` to use the correct, verified routes based on actual `App.tsx` route definitions:

```text
CORRECTED ROUTES:
- Leaderboard: /dashboard/leaderboard (was /dashboard/admin/leaderboard)
- Client Directory: /dashboard/clients (was /dashboard/admin/clients)
- My Stats: /dashboard/stats (was /dashboard/my-stats)
- Inventory: /dashboard/inventory (was /dashboard/admin/inventory)
- Renter Hub: /dashboard/admin/booth-renters (was /dashboard/admin/renters)

ROUTES THAT WERE ALREADY CORRECT:
- Sales Analytics: /dashboard/admin/analytics?tab=sales
- Operations Analytics: /dashboard/admin/analytics?tab=operations
- Marketing Analytics: /dashboard/admin/analytics?tab=marketing
- Reports: /dashboard/admin/analytics?tab=reports
- Payroll Hub: /dashboard/admin/payroll
- Team Overview: /dashboard/admin/team
- Schedule: /dashboard/schedule
- Management Hub: /dashboard/admin/management
- Settings: /dashboard/admin/settings
- Command Center: /dashboard
```

Also add more useful routes the AI might want to reference:
- Help Center: /dashboard/help
- Team Chat: /dashboard/team-chat
- My Pay: /dashboard/my-pay
- Training: /dashboard/training

And add a stronger instruction to the system prompt telling the AI to **only use routes from the provided list** and never invent routes.

### 2. Keep the client-side safety net
The `guidanceRoutes.ts` normalization stays as a fallback in case the AI still hallucinates a route, but update it to match the corrected map so old cached responses still work.

## Files Changed
- `supabase/functions/ai-insight-guidance/index.ts` — Fix the ROUTE_MAP and add a strict instruction
- `src/utils/guidanceRoutes.ts` — Keep as safety net, no changes needed (already covers the corrections)

This is a one-file backend change (the edge function) that solves the problem at its root.
