

# High-End Luxury Kiosk: Glass UI & Background Photo Support

## Overview

Transform the kiosk screens into a refined, luxury aesthetic by removing glow effects, adding background photo support with adjustable overlay, and implementing glass-morphic buttons with elegant outlines.

## Current State Analysis

### Glow Effects to Remove

Identified glow effects across all kiosk screens:

| File | Effect Type | Lines |
|------|-------------|-------|
| `KioskIdleScreen.tsx` | Radial gradient ambient glow | Line 135 |
| `KioskIdleScreen.tsx` | Button blur-xl glow | Lines 271-284 |
| `KioskLookupScreen.tsx` | Radial gradient ambient glow | Lines 75-79 |
| `KioskLookupScreen.tsx` | Phone icon blur-xl glow | Lines 140-143 |
| `KioskLookupScreen.tsx` | Spinner glow | Lines 197-201 |
| `KioskConfirmScreen.tsx` | Radial gradient ambient glow | Lines 63-67 |
| `KioskSuccessScreen.tsx` | Radial gradient glow | Lines 88-92 |
| `KioskSuccessScreen.tsx` | Icon container boxShadow glow | Line 146 |
| `KioskNumberPad.tsx` | Submit button boxShadow | Lines 129, 137 |
| `KioskPreviewPanel.tsx` | Preview glow effects | Lines 206-218, 501 |
| All screens | Check-in button gradient boxShadow | Multiple locations |

### Missing Features

1. **Background Photo Upload**: `background_image_url` exists in DB but no UI to set it
2. **Overlay Opacity Control**: No way to adjust the darken/lighten effect on background images

---

## Solution

### Part 1: Database Migration

Add a new column for background overlay control:

```sql
ALTER TABLE organization_kiosk_settings 
ADD COLUMN background_overlay_opacity numeric(3,2) DEFAULT 0.5;
```

This allows values from 0.00 (no overlay) to 1.00 (fully opaque), with 0.5 as a balanced default.

### Part 2: Update Settings Interface

Add to `useKioskSettings.ts`:

```typescript
interface KioskSettings {
  // ... existing fields
  background_overlay_opacity: number; // 0-1, controls darken/lighten
}

DEFAULT_KIOSK_SETTINGS = {
  // ... existing
  background_overlay_opacity: 0.5,
}
```

### Part 3: Settings UI Enhancements

Add new controls to the Appearance tab in `KioskSettingsContent.tsx`:

```text
+--------------------------------------------------+
| 🖼️ Background Image                              |
+--------------------------------------------------+
| [ Upload background photo... ]                   |
| URL: https://...                                 |
|                                                  |
| Overlay Opacity                                  |
| [==========|==========] 50%                      |
| Darken ←---------------→ Lighten                 |
|                                                  |
| [ ] Invert overlay (lighten instead of darken)  |
+--------------------------------------------------+
```

### Part 4: Glass Button Styling

Replace solid/gradient buttons with glass morphism:

**Before (glow + gradient):**
```typescript
style={{
  background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}CC 100%)`,
  boxShadow: `0 8px 32px ${accentColor}40`,
}}
```

**After (glass + border):**
```typescript
style={{
  backgroundColor: `${accentColor}15`,
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: `1.5px solid ${accentColor}40`,
  boxShadow: 'none',
}}
```

Glass button characteristics:
- **Translucent fill**: 10-20% opacity of accent color
- **Backdrop blur**: 12px for frosted glass effect
- **Crisp border**: 1-2px solid with 30-50% opacity
- **No glow/shadow**: Clean, minimal aesthetic
- **Subtle hover**: Increase fill opacity to 25%

### Part 5: Kiosk Screen Updates

Each screen will be updated with:

1. **Remove ambient radial gradients** - Delete the overlay divs with `radial-gradient`
2. **Remove blur-xl glow effects** - Delete glow indicator divs
3. **Remove boxShadow on buttons** - Set to 'none' or subtle 'inset' only
4. **Apply glass styling to all interactive elements**
5. **Handle background overlay properly** - Use configurable opacity

**Background overlay implementation:**
```typescript
// In each screen component
{backgroundImageUrl && (
  <div 
    className="absolute inset-0" 
    style={{ 
      backgroundColor: isDarkOverlay 
        ? `rgba(0, 0, 0, ${overlayOpacity})` 
        : `rgba(255, 255, 255, ${overlayOpacity})`,
    }}
  />
)}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/migrations/` | Add `background_overlay_opacity` column |
| `src/hooks/useKioskSettings.ts` | Add new field to interface and defaults |
| `src/components/dashboard/settings/KioskSettingsContent.tsx` | Add Background Image section with URL input & opacity slider |
| `src/components/kiosk/KioskIdleScreen.tsx` | Remove glows, add glass buttons, handle overlay |
| `src/components/kiosk/KioskLookupScreen.tsx` | Remove glows, glass buttons, overlay |
| `src/components/kiosk/KioskConfirmScreen.tsx` | Remove glows, glass buttons, overlay |
| `src/components/kiosk/KioskSuccessScreen.tsx` | Remove glows, glass buttons, overlay |
| `src/components/kiosk/KioskErrorScreen.tsx` | Remove glows, glass buttons |
| `src/components/kiosk/KioskNumberPad.tsx` | Glass styling for number pad buttons |
| `src/components/dashboard/settings/KioskPreviewPanel.tsx` | Mirror glass styling in preview |

---

## Visual Comparison

```text
BEFORE (Current)                    AFTER (Luxury Glass)
+---------------------------+       +---------------------------+
|                           |       |                           |
|    ✨ Glowing Logo ✨      |       |       Clean Logo          |
|                           |       |                           |
|    [  Radial Glow BG  ]   |       |    [ Photo + Overlay ]    |
|                           |       |                           |
|  +---------------------+  |       |  +---------------------+  |
|  |   GRADIENT BUTTON   |  |       |  |  ░░ Glass Button ░░ |  |
|  |   WITH GLOW SHADOW  |  |       |  |  subtle border only |  |
|  +---------------------+  |       |  +---------------------+  |
|                           |       |                           |
|     ● ● ● (pulsing)       |       |     ● ● ● (subtle)        |
+---------------------------+       +---------------------------+
```

---

## Implementation Details

### Glass Button Component Style

```typescript
const glassButtonStyle = {
  backgroundColor: `${accentColor}15`,
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: `1.5px solid ${accentColor}40`,
  color: textColor,
};

const glassButtonHover = {
  backgroundColor: `${accentColor}25`,
  scale: 1.01,
};
```

### Background Overlay Slider

```tsx
<div className="space-y-2">
  <Label>Background Overlay</Label>
  <div className="flex items-center gap-4">
    <span className="text-xs text-muted-foreground">Light</span>
    <Slider
      min={0}
      max={100}
      step={5}
      value={[overlayOpacity * 100]}
      onValueChange={([v]) => updateField('background_overlay_opacity', v / 100)}
    />
    <span className="text-xs text-muted-foreground">Dark</span>
  </div>
  <p className="text-xs text-muted-foreground">
    {overlayOpacity < 0.3 ? 'Minimal darkening' : 
     overlayOpacity < 0.6 ? 'Balanced contrast' : 
     'Strong darkening for readability'}
  </p>
</div>
```

---

## Summary

This update transforms the kiosk from a "tech-forward" glowing aesthetic to a sophisticated luxury feel:

- **Clean backgrounds**: Photo support with adjustable overlay
- **Glass morphism**: Translucent buttons with crisp borders
- **No glow effects**: Removed all blur-xl and boxShadow glows
- **Refined animations**: Keep subtle scale/opacity but remove pulsing glows
- **High-end feel**: Minimal, elegant, premium appearance

