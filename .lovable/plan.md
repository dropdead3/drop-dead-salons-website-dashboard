
# Fix Settings Icon Visibility on Dark Themes

## Problem

The settings icon in the kiosk screens is too dark/invisible against dark backgrounds. The current implementation uses:
- `opacity: 0.1` when not actively being tapped
- `textColor` which may blend into dark backgrounds

## Solution

Adjust the settings icon styling to maintain subtle visibility while still being discoverable:

1. Increase the base opacity from `0.1` to `0.25`
2. Add a subtle background to improve contrast on any theme
3. Ensure the icon remains intentionally hidden but still findable by admins

## Files to Modify

| File | Change |
|------|--------|
| `src/components/kiosk/KioskIdleScreen.tsx` | Update settings button opacity and styling |
| `src/components/kiosk/KioskLookupScreen.tsx` | Same changes for consistency |

## Technical Changes

### Before
```tsx
style={{ 
  backgroundColor: settingsTapCount > 0 ? `${textColor}15` : 'transparent',
  opacity: settingsTapCount > 0 ? 1 : 0.1,
}}
```

### After
```tsx
style={{ 
  backgroundColor: settingsTapCount > 0 ? `${textColor}15` : `${textColor}08`,
  opacity: settingsTapCount > 0 ? 1 : 0.3,
}}
```

This increases the base opacity from 0.1 to 0.3 and adds a subtle background tint (`08` = 8% opacity) so the icon has some contrast even when "hidden". The icon remains subtle enough to not distract regular users but visible enough for admins to locate.
