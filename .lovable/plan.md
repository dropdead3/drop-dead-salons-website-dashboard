

# AI Business Insights Card for Command Center

## What This Does
Adds an intelligent "AI Business Insights" card to the Command Center dashboard that provides salon owners with a curated, AI-generated summary of their business health. Instead of owners having to check multiple analytics pages, this card proactively surfaces the most important things they need to know -- right on the homepage.

## Insight Categories

The AI will analyze available data and generate insights across these areas:

1. **Revenue Pulse** -- How is money flowing? Is today/this week tracking above or below average? Any concerning trends?
2. **Cash Flow Watch** -- Are there upcoming slow periods based on booking gaps? Revenue forecast warnings?
3. **Capacity Alerts** -- Are stylists overbooked or underbooked? Is there idle chair time being wasted?
4. **Staffing Flags** -- High no-show or cancellation rates? Unbalanced workloads across team members?
5. **Client Health** -- Rebooking rate trends, client retention signals, at-risk client warnings
6. **Anomaly Summary** -- Any active anomalies detected (revenue drops, cancellation spikes, etc.)
7. **Actionable Recommendations** -- 2-3 specific actions the owner can take today

## How It Works

```text
+------------------------------------------+
|  AI Business Insights            Refresh  |
|  Last updated: 2 hours ago               |
|                                          |
|  [Revenue Pulse]                         |
|  Revenue is tracking 12% above last      |
|  week's average. Strong Wednesday.       |
|                                          |
|  [Capacity Alert]                        |
|  Thursday has 3 open chair-hours.        |
|  Consider promoting last-minute deals.   |
|                                          |
|  [Action Items]                          |
|  1. Follow up with 8 clients overdue     |
|     for rebooking                        |
|  2. Review Thursday staffing levels      |
|                                          |
|  Powered by AI  ·  Based on your data    |
+------------------------------------------+
```

## Technical Approach

### 1. New Edge Function: `ai-business-insights`
- Gathers data from multiple sources in one call:
  - `phorest_daily_sales_summary` (recent revenue trends)
  - `appointments` (booking patterns, no-shows, cancellations, capacity)
  - `revenue_forecasts` (forward-looking projections)
  - `detected_anomalies` (active unacknowledged alerts)
  - `scheduling_suggestions` (pending AI scheduling recommendations)
  - `employee_profiles` (staff count for capacity math)
- Sends a structured prompt to Lovable AI (Gemini 3 Flash Preview) with tool calling to extract a typed JSON response
- Caches results in a new `ai_business_insights` table (one row per org, refreshed at most every 2 hours)
- Returns the cached result if still fresh, avoiding unnecessary AI calls

### 2. New Database Table: `ai_business_insights`
```sql
CREATE TABLE ai_business_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  location_id TEXT,
  insights JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```
- RLS: Accessible to authenticated org members
- Unique constraint on (organization_id, location_id) for upsert behavior

### 3. New React Components
- **`AIInsightsCard`** (`src/components/dashboard/AIInsightsCard.tsx`)
  - Displays categorized insight cards with icons and severity coloring
  - "Refresh" button with cooldown timer
  - Loading skeleton state
  - Blurs monetary values when hide-numbers is active
  - Integrates with `VisibilityGate` and `PinnableCard` for Command Center pinning
  - Respects the premium design system (cream/black theme, font-medium max, rounded-2xl)

- **`useAIInsights` hook** (`src/hooks/useAIInsights.ts`)
  - Fetches cached insights from the table first
  - Triggers edge function if stale or missing
  - 2-hour stale time to avoid excessive AI calls

### 4. Dashboard Integration
- Add as a new section type in `DashboardHome.tsx` section components map
- Register in the widget/section system so users can reorder or hide it
- Add to `VisibilityGate` registration for role-based access control
- Only visible to leadership roles (super_admin, admin, manager)

### 5. Edge Function: Prompt Design
The prompt will use tool calling to return structured output with these fields:
- `insights[]` -- Array of insight objects, each with: `category`, `title`, `description`, `severity` (info/warning/critical), `icon` hint
- `actionItems[]` -- Array of recommended actions with priority
- `overallSentiment` -- "positive" | "neutral" | "concerning"
- `summaryLine` -- One-sentence executive summary

### 6. Privacy and Blurring
- All monetary values in insights will be wrapped with `BlurredAmount` / the hide-numbers system
- The card will include the click-to-reveal pattern already established in the forecasting card

### Files to Create
1. `supabase/functions/ai-business-insights/index.ts` -- Edge function
2. `src/hooks/useAIInsights.ts` -- Data fetching hook
3. `src/components/dashboard/AIInsightsCard.tsx` -- UI component

### Files to Modify
1. `src/pages/dashboard/DashboardHome.tsx` -- Add to section components map
2. Database migration -- Create `ai_business_insights` table with RLS

