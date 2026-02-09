
# Polish the Forecasting Chart Layout

## Problems Visible in Screenshot
1. **YAxis ticks are cluttered** -- duplicate "$2k" labels and too many ticks crammed into a small space
2. **"Daily Avg: $1,191" label collides with YAxis ticks** -- `position: 'left'` places it right on top of the Y-axis numbers, making both unreadable
3. **Left margin too wide** for the chart height, creating an unbalanced look
4. **Chart feels cramped** at 180px height with all the labels fighting for space

## Solution

Remove the visible YAxis entirely (the dollar labels above each bar already communicate the values) and instead place the Daily Avg label cleanly inside the chart area where it has room to breathe.

### Changes to both files (`WeekAheadForecast.tsx` and `ForecastingCard.tsx`)

1. **Hide YAxis again** -- revert to `<YAxis hide domain={[0, 'auto']} />`. The above-bar dollar labels (e.g. "$2.0k", "$1.8k") already tell the user each bar's value, so the YAxis is redundant visual noise.

2. **Reduce left margin** -- change from `left: 45` back to `left: 10`. Without the YAxis ticks, the chart doesn't need that padding.

3. **Reposition the ReferenceLine label** -- change `position` from `'left'` to `'insideTopLeft'` so the text sits inside the chart area, just above the dashed line, where it won't collide with anything. Reduce fontWeight to `600` and fontSize to `11` for a cleaner look.

4. **Increase chart height** -- bump from `h-[180px]` to `h-[200px]` to give the bars and labels slightly more vertical room.

### Summary of visual result
- Bars are no longer squeezed to the right
- The orange dashed line runs across the full chart width with its label cleanly visible inside the chart
- No cluttered/duplicate Y-axis ticks
- Each bar still shows its dollar amount above it
- Overall cleaner, more balanced layout
