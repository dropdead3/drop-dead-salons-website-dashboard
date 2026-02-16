

# Fix Kiosk Settings Layout: Sticky Preview + Column Sizing

## Problems Identified

1. **Preview column too small**: The grid is set to `lg:grid-cols-[1fr,500px]`, giving the settings form ALL the flexible space while the preview is fixed at only 500px.

2. **Sticky not working**: The parent grid container (`space-y-6`) doesn't use `items-start` on the grid, so the right column stretches to match the left column's height -- making sticky have no scrollable track to stick within. The outer wrapper is `space-y-6` (a flex-free block layout), and the grid itself needs `items-start` so the right column doesn't stretch.

## Changes

**File: `src/components/dashboard/settings/KioskSettingsContent.tsx`**

Two targeted edits:

### 1. Flip the column ratio and add `items-start`

Change line 779 from:
```
grid grid-cols-1 lg:grid-cols-[1fr,500px] gap-6
```
to:
```
grid grid-cols-1 lg:grid-cols-[minmax(0,420px),1fr] gap-6 items-start
```

This gives the settings form a max width of 420px (compact, form-appropriate) and lets the preview panel take all remaining space. `items-start` prevents the right column from stretching to match the left column's height, which is what enables sticky positioning to work.

### 2. Add max-height constraint to sticky preview

Change the sticky wrapper (lines 1418-1424) to include a viewport-height constraint so the preview doesn't overflow when it's taller than the viewport:

```
<div className="hidden lg:block">
  <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
    <KioskPreviewPanel ... />
  </div>
</div>
```

This ensures the preview stays pinned as you scroll through settings, and if the preview itself is tall, it scrolls independently.

