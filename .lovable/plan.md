

## Dark Mode Glassmorphism for Service Category Colors

### Current State

All three calendar renderers (DayView, WeekView, CalendarColorPreview) apply category colors as **solid opaque backgrounds** via inline `style={{ backgroundColor: catColor.bg }}`. This works well in light mode but looks flat and harsh against the dark charcoal surfaces.

### Target Aesthetic (from your screenshot)

Same color palettes but rendered as **translucent glass panels**:
- Background at ~25-30% opacity with `backdrop-blur`
- Thin 1px border using the category color at ~40% opacity
- Text remains legible with slightly lightened/desaturated variants
- Maintains the luxury dark-mode layering already used elsewhere in the app

### Approach

Create a utility function `getGlassStyle(hexBg, hexText)` that converts any solid hex color into a glassmorphic style object. The rendering components will check `document.documentElement.classList.contains('dark')` (or use the existing theme context) to decide which style to apply.

### Glass Style Formula

For a given category color (e.g., `#f472b6` pink):

| Property | Light Mode (unchanged) | Dark Mode (glass) |
|----------|----------------------|-------------------|
| background | `#f472b6` (solid) | `rgba(244,114,182, 0.20)` + `backdrop-blur: 12px` |
| border | left-4 accent | `1px solid rgba(244,114,182, 0.35)` |
| text color | `#ffffff` or `#1f2937` | Lightened variant of the category hue |

### Implementation

**1. New utility: `getGlassCategoryStyle()` in `src/utils/categoryColors.ts`**

Add a function that takes a hex color and returns a CSS style object with:
- `backgroundColor`: the hex converted to rgba at 0.22 opacity
- `backdropFilter`: `blur(12px)`
- `border`: `1px solid` the hex at 0.35 opacity
- `color`: a lightened text color (pastel tint at ~85% lightness)
- `borderLeft`: removed (glass panels don't need the accent left-border)

This keeps all color logic centralized in one file.

**2. Update `DayView.tsx` (~line 263-276)**

Where it currently sets `backgroundColor: catColor.bg`, wrap in a dark-mode check:
- Light mode: keep existing solid style
- Dark mode: call `getGlassCategoryStyle(catColor.bg)` and spread the result
- Add `backdrop-blur-xl` class conditionally in dark mode
- Remove `border-l-4` class in dark mode (replaced by the all-around glass stroke)

**3. Update `WeekView.tsx` (~line 129-138)**

Same pattern as DayView — conditionally apply glass style in dark mode.

**4. Update `CalendarColorPreview.tsx` (~line 147-166)**

Same pattern. Since this is a settings preview, it should accurately reflect what the real schedule looks like in both modes.

**5. Dark-mode detection approach**

Use a simple hook or inline check. Since the app already has `usePlatformTheme()` and the `dark` class on `<html>`, we can use:
```tsx
const isDark = document.documentElement.classList.contains('dark');
```
Or import a lightweight hook that listens to the class. The schedule views already import many utilities, so a single boolean check is minimal overhead.

### Files Modified

| File | Change |
|------|--------|
| `src/utils/categoryColors.ts` | Add `getGlassCategoryStyle(hex)` utility function |
| `src/components/dashboard/schedule/DayView.tsx` | Conditional glass style in dark mode for appointment cells |
| `src/components/dashboard/schedule/WeekView.tsx` | Same conditional glass treatment |
| `src/components/dashboard/settings/CalendarColorPreview.tsx` | Same conditional glass treatment for preview accuracy |

### What Stays the Same

- Light mode rendering is completely unchanged
- Gradient categories (consultations, etc.) already have their own glass treatment and are unaffected
- Block/Break X-pattern overlays work the same (the translucent background actually makes them more visible)
- All color configuration, CRUD, and theme selection remain untouched

