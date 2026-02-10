

# Fix Broken AI Guidance Links -- Route Validation

## Problem

Zura's AI guidance generates markdown links using a `ROUTE_MAP` defined in edge functions. Two issues exist:

1. **Wrong routes in the ROUTE_MAP itself** -- e.g., "Phorest Connection" points to `/dashboard/admin/settings/phorest` but the actual route is `/dashboard/admin/phorest`. Similarly, "Integrations" points to `/dashboard/admin/settings/integrations` and "Day Rates" to `/dashboard/admin/settings/day-rates`, neither of which exist as app routes.

2. **No client-side validation** -- the `normalizeGuidanceRoute` utility corrects *some* known bad routes, but it doesn't cover all cases, and the AI can still hallucinate routes not in the map at all.

## Solution (3 layers of defense)

### Layer 1: Fix the ROUTE_MAP in Edge Functions

Update the route reference in both `ai-insight-guidance` and `ai-card-analysis` edge functions:

| Label | Current (wrong) | Correct |
|-------|-----------------|---------|
| Phorest Connection | `/dashboard/admin/settings/phorest` | `/dashboard/admin/phorest` |
| Integrations | `/dashboard/admin/settings/integrations` | `/dashboard/admin/settings` (no separate integrations page; Settings is the closest) |
| Day Rates | `/dashboard/admin/settings/day-rates` | `/dashboard/admin/day-rate-settings` |

### Layer 2: Update the client-side correction map

Add these corrections to `src/utils/guidanceRoutes.ts` so even cached or in-flight AI responses get fixed:

```
'/dashboard/admin/settings/phorest' -> '/dashboard/admin/phorest'
'/dashboard/admin/settings/integrations' -> '/dashboard/admin/settings'
'/dashboard/admin/settings/day-rates' -> '/dashboard/admin/day-rate-settings'
```

### Layer 3: Add a valid-route whitelist check

Create a set of all known valid route prefixes in `guidanceRoutes.ts`. In the `GuidancePanel` link renderer, if a normalized route doesn't match any known prefix, render it as plain text (no link) instead of a broken navigation link. This prevents any future AI-hallucinated routes from producing 404s.

## Files Changed

1. **`supabase/functions/ai-insight-guidance/index.ts`** -- fix 3 routes in `ROUTE_MAP`
2. **`supabase/functions/ai-card-analysis/index.ts`** -- fix same 3 routes in `ROUTE_MAP`
3. **`src/utils/guidanceRoutes.ts`** -- add 3 new correction entries + export a `VALID_ROUTE_PREFIXES` set
4. **`src/components/dashboard/GuidancePanel.tsx`** -- validate normalized route against whitelist; render plain text if invalid

