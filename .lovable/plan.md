

# Drill-Down by Service Category for Forecasting Cards

## What This Does
Clicking any of the 3 summary stat cards expands a breakdown panel showing that card's specific metric grouped by service category. Each card tells its own story.

## Card-Specific Drill-Downs

### 7-Day Total (Revenue)
Shows total revenue per service category for the forecast period.

```text
Color          $3,200   39%  ████████████░░░░░░░
Blonding       $2,400   29%  █████████░░░░░░░░░░
Haircut        $1,500   18%  ██████░░░░░░░░░░░░░
Extensions     $1,108   14%  ████░░░░░░░░░░░░░░░
```

### Daily Avg (Revenue per Day)
Shows average daily revenue per service category (category total / number of forecast days).

```text
Color          $457/day   39%  ████████████░░░░░░░
Blonding       $343/day   29%  █████████░░░░░░░░░░
Haircut        $214/day   18%  ██████░░░░░░░░░░░░░
Extensions     $158/day   14%  ████░░░░░░░░░░░░░░░
```

### Appointments (Count)
Shows appointment count per service category -- no dollar signs, just counts.

```text
Color          28 appts   39%  ████████████░░░░░░░
Haircut        18 appts   25%  ████████░░░░░░░░░░░
Blonding       14 appts   20%  ██████░░░░░░░░░░░░░
Styling        11 appts   16%  █████░░░░░░░░░░░░░░
```

## UX Behavior
- Clicking a card toggles the breakdown panel below the 3-card grid
- Clicking a different card swaps the panel content (no collapse/re-expand)
- Clicking the same card again collapses the panel
- Active card gets a subtle ring/border highlight
- Panel animates with framer-motion (height + opacity)
- Sorted by the active metric descending (revenue for Total/Avg, count for Appointments)

## Technical Changes

### 1. Hooks: `useForecastRevenue.ts` and `useWeekAheadRevenue.ts`
- Add `service_category` to the `.select()` query on `phorest_appointments`
- Aggregate a `byCategory` map in the return data:

```text
byCategory: Record<string, { revenue: number; count: number }>
```

Both values are always computed so any card can render its view without re-fetching.

### 2. Component: `ForecastingCard.tsx`
- Add `selectedCard` state: `'total' | 'avg' | 'appointments' | null`
- Make each stat card clickable with hover effect and a subtle chevron/indicator
- Render a `CategoryBreakdownPanel` below the grid using `AnimatePresence`
- The panel receives `selectedCard` and `byCategory` data
- Panel rendering logic per card type:
  - **total**: Shows `category.revenue` formatted as currency, sorted by revenue desc
  - **avg**: Shows `category.revenue / dayCount` formatted as currency with "/day" suffix, sorted by avg desc
  - **appointments**: Shows `category.count` formatted as integer with "appts" suffix, sorted by count desc
- Each row includes a percentage bar (proportion of total for that metric)

### 3. Component: `WeekAheadForecast.tsx`
- Same pattern applied to the week-ahead view's stat cards

### 4. Shared `CategoryBreakdownPanel` Component
A small shared component that accepts:
- `data`: the `byCategory` map
- `mode`: `'revenue' | 'dailyAvg' | 'count'`
- `dayCount`: number (needed for daily avg calculation)

Handles formatting, sorting, and percentage bar rendering for all three modes.

### File Change Summary

| File | Changes |
|------|---------|
| `src/hooks/useForecastRevenue.ts` | Add `service_category` to select, aggregate `byCategory` |
| `src/hooks/useWeekAheadRevenue.ts` | Same: add `service_category`, aggregate `byCategory` |
| `src/components/dashboard/sales/CategoryBreakdownPanel.tsx` | New shared component for the expandable breakdown rows |
| `src/components/dashboard/sales/ForecastingCard.tsx` | Clickable stat cards, selectedCard state, render breakdown panel |
| `src/components/dashboard/sales/WeekAheadForecast.tsx` | Same clickable pattern with breakdown panel |

No database changes needed -- `service_category` already exists on `phorest_appointments`.

