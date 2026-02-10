
# Zura AI Insights Button on Analytics Cards

## Overview
Add a small Zura AI icon button to every analytics card (via the `PinnableCard` wrapper) that opens a popover/drawer with contextual AI analysis of that specific card's data -- explaining what the metric is, surfacing trends, historical comparisons, and actionable insights.

## How It Works

1. **User sees a small "Z" icon** on each analytics card (next to the existing gear/pin icon)
2. **User clicks the icon** and a slide-over panel or popover opens with Zura's analysis
3. **Zura explains**: what the metric means, current trends, how it compares to previous periods, and what action to take
4. **Data is contextual**: each card passes its own metric name, current value, and any comparison data to the AI

## Changes

### 1. New Edge Function: `ai-card-analysis`
A new backend function that accepts a card's context (metric name, current values, date range, trends) and returns a focused AI analysis.

**File:** `supabase/functions/ai-card-analysis/index.ts`
- Accepts: `{ cardName, metricData, dateRange, locationName }`
- Uses the Lovable AI gateway (Gemini 3 Flash Preview) with a system prompt specialized for explaining salon analytics cards
- Returns a concise markdown response covering:
  - What this metric means in plain language
  - Current performance assessment
  - Trend direction and historical comparison
  - One or two actionable recommendations
- Includes the verified route map so links work correctly

### 2. New Hook: `useCardInsight`
A React hook to call the edge function and manage loading/caching state.

**File:** `src/hooks/useCardInsight.ts`
- Accepts `cardId`, `cardName`, `metricData` (key-value pairs of the card's displayed numbers)
- Calls the `ai-card-analysis` edge function
- Caches results per card ID + date range so repeat clicks don't re-fetch
- Returns `{ insight, isLoading, fetchInsight }`

### 3. New Component: `ZuraCardInsight`
A small button + popover that displays the AI analysis.

**File:** `src/components/dashboard/ZuraCardInsight.tsx`
- Renders a small Zura "Z" avatar button (uses existing `ZuraAvatar` component)
- On click, calls `fetchInsight()` and shows a popover/sheet with:
  - Loading skeleton while fetching
  - Rendered markdown response (using `react-markdown`)
  - "Powered by Zura AI" footer
- Styled consistently with the existing Zura design language (violet accents, `font-display` headers)

### 4. Update `PinnableCard` to Include Zura Button
Add the `ZuraCardInsight` button alongside the existing pin/gear icon.

**File:** `src/components/dashboard/PinnableCard.tsx`
- Accept optional `metricData` prop (Record of string to number/string for current card values)
- Render `<ZuraCardInsight>` next to the existing `CommandCenterVisibilityToggle`
- The button appears on hover, same as the gear icon

### 5. Pass Metric Data from Analytics Cards
Update key analytics cards to pass their displayed metrics through to `PinnableCard`.

**Files affected** (examples):
- `src/components/dashboard/analytics/SalesTabContent.tsx` -- pass revenue, transaction count, avg ticket
- `src/components/dashboard/analytics/AppointmentsContent.tsx` -- pass booking count, utilization %
- `src/components/dashboard/analytics/OperationsTabContent.tsx` -- pass operational metrics
- Other cards that use `PinnableCard`

Each card passes a simple object like:
```
metricData={{
  "Total Revenue": "$12,450",
  "Transactions": "87",
  "Avg Ticket": "$143"
}}
```

## Technical Details

### Edge Function System Prompt
The AI will be instructed to:
- Explain the metric in plain, non-technical language (suitable for all salon personas)
- Keep responses concise (150-250 words max)
- Highlight whether performance is strong, average, or needs attention
- Compare to industry benchmarks where applicable (salon industry averages)
- Provide 1-2 specific, actionable next steps
- Use the verified route map for any internal links

### Caching Strategy
- Results cached in React Query with a 10-minute stale time per card + date range combination
- No database persistence needed -- these are ephemeral, on-demand analyses

### UI Placement
The Zura icon sits in the top-right corner of each card, alongside the existing gear icon:
```
[Card Title]                    [Z] [gear]
[Card Content...]
```

### Files Created
- `supabase/functions/ai-card-analysis/index.ts` -- new edge function
- `src/hooks/useCardInsight.ts` -- new hook
- `src/components/dashboard/ZuraCardInsight.tsx` -- new component

### Files Modified
- `src/components/dashboard/PinnableCard.tsx` -- add Zura button
- `src/components/dashboard/analytics/SalesTabContent.tsx` -- pass metric data
- `src/components/dashboard/analytics/AppointmentsContent.tsx` -- pass metric data
- `src/components/dashboard/analytics/OperationsTabContent.tsx` -- pass metric data
- `supabase/config.toml` -- register new edge function
