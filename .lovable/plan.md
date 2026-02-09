
# Add Top/Bottom Center Badge Positions

## Overview

Add `top-center` and `bottom-center` options to the location badge position selector, with a responsive 3-column layout for the position buttons.

---

## Current State

| Component | Current Implementation |
|-----------|----------------------|
| Database | CHECK constraint: `top-left`, `top-right`, `bottom-left`, `bottom-right` |
| TypeScript | Union type with 4 positions |
| Settings UI | 2x2 grid of position buttons |
| Preview Panel | Position classes for 4 corners |
| Kiosk Screen | Position classes for 4 corners |

---

## Changes Required

### Part 1: Database Migration

Update the CHECK constraint to include center positions:

```sql
ALTER TABLE organization_kiosk_settings 
DROP CONSTRAINT IF EXISTS organization_kiosk_settings_location_badge_position_check;

ALTER TABLE organization_kiosk_settings 
ADD CONSTRAINT organization_kiosk_settings_location_badge_position_check 
CHECK (location_badge_position IN (
  'top-left', 'top-center', 'top-right', 
  'bottom-left', 'bottom-center', 'bottom-right'
));
```

### Part 2: Update TypeScript Types

**File: `src/hooks/useKioskSettings.ts`**

Update the type union:
```typescript
location_badge_position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
```

**File: `src/components/dashboard/settings/KioskSettingsContent.tsx`**

Update the LocalSettings interface:
```typescript
location_badge_position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
```

**File: `src/components/dashboard/settings/KioskPreviewPanel.tsx`**

Update the KioskPreviewSettings interface:
```typescript
location_badge_position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
```

### Part 3: Update Position Classes

Add center positioning with horizontal centering:

**Files: `KioskIdleScreen.tsx` and `KioskPreviewPanel.tsx`**

```typescript
const badgePositionClasses = {
  'top-left': 'top-6 left-6',
  'top-center': 'top-6 left-1/2 -translate-x-1/2',
  'top-right': 'top-6 right-6',
  'bottom-left': 'bottom-6 left-6',
  'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-6 right-6',
};
```

For preview panel (smaller offsets):
```typescript
const badgePositionClasses = {
  'top-left': 'top-3 left-3',
  'top-center': 'top-3 left-1/2 -translate-x-1/2',
  'top-right': 'top-3 right-3',
  'bottom-left': 'bottom-3 left-3',
  'bottom-center': 'bottom-3 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-3 right-3',
};
```

### Part 4: Update Settings UI Layout

Transform from 2x2 grid to a 3-column responsive layout:

**File: `src/components/dashboard/settings/KioskSettingsContent.tsx`**

```tsx
{/* Position selector - 3 column grid for 6 positions */}
<div className="space-y-2">
  <Label className="text-sm">Position</Label>
  <div className="grid grid-cols-3 gap-2">
    {(['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'] as const).map((pos) => (
      <button
        key={pos}
        type="button"
        className={cn(
          "px-2 py-2 rounded-lg border text-xs font-medium transition-colors text-center",
          localSettings.location_badge_position === pos
            ? "border-primary bg-primary/10 text-foreground"
            : "border-border hover:border-primary/50"
        )}
        onClick={() => updateField('location_badge_position', pos)}
      >
        {pos.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
      </button>
    ))}
  </div>
</div>
```

**Visual Layout:**
```text
+-------------+-------------+-------------+
| Top Left    | Top Center  | Top Right   |
+-------------+-------------+-------------+
| Bottom Left |Bottom Center| Bottom Right|
+-------------+-------------+-------------+
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/migrations/` | Add migration to update CHECK constraint |
| `src/hooks/useKioskSettings.ts` | Add center positions to type union (line 48) |
| `src/components/dashboard/settings/KioskSettingsContent.tsx` | Update type (line 75), update grid to 3 columns (lines 864-880) |
| `src/components/dashboard/settings/KioskPreviewPanel.tsx` | Update type (line 34), add center position classes (lines 178-183) |
| `src/components/kiosk/KioskIdleScreen.tsx` | Add center position classes (lines 10-15) |

---

## Summary

This enhancement:
1. Adds `top-center` and `bottom-center` badge positions
2. Uses `left-1/2 -translate-x-1/2` for perfect horizontal centering
3. Reorganizes the position selector into a 3x2 grid that mirrors actual screen positions
4. Updates database constraints to allow new values
