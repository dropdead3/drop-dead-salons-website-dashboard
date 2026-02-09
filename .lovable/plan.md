
# Fix Location Badge Positioning in Preview Panel

## Problem

The location badge in the kiosk preview panel is not correctly positioned within the screen boundaries. Looking at the screenshot:
- The badge appears to extend outside the rounded preview frame
- The badge uses `top-2 right-2` but is rendered inside the `renderIdleScreen` which has its own padding (`p-4`) and margin (`-mt-4`)
- This causes the badge to be misaligned relative to the actual screen edges

## Root Cause

In `KioskPreviewPanel.tsx`, the `renderLocationBadge()` is called inside `renderIdleScreen()` (line 269). However:
1. `renderIdleScreen` has a wrapper with `className="relative z-10 ... p-4 ... -mt-4"` 
2. The badge has `absolute` positioning with classes like `top-2 right-2`
3. This means the badge is positioned relative to the padded content area, not the actual screen container

The badge needs to be rendered at the screen container level (the `div` at line 605) so its absolute positioning works correctly against the actual screen boundaries.

## Solution

Move the location badge rendering from inside `renderIdleScreen()` to the screen container level, and adjust the positioning classes to properly fit within the rounded corners.

### Changes Required

**File: `src/components/dashboard/settings/KioskPreviewPanel.tsx`**

1. **Update badge position classes** - Increase padding to account for rounded corners:
```typescript
const badgePositionClasses = {
  'top-left': 'top-3 left-3',      // was top-2 left-2
  'top-right': 'top-3 right-3',    // was top-2 right-2
  'bottom-left': 'bottom-3 left-3', // was bottom-2 left-2
  'bottom-right': 'bottom-3 right-3', // was bottom-2 right-2
};
```

2. **Remove badge from renderIdleScreen()** - Delete line 269 `{renderLocationBadge()}`

3. **Add badge at screen container level** - Render the badge inside the screen container (line 605-615), but outside of `{renderScreen()}`:
```tsx
<div 
  className={cn(
    "rounded-[1.5rem] overflow-hidden relative",
    settings.display_orientation === 'landscape' ? "aspect-[4/3]" : "aspect-[3/4]"
  )}
  style={{ backgroundColor: settings.background_color }}
>
  {/* Screen content */}
  {renderScreen()}
  
  {/* Location badge - rendered at container level for proper positioning */}
  {renderLocationBadge()}
</div>
```

This ensures the badge's absolute positioning is relative to the screen container itself, and the `overflow-hidden` with rounded corners will clip the badge properly within the frame.

## Summary

| Change | Description |
|--------|-------------|
| Badge position classes | Increase from `2` to `3` for better corner clearance |
| renderIdleScreen | Remove `{renderLocationBadge()}` call |
| Screen container | Add `{renderLocationBadge()}` after `{renderScreen()}` |

This fix ensures the badge appears correctly within the preview frame boundaries regardless of which corner position is selected.
