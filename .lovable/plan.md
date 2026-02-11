
# Add Save + Remind Me + Share to All AI Insight Surfaces

## Overview

The "Save + Remind Me + Share" actions you built for the Sales Goal Recovery plan are powerful -- but they only live in one place. Three other AI surfaces generate equally actionable content that would benefit from the same treatment:

1. **Zura Card Insights** (the per-card AI analysis dialogs on every dashboard metric card)
2. **Business Insights Guidance Panel** (the "How to Improve" / "What You Should Do" slide-over for leadership)
3. **Personal Insights Guidance Panel** (same slide-over but for individual contributors)

## What Changes

### 1. Zura Card Insight Dialog (`ZuraCardInsight.tsx`)
- Add a footer action bar (Save Plan + Remind Me + Share dropdown) below the existing "Powered by Zura AI" footer
- Reuse the `RecoveryPlanActions` component, passing the card's `insight` text as `content` and the `cardName` as `title`
- The share flow will open the same `ShareToDMDialog` to pitch the analysis to leadership

### 2. Guidance Panel (`GuidancePanel.tsx`)
- Add `RecoveryPlanActions` between the existing `SuggestedTasksSection` and the footer
- The guidance text (markdown) becomes the `content`, and the panel `title` becomes the plan title
- This covers both the Business and Personal Insights drawers since they both render `GuidancePanel`

### 3. Make `RecoveryPlanActions` Generic
- Currently the component is tightly coupled to sales recovery (props like `targetRevenue`, `shortfall`, `goalPeriod`)
- Make those optional so it can accept any AI-generated content
- Add a `planType` prop (e.g., `'recovery'`, `'card_insight'`, `'guidance'`) that gets stored in the `saved_recovery_plans` table for filtering later

### 4. Database: Add `plan_type` Column
- Add a `plan_type TEXT DEFAULT 'recovery'` column to `saved_recovery_plans` so saved items can be categorized and filtered in any future "Saved Plans" view

## Where Each Surface Gets Actions

| Surface | Save | Remind Me | Share/Pitch |
|---------|------|-----------|-------------|
| Sales Recovery Dialog | Already done | Already done | Already done |
| Zura Card Insight Dialog | New | New | New |
| Business Insights Guidance | New | New | New |
| Personal Insights Guidance | New | New | New |

## Technical Details

### Files Modified
- `src/components/dashboard/sales/RecoveryPlanActions.tsx` -- make `goalPeriod`, `targetRevenue`, `currentRevenue`, `shortfall` optional; add `planType` prop
- `src/components/dashboard/ZuraCardInsight.tsx` -- add `RecoveryPlanActions` in the dialog footer area
- `src/components/dashboard/GuidancePanel.tsx` -- add `RecoveryPlanActions` below content/tasks section

### Database Migration
- `ALTER TABLE saved_recovery_plans ADD COLUMN plan_type TEXT DEFAULT 'recovery'`

### No New Files
All changes reuse the existing `RecoveryPlanActions` and `ShareToDMDialog` components.
