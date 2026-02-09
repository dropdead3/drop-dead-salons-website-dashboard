
# Responsive Layout for Center Badge Positions

## Problem

When the location badge is positioned at `top-center` or `bottom-center`, it overlaps with or crowds other UI elements:
- **Bottom-center badge**: Sits too close to the pulsing dot indicator at the bottom
- **Top-center badge**: Could overlap with the logo/header area

The layout needs to shift content dynamically based on badge position.

---

## Current Layout Analysis

| Element | Current Position | Conflict |
|---------|-----------------|----------|
| Location badge (bottom-center) | `bottom-6` (1.5rem) | Too close to pulse dots |
| Pulse indicator dots | `bottom-12` (3rem) | No adjustment for badge |
| Location badge (top-center) | `top-6` (1.5rem) | Could overlap settings icon |
| Logo/Content | `-mt-12` offset | No adjustment for badge |

**Preview Panel:**
| Element | Current Position | Issue |
|---------|-----------------|-------|
| Badge (bottom-center) | `bottom-3` | Overlaps with bottom indicators at `bottom-4` |
| Bottom indicators | `bottom-4` | No badge awareness |

---

## Solution

Add conditional spacing based on badge position:

### 1. KioskIdleScreen.tsx

**Bottom-center badge active:**
- Move pulse indicator higher: `bottom-12` → `bottom-20` (extra 2rem clearance)
- Adjust badge position: `bottom-6` → `bottom-8` for better visual balance

**Top-center badge active:**
- Add top padding to main content wrapper to push content down
- Keep settings icon in top-right (away from center badge)

```typescript
// Determine if center badges are active
const hasTopCenterBadge = showLocationBadge && badgePosition === 'top-center';
const hasBottomCenterBadge = showLocationBadge && badgePosition === 'bottom-center';

// Dynamic badge positions with better spacing
const badgePositionClasses = {
  'top-left': 'top-6 left-6',
  'top-center': 'top-8 left-1/2 -translate-x-1/2', // Slightly lower for clearance
  'top-right': 'top-6 right-6',
  'bottom-left': 'bottom-6 left-6',
  'bottom-center': 'bottom-20 left-1/2 -translate-x-1/2', // Above pulse dots
  'bottom-right': 'bottom-6 right-6',
};

// Conditional pulse indicator position
<motion.div
  className={cn(
    "absolute left-1/2 -translate-x-1/2 flex gap-2",
    hasBottomCenterBadge ? "bottom-8" : "bottom-12" // Move down when badge is above
  )}
>
```

### 2. KioskPreviewPanel.tsx

Apply same responsive logic at preview scale:

```typescript
const hasBottomCenterBadge = settings.show_location_badge && 
  settings.location_badge_position === 'bottom-center';

// Badge positions (preview scale)
const badgePositionClasses = {
  'top-left': 'top-3 left-3',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'top-right': 'top-3 right-3',
  'bottom-left': 'bottom-3 left-3',
  'bottom-center': 'bottom-8 left-1/2 -translate-x-1/2', // Above indicators
  'bottom-right': 'bottom-3 right-3',
};

// Conditional bottom indicator position
<div className={cn(
  "absolute flex gap-1.5 z-10",
  hasBottomCenterBadge ? "bottom-2" : "bottom-4"
)}>
```

---

## Visual Layout

**Before (overlapping):**
```text
┌────────────────────────────┐
│                            │
│         [Content]          │
│                            │
│   [📍 Location Name]       │  ← bottom-6
│        ● ● ●               │  ← bottom-12 (too close)
└────────────────────────────┘
```

**After (properly spaced):**
```text
┌────────────────────────────┐
│                            │
│         [Content]          │
│                            │
│   [📍 Location Name]       │  ← bottom-20 (raised higher)
│                            │
│        ● ● ●               │  ← bottom-8 (adjusted down)
└────────────────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/kiosk/KioskIdleScreen.tsx` | Add conditional classes for bottom pulse indicator and adjust center badge positions |
| `src/components/dashboard/settings/KioskPreviewPanel.tsx` | Mirror same responsive logic for preview |

---

## Implementation Details

### KioskIdleScreen.tsx Changes

1. Calculate badge position awareness at component level
2. Update `badgePositionClasses` with better center spacing
3. Make bottom pulse indicator position conditional

### KioskPreviewPanel.tsx Changes

1. Add position awareness calculations
2. Update badge position classes for center positions
3. Make bottom indicators position conditional

This ensures elements never overlap and maintain proper visual hierarchy regardless of badge placement.
