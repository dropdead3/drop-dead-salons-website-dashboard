
# Remove Synthetic Bolding from Kiosk Components

## Issue

The project's design standards prohibit synthetic bolding, with `font-medium` (500) being the absolute maximum weight. Currently, the kiosk components use `font-semibold` in multiple places.

## Files to Update

| File | Instances | Elements Affected |
|------|-----------|-------------------|
| `KioskIdleScreen.tsx` | 1 | Welcome title (line 208) |
| `KioskLookupScreen.tsx` | 1 | Prompt heading (line 182) |
| `KioskConfirmScreen.tsx` | 5 | Headings, appointment card, buttons |
| `KioskSuccessScreen.tsx` | 2 | Success heading, stylist name |
| `KioskErrorScreen.tsx` | 2 | Error heading, retry button |
| `KioskNumberPad.tsx` | 1 | Check-in button |
| `KioskSettingsDialog.tsx` | 1 | Settings dialog title |

## Changes

Replace all instances of `font-semibold` with `font-medium` across all kiosk components to comply with the design system.

### Specific Replacements

**KioskIdleScreen.tsx**
- Line 208: `font-semibold` → `font-medium`

**KioskLookupScreen.tsx**
- Line 182: `font-semibold` → `font-medium`

**KioskConfirmScreen.tsx**
- Line 124: `font-semibold` → `font-medium`
- Line 201: `font-semibold` → `font-medium`
- Line 230: `font-semibold` → `font-medium`
- Line 307: `font-semibold` → `font-medium`
- Line 334: `font-semibold` → `font-medium`

**KioskSuccessScreen.tsx**
- Line 180: `font-semibold` → `font-medium`
- Line 214: `font-semibold` → `font-medium`

**KioskErrorScreen.tsx**
- Line 97: `font-semibold` → `font-medium`
- Line 124: `font-semibold` → `font-medium`

**KioskNumberPad.tsx**
- Line 123: `font-semibold` → `font-medium`

**KioskSettingsDialog.tsx**
- Line 123: `font-semibold` → `font-medium`

## Visual Impact

The text will appear slightly lighter in weight, maintaining readability while conforming to the premium, understated aesthetic of the Drop Dead design system. The `font-medium` weight still provides sufficient visual hierarchy without synthetic bolding.
