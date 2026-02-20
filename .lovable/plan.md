

# Clean Up and Enhance Day View to Match Week View Time Grid

## Problem
The Day view's time block layout is inconsistent with the Week view. The Day view uses smaller row heights, simpler border styles, and lacks the visual hierarchy that makes the Week view easy to scan.

## Key Differences Found

| Aspect | Day View (current) | Week View (target) |
|--------|-------------------|---------------------|
| Row height | 16px per 15-min slot | 20px per 15-min slot |
| Time column width | 56px (w-14) | 70px |
| Hour borders | Solid, uniform | Solid at :00, dotted at :30, faint dotted at :15/:45 |
| Half-hour labels | None | Shows "30" at :30 marks |
| Time label style | All muted | Hours bold/foreground, halves subtle |
| Frosted header | None | Blur + gradient fade on sticky stylist header |

## Changes to `src/components/dashboard/schedule/DayView.tsx`

### 1. Increase ROW_HEIGHT from 16 to 20
Matches the Week view's more spacious feel. This also affects the auto-scroll calculation and appointment card positioning -- both use the same constant, so they stay in sync automatically.

### 2. Update time slot generation to include label metadata
Add `label`, `isHour`, and `isHalf` fields (matching Week view's slot structure) so we can render hour labels at :00 and "30" labels at :30.

### 3. Update time label column
- Widen from `w-14` (56px) to `w-[70px]`
- Show hour labels (e.g. "9 AM") at :00 with foreground color and medium weight
- Show "30" at :30 with subtle muted color
- Match the Week view's styling hierarchy

### 4. Apply border hierarchy to time slots
- `:00` slots: `border-t border-border/60` (solid, visible)
- `:30` slots: `border-t border-dotted border-border/40`
- `:15` and `:45` slots: `border-t border-dotted border-border/20` (faintest)

### 5. Add frosted glass effect to sticky stylist header
- Apply `backdrop-filter: blur(12px)` and semi-transparent background
- Add a subtle bottom gradient fade for smooth transition into the grid

### 6. Update DroppableSlot component
Apply the same border hierarchy (hour/half/quarter) instead of the current uniform solid/dashed pattern.

