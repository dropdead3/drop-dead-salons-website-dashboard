

# Fix Daily Average Badge Styling in Forecasting Chart

## Problem

The "Daily Avg: $1,042" badge in the forecasting chart (`ForecastingCard.tsx`) uses raw SVG `rect` + `text` elements. This causes:
- No backdrop blur behind the badge, making it hard to read over bar fills
- The pill blends into the bar behind it without proper contrast

The `WeekAheadForecast.tsx` already uses a better approach with `foreignObject` + CSS `backdropFilter`, which renders a crisp, readable pill with glass-blur effect.

## Fix

Replace the SVG `rect`/`text` approach in `ForecastingCard.tsx` (daily avg badge, lines ~686-725) with the same `foreignObject` + CSS pattern used in `WeekAheadForecast.tsx`:

- Use `foreignObject` with a `div` inside
- Apply `backdropFilter: 'blur(6px)'` for the glass effect
- Keep the existing amber/gold gradient background, border, and text color
- Keep the existing text-width measurement logic (or switch to `width: 'fit-content'`)
- Add a background halo line (like WeekAheadForecast does) before the dashed reference line for visibility over bars

Also apply the same fix to the weekly avg badge (lines ~743-800) for consistency.

## Technical Details

| File | Change |
|---|---|
| `src/components/dashboard/sales/ForecastingCard.tsx` | Lines ~686-736: Replace SVG `rect`+`text` with `foreignObject`+`div` using `backdropFilter: blur(6px)`, matching WeekAheadForecast pattern. Add background halo line before dashed line. Same treatment for weekly avg badge (~755-800). |

Key styling properties for the badge `div`:
```css
fontSize: 12, fontWeight: 500,
color: 'rgb(254 240 138)',
backdropFilter: 'blur(6px)',
background: 'linear-gradient(to right, rgb(133 77 14 / 0.5), rgb(180 83 9 / 0.3), rgb(133 77 14 / 0.5))',
border: '1px solid rgb(202 138 4 / 0.6)',
borderRadius: 9999,
padding: '2px 8px',
whiteSpace: 'nowrap',
width: 'fit-content'
```

This removes the manual text-width measurement ref hack and produces a cleaner, more readable badge that matches the existing WeekAheadForecast styling.
