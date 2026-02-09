
# Enhance Kiosk Idle Screen UI

## Overview

Refine the kiosk idle screen layout based on the screenshot reference to create a more balanced, elegant design with better visual hierarchy and spacing.

## Current Issues

Looking at the current implementation (`KioskIdleScreen.tsx`):

| Element | Current | Issue |
|---------|---------|-------|
| Time | `text-7xl md:text-9xl` | Too dominant, overpowers other content |
| Time position | Centered vertically | Could be positioned higher for better balance |
| Time margin | `mb-10` | Transitions directly into welcome text |
| Date | `mt-3` | Good spacing from time |
| Welcome title | `text-4xl md:text-6xl` | Slightly large relative to refined time |
| Element gaps | Various `mb-*` | Could use more consistent, generous padding |

## Proposed Changes

### 1. Time Display - Smaller and Repositioned Higher

```text
Current Layout:          Proposed Layout:
                         ┌────────────────────┐
                         │                    │
┌────────────────────┐   │    10:28 PM        │  ← Smaller, higher position
│                    │   │    Sunday, Feb 8   │
│                    │   │                    │
│    10:28 PM        │   │                    │
│    Sunday, Feb 8   │   │    WELCOME         │  ← More breathing room
│                    │   │                    │
│    WELCOME         │   │                    │
│                    │   │  [Tap to check in] │
│  [Tap to check in] │   │                    │
│                    │   │                    │
└────────────────────┘   └────────────────────┘
```

### 2. Specific CSS Changes

**File: `src/components/kiosk/KioskIdleScreen.tsx`**

**A. Content container - Shift content upward**
```typescript
// Line ~160: Change container flex positioning
<div className="relative z-10 flex flex-col items-center text-center px-8 -mt-12">
```

**B. Time display - Reduce size**
```typescript
// Line ~187: Reduce from text-7xl/9xl to text-5xl/7xl
<motion.div 
  className="text-5xl md:text-7xl font-extralight tracking-tight"
  style={{ color: textColor }}
>
  {formatTime(currentTime)}
</motion.div>
```

**C. Date display - Reduce size slightly**
```typescript
// Line ~193: Reduce from text-xl/2xl to text-lg/xl
<motion.div 
  className="text-lg md:text-xl mt-2 font-light tracking-wide"
  style={{ color: `${textColor}90` }}
>
  {formatDate(currentTime)}
</motion.div>
```

**D. Time container - Increase bottom margin**
```typescript
// Line ~180: Increase mb-10 to mb-16
<motion.div
  className="mb-16"  // Was mb-10
  initial={{ scale: 0.9, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ delay: 0.2 }}
>
```

**E. Welcome message - Adjust margins**
```typescript
// Line ~201: Increase mb-14 to mb-20 for more breathing room before CTA
<motion.div
  className="mb-20"  // Was mb-14
  initial={{ y: 20, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  transition={{ delay: 0.3 }}
>
```

**F. Welcome title - Slightly smaller**
```typescript
// Line ~208: Reduce from text-4xl/6xl to text-3xl/5xl
<h1 
  className="text-3xl md:text-5xl font-medium mb-4 tracking-tight"
  style={{ color: textColor }}
>
```

### 3. Theme Alignment

The kiosk already uses `settings?.accent_color` from `organization_kiosk_settings` for the "Tap to check in" button and glow effects. This is the correct approach since:

- The kiosk has its own dedicated settings table (`organization_kiosk_settings`)
- Admins can configure colors per-location or org-wide via the new Settings Hub configurator
- The accent color is applied to: button background, glow effects, ambient gradient

No code changes needed for theme alignment - it already respects the configured kiosk settings.

## Summary of Changes

| Element | Before | After |
|---------|--------|-------|
| Time size | `text-7xl md:text-9xl` | `text-5xl md:text-7xl` |
| Date size | `text-xl md:text-2xl` | `text-lg md:text-xl` |
| Date margin | `mt-3` | `mt-2` |
| Time container margin | `mb-10` | `mb-16` |
| Welcome title size | `text-4xl md:text-6xl` | `text-3xl md:text-5xl` |
| Welcome container margin | `mb-14` | `mb-20` |
| Content container | centered | `-mt-12` (shifted up) |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/kiosk/KioskIdleScreen.tsx` | Adjust typography sizes and spacing |

## Result

- Time display is smaller and more elegant (not dominating the screen)
- Content positioned slightly higher for better visual balance
- More generous padding between clock, welcome message, and CTA button
- Theme already matches organization via kiosk settings - no changes needed
