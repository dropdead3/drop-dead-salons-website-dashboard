

## Unified Executive Intelligence Surface

### What Changes

Combine the Executive Brief (lever recommendations) and Zura AI Insights into the Executive Summary (leadership) tab in the Analytics Hub, creating a single strategic cockpit.

### Current State

| Feature | Location | Purpose |
|---|---|---|
| Executive Summary | Analytics > Leadership tab | KPI snapshot tiles + trend chart |
| Executive Brief | /dashboard/admin/executive-brief (standalone) | Weekly lever recommendation |
| AI Insights Card | Command Center dashboard | AI-generated business insights |

### Proposed Layout (Leadership Tab)

```text
+--------------------------------------------------+
|  INFOTAINER: Executive Intelligence               |
|  "Your strategic cockpit..."              [X]     |
+--------------------------------------------------+
|                                                    |
|  EXECUTIVE SUMMARY (existing KPI tiles)           |
|  Revenue | Rent | Commission | Staff | Clients    |
|  + Trend Chart                                     |
|                                                    |
+--------------------------------------------------+
|                                                    |
|  WEEKLY LEVER (from Executive Brief)              |
|  [High confidence] Increase rebooking rate        |
|  What to do: ...                                   |
|  Why now: ...                                      |
|  [Approve] [Modify] [Decline] [Snooze]            |
|                                                    |
|  --- OR if no lever ---                            |
|  Operations within thresholds (Silence State)     |
|                                                    |
+--------------------------------------------------+
|                                                    |
|  ZURA INSIGHTS (from AI Insights)                 |
|  Revenue Pulse | Capacity | Staffing | ...        |
|  Action Items | Feature Suggestions               |
|                                                    |
+--------------------------------------------------+
```

### Implementation Steps

**1. Create a Leadership Tab wrapper component**
- File: `src/components/dashboard/analytics/LeadershipTabContent.tsx`
- Composes the existing ExecutiveSummaryCard, ExecutiveTrendChart, a new inline WeeklyLeverSection, and an inline AIInsightsSection
- Each section wrapped in PinnableCard for consistency

**2. Add Weekly Lever Section**
- File: `src/components/dashboard/analytics/WeeklyLeverSection.tsx`
- Reuses the existing `WeeklyLeverBrief` and `SilenceState` components from `src/components/executive-brief/`
- Reuses the existing `useActiveRecommendation` hook
- Wrapped in a card with the standard analytics header pattern (icon + uppercase title)
- Includes a "Generate New" button (reuses `useGenerateRecommendation`)

**3. Add AI Insights Section**
- File: `src/components/dashboard/analytics/AIInsightsSection.tsx`
- Adapts the core rendering logic from `AIInsightsCard.tsx` (insight cards, action items, feature suggestions)
- Uses the existing `useAIInsights` hook
- Styled to match the analytics card pattern rather than the command center drawer style

**4. Add Infotainer to Leadership Tab**
- Add an Infotainer at the top explaining: "Your strategic cockpit -- KPI snapshot, weekly lever recommendation, and AI-powered insights in one view."

**5. Update Analytics Hub**
- File: `src/pages/dashboard/admin/AnalyticsHub.tsx`
- Replace the inline leadership tab content (lines 367-386) with the new `LeadershipTabContent` component

**6. Redirect the standalone Executive Brief page**
- File: `src/pages/dashboard/admin/ExecutiveBriefPage.tsx`
- Replace with a redirect to `/dashboard/admin/analytics?tab=leadership`
- Keep the route working so bookmarks and sidebar links don't break

### Files to Create
- `src/components/dashboard/analytics/LeadershipTabContent.tsx`
- `src/components/dashboard/analytics/WeeklyLeverSection.tsx`
- `src/components/dashboard/analytics/AIInsightsSection.tsx`

### Files to Modify
- `src/pages/dashboard/admin/AnalyticsHub.tsx` -- Use new LeadershipTabContent
- `src/pages/dashboard/admin/ExecutiveBriefPage.tsx` -- Redirect to analytics leadership tab

### No Changes Needed
- No database changes (all data sources already exist)
- No new hooks (reuses useActiveRecommendation, useAIInsights, useGenerateRecommendation)
- Executive brief components (WeeklyLeverBrief, DecisionActions, SilenceState, LeverDetailPanel) remain intact and are reused

### Design Considerations
- The lever section uses the existing WeeklyLeverBrief component unchanged, so Approve/Modify/Decline/Snooze all work identically
- AI Insights refresh button and cooldown logic carry over from the existing hook
- All sections are individually pinnable to the command center dashboard
- Visibility gates remain in place for role-based access control
