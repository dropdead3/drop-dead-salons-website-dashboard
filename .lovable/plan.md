

# Widen Filter Dropdowns to Fit Content

## Problem

The date range dropdown is truncating text - "Last 30 days" shows as "Last 30..." because the trigger width is set to only 150px.

## Solution

Increase the width of both filter dropdowns to accommodate the longest text options:

| Dropdown | Current Width | New Width | Longest Option |
|----------|---------------|-----------|----------------|
| Location | 180px | 200px | "All Locations" + icon |
| Date Range | 150px | 180px | "Custom Range" / "Last 30 days" |

## Changes

**File: `src/pages/dashboard/admin/AnalyticsHub.tsx`**

```typescript
// Line 147 - Location dropdown
<SelectTrigger className="w-[200px]">  // Was w-[180px]

// Line 172 - Date Range dropdown  
<SelectTrigger className="w-[180px]">  // Was w-[150px]
```

## Result

Both dropdowns will display full text without truncation while maintaining a compact, proportional appearance.

