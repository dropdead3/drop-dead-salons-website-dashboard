

# Bar Drill-Down: Appointments by Service Provider

## What Changes

Clicking any bar in the Revenue Forecast chart will expand an inline panel below the chart showing that day's appointments grouped by stylist/service provider. This follows the existing drill-down pattern (framer-motion expand, nested breakdown styling) used throughout the analytics hub.

## User Experience

1. User clicks a bar (or taps on mobile)
2. The bar highlights and a panel smoothly expands below the chart
3. The panel shows:
   - Day header (e.g., "Wednesday, Feb 17 -- 20 appointments")
   - Stylist rows sorted by revenue (highest first), each showing:
     - Stylist name
     - Appointment count
     - Revenue total
     - Expandable list of their individual appointments (service name, time, client, price)
4. Clicking another bar switches the drill-down; clicking the same bar closes it
5. The existing "X appts" text link continues to open the full DayAppointmentsSheet side panel

## Technical Approach

### 1. New Component: `DayProviderBreakdownPanel.tsx`
Location: `src/components/dashboard/sales/DayProviderBreakdownPanel.tsx`

- Accepts: `day: DayForecast | null`, `isOpen: boolean`
- Groups `day.appointments` by `stylist_name`
- Renders a `framer-motion` `AnimatePresence` panel (matching `CategoryBreakdownPanel` animation pattern)
- Each stylist row is expandable to show their individual appointments
- Uses `pl-6 border-l-2 border-primary/20` nested styling for appointment details
- Caps at 5 stylists with "Show all" toggle; uses `ScrollArea` if > 8

### 2. Update `WeekAheadForecast.tsx`
- Add `selectedBarDay` state (`DayForecast | null`)
- Add `onClick` handler to each `<Cell>` in the `<Bar>` components that sets `selectedBarDay`
- Highlight the selected bar (increased opacity or ring)
- Render `<DayProviderBreakdownPanel>` between the chart and the "Busiest day" callout
- Selected bar gets a subtle visual indicator (e.g., stroke outline)

### 3. No Backend Changes
All appointment data (including `stylist_name`) is already fetched by `useWeekAheadRevenue` and stored in each `DayForecast.appointments` array. No additional queries needed.

## Visual Design

- Panel uses the standard nested breakdown styling: `bg-muted/30 rounded-lg border border-border/30`
- Stylist rows show a horizontal bar (percentage of day's revenue) matching the luxury glass aesthetic
- Uses design tokens for typography (`tokens.heading.subsection` for "By Provider" label, `tokens.body.muted` for details)
- Smooth `framer-motion` height animation (0.3s ease-out) matching existing drill-down panels

