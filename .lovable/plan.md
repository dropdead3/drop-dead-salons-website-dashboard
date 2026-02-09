
# Restrict Center Badge Positions to Portrait Mode Only

## Problem

Currently, all 6 badge positions (top-left, top-center, top-right, bottom-left, bottom-center, bottom-right) are available regardless of display orientation. The center positions (top-center, bottom-center) should only be available when Portrait orientation is selected, not for Landscape mode.

---

## Current State

| Orientation | Available Positions |
|-------------|-------------------|
| Portrait | All 6 positions |
| Landscape | All 6 positions |

**Should be:**

| Orientation | Available Positions |
|-------------|-------------------|
| Portrait | All 6 positions (top-left, top-center, top-right, bottom-left, bottom-center, bottom-right) |
| Landscape | 4 corner positions only (top-left, top-right, bottom-left, bottom-right) |

---

## Solution

1. Filter the available positions based on the current `display_orientation` setting
2. Auto-fallback: If user switches from Portrait → Landscape while a center position is selected, automatically change to a valid corner position (e.g., `bottom-center` → `bottom-left`)

---

## Implementation Details

### File: `src/components/dashboard/settings/KioskSettingsContent.tsx`

**Changes to make:**

1. Create a derived list of available positions based on orientation:
```typescript
const availableBadgePositions = localSettings.display_orientation === 'landscape'
  ? ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const
  : ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'] as const;
```

2. Add auto-fallback logic when orientation changes (in the `updateField` function or via useEffect):
```typescript
// When switching to landscape, if a center position is selected, fallback to corner
if (localSettings.display_orientation === 'landscape') {
  if (localSettings.location_badge_position === 'top-center') {
    updateField('location_badge_position', 'top-left');
  } else if (localSettings.location_badge_position === 'bottom-center') {
    updateField('location_badge_position', 'bottom-left');
  }
}
```

3. Update the position grid to use dynamic available positions:
```typescript
<div className="grid grid-cols-3 gap-2">
  {availableBadgePositions.map((pos) => (
    <button
      key={pos}
      // ... rest of button props
    >
      {pos.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
    </button>
  ))}
</div>
```

4. Adjust grid layout based on orientation:
   - Portrait: 3 columns (6 positions in 2 rows)
   - Landscape: 2 columns (4 positions in 2 rows)

```typescript
<div className={cn(
  "grid gap-2",
  localSettings.display_orientation === 'landscape' ? "grid-cols-2" : "grid-cols-3"
)}>
```

---

## Visual Layout

**Portrait Mode (6 positions, 3 columns):**
```text
┌──────────────────────────────────────┐
│ Top Left  │ Top Center  │ Top Right  │
│───────────│─────────────│────────────│
│Bottom Left│Bottom Center│Bottom Right│
└──────────────────────────────────────┘
```

**Landscape Mode (4 positions, 2 columns):**
```text
┌─────────────────────────┐
│  Top Left  │  Top Right │
│────────────│────────────│
│Bottom Left │Bottom Right│
└─────────────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/settings/KioskSettingsContent.tsx` | Filter badge positions based on orientation, add auto-fallback logic, adjust grid layout |

---

## Edge Cases Handled

1. **Switching Portrait → Landscape with center position selected**: Auto-fallback to nearest corner position
2. **Switching Landscape → Portrait**: All positions become available (no action needed)
3. **Loading settings with mismatched orientation/position**: Fallback applied on initial render
