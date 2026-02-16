

# Fix: Clickable Bars + Popup Drill-Down

## Problems
1. **Bars not clickable**: The Recharts `<Tooltip>` component intercepts pointer events on the bars, preventing the `BarChart onClick` from firing reliably when clicking directly on a bar.
2. **Drawer vs Popup**: The provider breakdown currently renders as an inline expanding panel. The user wants a popup dialog instead.

## Solution

### 1. Fix Bar Click: Use `onClick` on each `<Bar>` component
Instead of relying on the `BarChart`-level `onClick` (which competes with Tooltip), attach `onClick` directly to each `<Bar>` component. Recharts `<Bar>` supports an `onClick` prop that receives the bar data payload -- this fires reliably even with Tooltip active.

**File: `WeekAheadForecast.tsx`**
- Remove `onClick` and `style={{ cursor: 'pointer' }}` from `<BarChart>`
- Add `onClick` and `cursor="pointer"` to both `<Bar>` components (confirmed and unconfirmed):
  ```tsx
  <Bar
    dataKey="confirmedRevenue"
    stackId="revenue"
    onClick={(data) => handleBarClick(data.name)}
    cursor="pointer"
    ...
  >
  ```
- Same for the `unconfirmedRevenue` Bar

### 2. Replace Inline Panel with Dialog Popup
Convert `DayProviderBreakdownPanel` from an inline `motion.div` to a `Dialog` using the existing `DRILLDOWN_DIALOG_CONTENT_CLASS` for consistent styling.

**File: `WeekAheadForecast.tsx`**
- Replace `<DayProviderBreakdownPanel day={selectedBarDay} isOpen={...} />` with a `<Dialog>` wrapper:
  ```tsx
  <DayProviderBreakdownPanel
    day={selectedBarDay}
    open={selectedBarDay !== null}
    onOpenChange={(open) => !open && setSelectedBarDay(null)}
  />
  ```

**File: `DayProviderBreakdownPanel.tsx`**
- Change props from `{ day, isOpen }` to `{ day, open, onOpenChange }`
- Replace the outer `AnimatePresence` / `motion.div` with `Dialog` / `DialogContent` using `DRILLDOWN_DIALOG_CONTENT_CLASS`
- Add a `DialogHeader` with the day name and appointment count
- Keep all the inner content (stylist rows, expandable appointments) as-is inside a `ScrollArea`

### 3. Fix "appts" abbreviation
The memory notes say the system uses full words. Line 92 of `DayProviderBreakdownPanel` says "appt/appts" -- change to "appointment/appointments".

## Files Changed
- `src/components/dashboard/sales/WeekAheadForecast.tsx` -- bar click handler + dialog integration
- `src/components/dashboard/sales/DayProviderBreakdownPanel.tsx` -- refactor from inline panel to dialog popup
