

## Move Hover Controls Above Cards (Top Reveal)

### Change
Move the collapsible control row from below the card to above it. On hover, the [Z] [pin] controls will expand downward from above the card content, making them more visually prominent.

```text
              [Z] [pin]   <-- appears above card on hover
+------------------------------------------+
| Card Title            Filter  |  $2,021  |
| Chart / content area                     |
+------------------------------------------+
```

### Technical Details

Simple structural change across all files: move the hover div before `{children}` (or before `<Card>`) and change `border-t` to `border-b`.

**1. `src/components/dashboard/PinnableCard.tsx`**
- Move the collapsible div from after `{children}` to before it
- Change `border-t border-border/30` to `border-b border-border/30`

**2-8. Standalone cards (7 files):**
- `StaffingTrendChart.tsx`
- `StylistWorkloadCard.tsx`
- `HiringCapacityCard.tsx`
- `NewBookingsCard.tsx`
- `ClientEngineOverview.tsx`
- `StylistsOverviewCard.tsx` (both exports)
- `ProgramCompletionFunnel.tsx`

Same change in each: move the hover footer div from after `</Card>` to before `<Card>`, and swap `border-t` to `border-b`.

### Files Modified (8 total)
1. `PinnableCard.tsx`
2. `StaffingTrendChart.tsx`
3. `StylistWorkloadCard.tsx`
4. `HiringCapacityCard.tsx`
5. `NewBookingsCard.tsx`
6. `ClientEngineOverview.tsx`
7. `StylistsOverviewCard.tsx`
8. `ProgramCompletionFunnel.tsx`
