
# Fix Kiosk Settings Dialog to Use Configured Theme Colors

## Problem

The Kiosk Settings Dialog uses hardcoded purple (`bg-purple-500`, `bg-purple-600`, `text-purple-400`) colors throughout its UI instead of the configured accent color from the kiosk settings. This contradicts the expected behavior where the kiosk should use the colors defined in the dashboard's appearance settings.

## Root Cause

The `KioskSettingsDialog.tsx` component has ~12 instances of hardcoded Tailwind purple color classes instead of dynamically applying the `accent_color` from kiosk settings.

## Solution

Replace all hardcoded purple color references with dynamic inline styles using the kiosk's `accent_color` setting. Since the component already has access to settings via `useKiosk()`, we can derive the accent color and apply it dynamically.

### Technical Changes

**File: `src/components/kiosk/KioskSettingsDialog.tsx`**

1. **Extract accent color from settings** at the top of the component:

```typescript
const { settings, organizationId, locationId } = useKiosk();
const accentColor = settings?.accent_color || DEFAULT_KIOSK_SETTINGS.accent_color;
```

2. **Replace hardcoded purple colors with inline styles** using the accent color:

| Location | Before | After |
|----------|--------|-------|
| Line 311 (Settings icon bg) | `bg-purple-500/20` | `style={{ backgroundColor: \`${accentColor}20\` }}` |
| Line 312 (Settings icon) | `text-purple-400` | `style={{ color: accentColor }}` |
| Line 336 (Lock icon bg) | `bg-purple-500/20` | `style={{ backgroundColor: \`${accentColor}20\` }}` |
| Line 341 (Lock icon) | `text-purple-400` | `style={{ color: accentColor }}` |
| Line 366 (PIN dots) | `bg-purple-500` | Dynamic style with `accentColor` |
| Line 430 (Unlock button) | `bg-purple-600` | `style={{ backgroundColor: accentColor }}` |
| Line 452 (Active tab) | `bg-purple-600` | `style={{ backgroundColor: accentColor }}` |
| Line 570 (Save button) | `bg-purple-600` | `style={{ backgroundColor: accentColor }}` |
| Lines 622, 651, 679 (Input focus) | `focus:border-purple-500` | Use `onFocus/onBlur` with accent color or CSS variable |
| Line 708 (Toggle on) | `bg-purple-600` | `style={{ backgroundColor: value ? accentColor : undefined }}` |

3. **For focus states on inputs**, create a helper for border color or use a CSS variable approach:

```typescript
// Option A: Use onFocus/onBlur handlers
<input
  style={{ 
    borderColor: isFocused ? accentColor : undefined,
  }}
  onFocus={() => setIsFocused(true)}
  onBlur={() => setIsFocused(false)}
/>

// Option B: Set CSS variable and use it
// At component level:
<div style={{ '--accent': accentColor } as React.CSSProperties}>
  <input className="focus:border-[var(--accent)]" />
</div>
```

4. **Pass accent color to child setting components**:

```typescript
<TextSetting
  label="Check-In Prompt"
  value={localSettings.check_in_prompt}
  onChange={(v) => updateLocalSetting('check_in_prompt', v)}
  accentColor={accentColor}
/>
```

Then update the sub-components (`TextSetting`, `ColorSetting`, `NumberSetting`, `ToggleSetting`) to accept and use `accentColor` for their interactive states.

## Implementation Summary

```text
KioskSettingsDialog.tsx changes:
├── Extract accentColor from settings (line ~18)
├── Header icon (lines 311-312) → use accentColor
├── PIN entry lock icon (lines 336, 341) → use accentColor  
├── PIN dots (line 366) → use accentColor
├── Unlock button (line 430) → use accentColor
├── Tab buttons (line 452) → use accentColor
├── Save button (line 570) → use accentColor
└── Sub-components:
    ├── TextSetting → add accentColor prop for focus
    ├── ColorSetting → add accentColor prop for focus
    ├── NumberSetting → add accentColor prop for focus
    └── ToggleSetting → add accentColor prop for toggle
```

## Expected Outcome

After this change:
- The Kiosk Settings Dialog will use the gold/bronze accent color (#9A7B4F) shown in the settings instead of purple
- All interactive elements (buttons, tabs, toggles, focus rings) will match the configured theme
- The kiosk maintains visual consistency with its configured appearance

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/kiosk/KioskSettingsDialog.tsx` | Replace ~12 hardcoded purple color references with dynamic accent color from settings |
