

# Add "Get Back on Track" Zura AI Button to Behind-Pace Goal Indicator

## Overview
When the pace indicator shows "Behind pace," a small button will appear inline that opens a Zura AI dialog with tailored recovery guidance -- specific steps like running promos, ad campaigns, rebooking pushes, and retail initiatives calibrated to the revenue gap and time remaining.

## How It Works

1. The button appears only when `paceStatus === 'behind'`
2. Clicking it calls the existing `ai-insight-guidance` edge function with rich context: current revenue, target, shortfall, days remaining, and goal period
3. The response opens in a branded Zura dialog (matching the existing insight dialog pattern) with markdown-rendered guidance and actionable steps
4. Loading state shows a spinner on the button while Zura generates the plan

## Technical Changes

### File: `src/components/dashboard/sales/SalesGoalProgress.tsx`
- Add local state for dialog open/closed and loading/guidance text
- Add a small "Get back on track" button (ghost variant, destructive text color to match the behind-pace styling) next to the pace text
- On click, invoke `supabase.functions.invoke('ai-insight-guidance')` with:
  - `type: 'insight'`
  - `category: 'goal-recovery'`
  - `title: '{label} Recovery Plan'`
  - `description`: includes current revenue, target, shortfall, needed per day, days left, and goal period
- Render a `Dialog` with ZuraAvatar header, ScrollArea for the markdown guidance, and "Powered by Zura AI" footer
- Import `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` from radix, `ZuraAvatar`, `ReactMarkdown`, `ScrollArea`, `Button`, `Loader2`, and `supabase` client

### No edge function changes needed
The existing `ai-insight-guidance` function already handles this pattern -- it accepts a title, description, and category, and returns practical step-by-step guidance with salon-specific strategies including promos, marketing, and operational levers.

### Props: No changes
The component already receives `current`, `target`, `goalPeriod`, `label`, and the computed `neededPerDay` and `daysLeft` -- all the context needed to build a rich prompt.

## UX Details
- Button text: "Get back on track" with a small Zura avatar icon
- Button style: ghost, small, matching destructive text color so it feels contextual
- Dialog: center-screen with frosted backdrop (matching existing Zura insight dialogs), max-w-lg, scrollable content area
- The guidance will include specific recommendations for promos, ad pushes, rebooking campaigns, and retail strategies calibrated to the exact revenue gap

## Files Modified
- `src/components/dashboard/sales/SalesGoalProgress.tsx` (1 file)
