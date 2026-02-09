
# Make Live Preview Sticky and Fit the Preview Area

## Problem

Currently, the kiosk settings page has a two-column layout with the preview on the left and settings on the right. When scrolling through the long list of settings, the preview disappears from view. The user wants the preview to stay visible (sticky) while scrolling.

## Current Layout Analysis

```text
+----------------------------------+----------------------------------+
|   KioskPreviewPanel              |   Settings Card                  |
|   (Left Column)                  |   (Right Column)                 |
|   Has sticky top-6 class         |   Long scrollable content        |
|   but doesn't work as expected   |   with tabs and many options     |
+----------------------------------+----------------------------------+
```

The `KioskPreviewPanel` already has `sticky top-6` but it's not working effectively because:
1. The grid doesn't have proper alignment for sticky behavior
2. The preview card has internal padding that doesn't maximize the preview size

## Solution

### 1. Swap Column Order

Move the preview to the **right column** so it stays visible while scrolling through settings on the left. This is more intuitive since users read left-to-right and will interact with settings first.

### 2. Apply Proper Sticky Container Styling

Add `self-start` to the preview column to enable sticky behavior within CSS Grid.

### 3. Optimize Preview Sizing

Make the device mockup fill more of the available space by adjusting the sizing constraints.

---

## Technical Implementation

### File: `src/components/dashboard/settings/KioskSettingsContent.tsx`

**Change the grid layout (around line 326):**

```typescript
// Change column order: Settings on left, Preview on right
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Left: Settings Form (moved from right) */}
  <Card>
    <CardHeader>
      {/* ... settings header ... */}
    </CardHeader>
    <CardContent>
      {/* ... tabs and settings ... */}
    </CardContent>
  </Card>

  {/* Right: Preview (moved from left, with sticky) */}
  <div className="lg:self-start lg:sticky lg:top-6">
    <KioskPreviewPanel 
      settings={localSettings} 
      businessSettings={businessSettings}
    />
  </div>
</div>
```

### File: `src/components/dashboard/settings/KioskPreviewPanel.tsx`

**Update the Card to fill available height and optimize sizing:**

```typescript
// Remove the built-in sticky (will be handled by parent wrapper)
// Add h-fit to ensure proper sticky behavior
<Card className={cn("h-fit", className)}>
  {/* ... existing content ... */}
</Card>
```

**Adjust the device mockup sizing for better fit:**

```typescript
// Increase max-width for larger preview
<div className={cn(
  "relative mx-auto",
  settings.display_orientation === 'landscape' ? "max-w-[400px]" : "max-w-[320px]"
)}>
```

---

## Visual Result

```text
+----------------------------------+----------------------------------+
|   Settings Card                  |   KioskPreviewPanel              |
|   (Left Column - scrolls)        |   (Right Column - sticky)        |
|                                  |                                  |
|   [Tabs: Appearance|Content|...] |   +------------------------+     |
|                                  |   |    Device Mockup       |     |
|   Mode: Light/Dark/Auto          |   |                        |     |
|   Theme: Cream/Rose/Sage...      |   |   [Live Preview]       |     |
|   Colors...                      |   |                        |     |
|   Logo...                        |   +------------------------+     |
|   (more settings...)             |                                  |
|                                  |   (Stays visible while           |
|                                  |    scrolling settings)           |
+----------------------------------+----------------------------------+
```

## Summary of Changes

| File | Change |
|------|--------|
| `KioskSettingsContent.tsx` | Swap column order: Settings left, Preview right; wrap preview in sticky container |
| `KioskPreviewPanel.tsx` | Remove built-in sticky, add `h-fit`, increase max-width for larger preview |
