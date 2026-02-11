

# Improve Dashboard Command Center Layout Quality

## The Problem
The current layout has uniform `space-y-10` (40px) gaps between every section, making it feel disconnected and visually loose -- especially for leadership roles where "Today's Schedule" is hidden and there are fewer content blocks. The filter bar floats right with no left anchor, and the welcome header feels separated from the action drawers beneath it.

## The Solution: Tighter Visual Grouping with Variable Spacing

### 1. Reduce the outer container gap from `space-y-10` to `space-y-6`
The 40px uniform gap is too large for a Command Center that should feel tight and purposeful. 24px (`space-y-6`) keeps breathing room while pulling sections into a cohesive layout.

### 2. Group the welcome header + drawers more tightly
The Zura Insights and Announcements drawers are contextually part of the welcome area. Reduce the gap between the header and the `ai_insights` section by wrapping them closer together with `space-y-4` instead of the outer gap.

### 3. Pull banners (payroll, payday) closer to context
Banners like "Pay schedule not configured" should feel like inline alerts, not standalone sections. They'll sit within the tighter `space-y-6` rhythm naturally.

### 4. Anchor the filter bar with a section label
When the filter bar renders (before pinned analytics), add a subtle left-aligned section label ("ANALYTICS" with the oat dot) so it doesn't float alone on the right.

## Technical Details

### File: `src/pages/dashboard/DashboardHome.tsx`

**Change 1 -- Tighten main container spacing (line 194):**
```tsx
// Before
className="p-6 lg:p-8 space-y-10 overflow-x-hidden"

// After  
className="p-6 lg:p-8 space-y-6 overflow-x-hidden"
```

**Change 2 -- Group welcome header + AI insights closer (lines 222-241 area):**
Wrap the welcome header `motion.div` and make the `ai_insights` section use `mt-4` instead of the default `space-y-6` gap by turning the header + drawers into a single grouped block:

```tsx
// Wrap header and ai_insights together in a tighter group
<div className="space-y-4">
  <motion.div className="flex items-start justify-between" ...>
    {/* welcome header */}
  </motion.div>
  {/* ai_insights will be pulled out of DashboardSections and placed here */}
</div>
```

Actually, since sections are dynamically ordered, a cleaner approach: reduce the main gap to `space-y-6` and add a small `mb-2` negative offset to the `ai_insights` section specifically:

```tsx
ai_insights: (
  <div className="flex flex-col gap-3 -mt-2">
    ...
  </div>
),
```

**Change 3 -- Add section label to filter bar (lines 661-669):**
```tsx
{showFilterBar && (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <div className="w-1.5 h-1.5 rounded-full bg-oat" />
      <h2 className="font-display text-xs tracking-[0.15em]">ANALYTICS</h2>
    </div>
    <AnalyticsFilterBar ... />
  </div>
)}
```

This change restructures the filter bar from a standalone component to a row with a label on the left and filters on the right.

| File | Change |
|---|---|
| `src/pages/dashboard/DashboardHome.tsx` | Tighten `space-y-10` to `space-y-6`, pull AI insights closer to header with `-mt-2`, add "ANALYTICS" label to filter bar row |

