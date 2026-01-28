

# Add "Show/hide $" Label to Eye Icon Toggle

## Overview

Add a text label "Show/hide $" next to the hide numbers eye icon in the dashboard header to make the feature more discoverable and self-explanatory.

---

## Current vs New Layout

```text
CURRENT:
┌─────────────────────────────────────────────────────────┐
│  [👁]  [Super Admin]  [View As ▼]  [🔄]  [🔔]  [👤]    │
└─────────────────────────────────────────────────────────┘

NEW:
┌─────────────────────────────────────────────────────────┐
│  [👁 Show/hide $]  [Super Admin]  [View As ▼]  ...     │
└─────────────────────────────────────────────────────────┘
```

---

## Changes Required

### File: `src/components/dashboard/DashboardLayout.tsx`

Update the `HideNumbersToggle` component (lines 708-732) to include the label text next to the icon:

```tsx
const HideNumbersToggle = () => {
  const { hideNumbers, toggleHideNumbers } = useHideNumbers();
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={toggleHideNumbers}
        >
          {hideNumbers ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
          <span className="text-xs">Show/hide $</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {hideNumbers ? 'Show numbers' : 'Hide numbers'}
      </TooltipContent>
    </Tooltip>
  );
};
```

---

## Key Changes

| Change | From | To |
|--------|------|-----|
| Button size | `size="icon"` | `size="sm"` |
| Button width | `w-8` (fixed icon size) | Auto width with `gap-1.5` |
| Content | Icon only | Icon + "Show/hide $" text |
| Text styling | N/A | `text-xs` for compact appearance |

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/DashboardLayout.tsx` | Update `HideNumbersToggle` component to include label text |

