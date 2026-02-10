

# Role-Gated Personal AI Insights for All Users

## Overview

Every team member gets valuable, contextualized AI insights from Zura based only on data they have permission to see. The system dynamically adapts to role and permission changes -- no stale or unauthorized data.

## How Role Reactivity Works

- The edge function checks the user's **current roles** from the `user_roles` table on every request -- not a cached copy
- Data queries are filtered by role tier at execution time, so a promotion from Stylist to Manager immediately unlocks leadership-tier insights on the next refresh
- Cached insights expire after a configurable TTL (e.g., 6 hours)
- When a role changes (via `useToggleUserRole`), the user's cached personal insights are invalidated so they get fresh, role-appropriate data on their next visit

## Data Access by Role Tier

| Data Category | Leadership (Owner/Admin/Manager) | Stylist / Assistant | Booth Renter | Front Desk |
|---|---|---|---|---|
| Org revenue and financials | Yes | No | No | No |
| All staff performance | Yes | No | No | No |
| Own appointments and rebook rate | Yes | Yes | Yes | Limited |
| Own retail/product sales | Yes | Yes | Yes | No |
| Client retention (own book) | Yes | Yes | Yes | No |
| Schedule gaps and utilization (own) | Yes | Yes | Yes | No |
| Org-wide anomalies | Yes | No | No | No |
| Today's appointment queue | Yes | No | No | Yes |
| No-show/cancellation (own) | Yes | Yes | Yes | Yes |

## Insight Categories by Role

**Stylist / Stylist Assistant:**
- Personal rebooking rate vs. target
- Retail attachment rate for their clients
- Client retention trends (own book)
- Schedule utilization and gaps
- Personal growth tips (average ticket, service mix)

**Booth Renter:**
- Appointment volume trends
- Client retention for their book
- Schedule optimization
- Revenue trends (own only)

**Front Desk / Receptionist:**
- Daily appointment flow and gaps
- No-show and cancellation patterns
- Rebooking rate at checkout

## Technical Implementation

### 1. Database Migration: `ai_personal_insights` Table

New table to cache per-user insights with strict RLS:

```text
ai_personal_insights
  id          uuid (PK, default gen_random_uuid())
  user_id     uuid (not null)
  organization_id uuid
  insights    jsonb (same AIInsightsData structure)
  role_tier   text (the role tier used to generate -- for cache invalidation)
  generated_at timestamptz
  expires_at  timestamptz
  created_at  timestamptz (default now())
```

RLS policy: `SELECT/INSERT/UPDATE/DELETE WHERE user_id = auth.uid()` -- users can only ever access their own cached insights.

### 2. New Edge Function: `ai-personal-insights`

Separate from `ai-business-insights` to maintain clean separation of concerns:

- Authenticates user via JWT
- Queries `user_roles` for the user's current roles (real-time, not cached)
- Determines role tier: leadership vs. stylist vs. booth_renter vs. front_desk
- Fetches ONLY data owned by the user (`staff_user_id = user.id` on all queries)
- System prompt explicitly instructs Zura: "You are a personal performance coach. Never reference organizational revenue, other staff members' performance, or financial data you were not given."
- Returns structured insights via tool calling with personal categories
- Caches in `ai_personal_insights` keyed by user_id

### 3. New Hook: `usePersonalInsights`

Mirrors the existing `useAIInsights` pattern:
- Checks for cached insights in `ai_personal_insights` (where `user_id = current user` and not expired)
- If stale or missing, calls `ai-personal-insights` edge function
- Returns the same `AIInsightsData` shape so UI components stay consistent
- Exposes `isLoading`, `data`, `refresh` states

### 4. New Component: `PersonalInsightsDrawer`

A simplified version of `AIInsightsDrawer` branded as "Zura Personal Insights":
- Categories: "My Performance", "My Clients", "My Schedule", "Growth Tips"
- No revenue pulse, no cash flow, no staff comparisons
- Same visual style (sentiment icon, expandable items, guidance links)
- Guidance links filtered to only routes the role can access (My Stats, Schedule, Client Directory, Leaderboard -- never admin pages)

### 5. Dashboard Integration (`DashboardHome.tsx`)

Conditional rendering based on role:
- Leadership roles (super_admin, admin, manager): existing `AIInsightsDrawer` with org-wide data (unchanged)
- All other roles: new `PersonalInsightsDrawer` with personal data only
- Both use the same visual placement and interaction patterns

### 6. Cache Invalidation on Role Change

Update `useToggleUserRole` in `src/hooks/useUserRoles.ts`:
- After a successful role toggle, delete the affected user's rows from `ai_personal_insights`
- This forces a fresh generation on their next dashboard visit with their new role's data tier
- Implemented as an additional `.delete()` call in the mutation's `onSuccess`

### 7. Personal Guidance Route Map

The edge function's route map for personal insights only includes non-admin routes:
- My Stats: `/dashboard/stats`
- Schedule: `/dashboard/schedule`
- Clients: `/dashboard/clients`
- Leaderboard: `/dashboard/leaderboard`
- My Pay: `/dashboard/my-pay`
- Training: `/dashboard/training`
- Profile: `/dashboard/profile`

No admin, analytics, payroll, or settings routes are included.

## Files to Create

1. `supabase/functions/ai-personal-insights/index.ts` -- role-aware edge function
2. `src/hooks/usePersonalInsights.ts` -- client hook
3. `src/components/dashboard/PersonalInsightsDrawer.tsx` -- UI for non-leadership users

## Files to Modify

4. `src/pages/dashboard/DashboardHome.tsx` -- conditional rendering by role
5. `src/hooks/useUserRoles.ts` -- cache invalidation on role change

## Database Changes

6. Migration: create `ai_personal_insights` table with RLS policies

## Security Guarantees

- Edge function uses `staff_user_id = user.id` on ALL data queries
- No org-wide revenue, payroll, or staff comparison data is fetched for non-leadership roles
- System prompt explicitly prohibits referencing organizational financials
- RLS on cache table: users only see their own insights
- Role determination happens at request time from `user_roles` table (not cached client-side)
- Cache is invalidated when roles change, preventing stale cross-role data leakage
- Guidance links are restricted to routes the role can access

