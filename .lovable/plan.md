

# Smart Feature & Integration Adoption Suggestions in AI Insights

## Overview
Enhance the AI Business Insights system to detect which platform features and integrations the organization is **not** using, then surface tailored suggestions explaining why each would help and how to get started. Account owners can dismiss each suggestion for 30 days, with dismissals persisted in the database.

## How It Works
1. When AI insights are generated, the edge function fetches the organization's enabled features (from `organization_features`) and connected integrations (from `payroll_connections`, `locations` with Phorest)
2. It compares against the full `feature_catalog` and known integrations to identify gaps
3. This "adoption gaps" data is included in the AI prompt so the model can generate targeted suggestions
4. Suggestions appear as a new section in the insights UI, styled distinctly from regular insights
5. Each suggestion has a dismiss button; dismissing writes to a new `dismissed_insight_suggestions` table with a 30-day expiry
6. Dismissed suggestions are filtered out on the frontend before rendering

## Database Changes

### New table: `dismissed_insight_suggestions`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Default gen_random_uuid() |
| organization_id | uuid (FK) | References organizations |
| user_id | uuid | The user who dismissed |
| suggestion_key | text | Unique key, e.g. "feature:loyalty_program" or "integration:stripe" |
| dismissed_at | timestamptz | Default now() |
| expires_at | timestamptz | dismissed_at + 30 days |
| created_at | timestamptz | Default now() |

RLS: Users can read/insert/delete their own rows (matched via `auth.uid() = user_id`).

## Edge Function Changes (`ai-business-insights/index.ts`)

1. **Fetch adoption data** alongside existing queries:
   - Query `feature_catalog` for all non-core features
   - Query `organization_features` for the org to see which are explicitly disabled
   - Query `payroll_connections` and `locations` (Phorest branch IDs) for integration status
2. **Build an "Unused Features & Integrations" section** in the data context sent to the AI
3. **Expand the tool schema** to include a new `featureSuggestions` array in the structured output:
   ```
   featureSuggestions: [{
     suggestionKey: string,    // e.g. "feature:loyalty_program"
     featureName: string,      // e.g. "Loyalty & Rewards"
     whyItHelps: string,       // 1-2 sentences on business value
     howToStart: string,       // Brief getting-started guidance
     priority: "high" | "medium" | "low"
   }]
   ```
4. **Update the system prompt** to instruct the AI to identify 2-4 most impactful unused features/integrations based on the business data patterns

## Frontend Changes

### Update `useAIInsights.ts`
- Add `FeatureSuggestion` interface to the `AIInsightsData` type
- The `featureSuggestions` field becomes part of the cached insights data

### New hook: `useDismissedSuggestions.ts`
- Fetches dismissed suggestions for the current user from `dismissed_insight_suggestions` where `expires_at > now()`
- Provides a `dismiss(suggestionKey)` function that inserts a row with `expires_at = now + 30 days`
- Provides a `dismissedKeys: Set<string>` for quick lookup
- Invalidates the query on dismiss

### Update `AIInsightsDrawer.tsx` and `AIInsightsCard.tsx`
- Import and use `useDismissedSuggestions`
- Filter out dismissed suggestions before rendering
- Add a new "Suggested for You" section below Action Items with a distinct style (e.g., dashed border, puzzle-piece or lightbulb icon)
- Each suggestion card shows:
  - Feature/integration name and icon
  - "Why it helps" text
  - "How to start" text
  - A dismiss button (X icon) with tooltip "Dismiss for 30 days"
  - A "How to improve" guidance trigger (same slide-over pattern)
- Dismissing a suggestion animates it out and writes to the database

### Suggestion Card Design
- Dashed border with a subtle gradient background (distinct from insight cards)
- Puzzle piece or Zap icon to indicate "adoption opportunity"
- Dismiss button in top-right corner
- Same guidance trigger pattern for detailed help

## Files to Create
- `src/hooks/useDismissedSuggestions.ts` -- hook for managing 30-day dismissals

## Files to Modify
- `supabase/functions/ai-business-insights/index.ts` -- add feature/integration gap detection and expanded tool schema
- `src/hooks/useAIInsights.ts` -- add `FeatureSuggestion` type to `AIInsightsData`
- `src/components/dashboard/AIInsightsDrawer.tsx` -- render feature suggestions section with dismiss
- `src/components/dashboard/AIInsightsCard.tsx` -- same changes for the pinnable card

## Database Migration
- Create `dismissed_insight_suggestions` table with RLS policies

