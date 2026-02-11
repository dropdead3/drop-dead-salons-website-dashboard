

## Add Visual Pin State to Command Center Toggle Icon

### Problem
The pin icon on card hover always looks the same regardless of whether the card is pinned to the Command Center or not. There's no at-a-glance indication of pin state.

### Solution
Use the existing `isVisibleToLeadership` state (already computed in the component) to change the pin icon's appearance:

- **Pinned**: Filled/rotated pin with primary color -- immediately signals "this is active"
- **Not pinned**: Default outline pin in muted color -- signals "not pinned"

### Changes

**File:** `src/components/dashboard/CommandCenterVisibilityToggle.tsx`

Update the `Pin` icon on the trigger button (lines 60-67) to reflect pinned state:

```tsx
<Button 
  variant="ghost" 
  size="icon" 
  className={cn(
    "h-8 w-8",
    isVisibleToLeadership 
      ? "text-primary" 
      : "text-muted-foreground hover:text-foreground"
  )}
>
  <Pin className={cn(
    "h-4 w-4 transition-transform",
    isVisibleToLeadership && "fill-current rotate-[-45deg]"
  )} />
</Button>
```

Key visual cues:
- **Pinned**: Pin icon is filled (`fill-current`), rotated 45 degrees (like a "stuck" pin), and colored with the primary brand color
- **Not pinned**: Standard outline pin in muted gray

This requires adding a `cn` import (likely already available) and no logic changes -- just styling the existing computed state.

### Files Modified
1. `src/components/dashboard/CommandCenterVisibilityToggle.tsx` -- conditional icon styling based on pin state

