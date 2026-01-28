
# Fix Toggle Text Visibility in Dark Mode for Forecasting Card

## Problem

The selected time range toggle in the Forecasting card shows dark text on a dark background in dark mode, making it unreadable.

**Root cause:**
- The toggle items use `data-[state=on]:bg-background` for the selected state
- The base `toggleVariants` in `toggle.tsx` uses `data-[state=on]:text-accent-foreground`
- In dark mode:
  - `--background` = `0 0% 4%` (very dark/black)
  - `--accent-foreground` = `0 0% 4%` (also very dark/black)
- **Result:** Dark text on dark background = invisible

## Solution

Add an explicit text color class to the selected state in the `ToggleGroupItem` components within `ForecastingCard.tsx` to ensure proper contrast in both light and dark modes.

Change from:
```tsx
data-[state=on]:bg-background data-[state=on]:shadow-sm
```

To:
```tsx
data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm
```

The `text-foreground` class uses `--foreground` which is:
- Light mode: `0 0% 8%` (dark text)
- Dark mode: `40 20% 92%` (light cream text)

This ensures proper contrast against the background in both modes.

## File to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/sales/ForecastingCard.tsx` | Add `data-[state=on]:text-foreground` to all four `ToggleGroupItem` components (lines 290, 293, 296, 299) |

## Implementation

Update each `ToggleGroupItem` className from:
```tsx
className="text-xs px-2.5 py-1 h-7 data-[state=on]:bg-background data-[state=on]:shadow-sm"
```

To:
```tsx
className="text-xs px-2.5 py-1 h-7 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"
```

## Result

After this fix:
- **Light mode:** Selected toggle shows dark text on light background ✓
- **Dark mode:** Selected toggle shows light cream text on dark background ✓
- Proper contrast and readability in both themes
