

# Improve Forecasting Card Hover Tooltip UI

## The Problem

The current tooltip on the Forecasting bar chart has a plain, basic appearance:
- Simple dark background with basic text
- No visual hierarchy between the date and revenue values
- "Unconfirmed: $0" and "Confirmed: $1,851" displayed as plain text
- Lacks the polished look of other tooltips in the application

## Solution

Create a custom tooltip component for the ForecastingCard that matches the design patterns used elsewhere (like `StaffRevenueLeaderboard`), featuring:
- Better visual hierarchy with styled labels
- Color-coded indicators for confirmed vs unconfirmed revenue
- Appointment count displayed with proper styling
- Consistent theming with the rest of the dashboard

## File to Modify

### `src/components/dashboard/sales/ForecastingCard.tsx`

**Change 1: Add a new `ForecastTooltip` component (around line 65-80)**

```typescript
// Custom tooltip for forecast chart
function ForecastTooltip({ active, payload, label, days, weeks, showWeeklyChart }: any) {
  if (!active || !payload?.length) return null;
  
  const data = payload[0]?.payload;
  if (!data) return null;

  // Get the display label (date or week)
  let displayLabel = label;
  if (showWeeklyChart) {
    const week = weeks?.find((w: WeekForecast) => w.weekLabel === label);
    displayLabel = week ? week.weekLabel : label;
  } else {
    const day = days?.find((d: DayForecast) => d.dayName === label);
    displayLabel = day ? format(parseISO(day.date), 'EEEE, MMM d') : label;
  }
  
  const confirmedRevenue = data.confirmedRevenue || 0;
  const unconfirmedRevenue = data.unconfirmedRevenue || 0;
  const totalRevenue = data.totalRevenue || 0;
  const appointments = data.appointments || 0;

  return (
    <div className="rounded-lg border bg-background p-3 shadow-lg min-w-[180px]">
      <p className="font-medium text-sm mb-2">{displayLabel}</p>
      
      <div className="space-y-1.5">
        {/* Confirmed Revenue */}
        <div className="flex items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-muted-foreground">Confirmed</span>
          </div>
          <span className="font-medium tabular-nums">
            ${confirmedRevenue.toLocaleString()}
          </span>
        </div>
        
        {/* Unconfirmed Revenue - only show if > 0 */}
        {unconfirmedRevenue > 0 && (
          <div className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary/40" />
              <span className="text-muted-foreground">Unconfirmed</span>
            </div>
            <span className="font-medium tabular-nums text-muted-foreground">
              ${unconfirmedRevenue.toLocaleString()}
            </span>
          </div>
        )}
        
        {/* Divider */}
        <div className="border-t border-border/50 my-1.5" />
        
        {/* Total */}
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-muted-foreground">Total</span>
          <span className="font-semibold tabular-nums text-primary">
            ${totalRevenue.toLocaleString()}
          </span>
        </div>
        
        {/* Appointments */}
        <div className="flex items-center justify-between gap-4 text-xs">
          <span className="text-muted-foreground">Appointments</span>
          <span className="font-medium tabular-nums">{appointments}</span>
        </div>
      </div>
    </div>
  );
}
```

**Change 2: Update the `<Tooltip>` component usage (lines 490-510)**

Replace the inline `contentStyle` and `formatter`/`labelFormatter` with the new custom component:

```typescript
<Tooltip
  content={
    <ForecastTooltip 
      days={days} 
      weeks={weeks} 
      showWeeklyChart={showWeeklyChart} 
    />
  }
  cursor={{ fill: 'hsl(var(--muted))', fillOpacity: 0.3 }}
/>
```

## Visual Design

```text
┌──────────────────────────────┐
│ Tuesday, Feb 10              │  <- Bold date header
├──────────────────────────────┤
│ ● Confirmed      $1,851      │  <- Solid dot, primary color
│ ◐ Unconfirmed        $0      │  <- Faded dot, muted (hidden if $0)
├──────────────────────────────┤
│ Total            $1,851      │  <- Bold, primary accent
│ Appointments        14       │  <- Small, muted
└──────────────────────────────┘
```

## Benefits

1. **Better Visual Hierarchy**: Clear distinction between header, data rows, and totals
2. **Color-Coded Indicators**: Dots show confirmed (solid) vs unconfirmed (faded)
3. **Cleaner Layout**: Aligned columns with proper spacing
4. **Contextual Display**: Hides "Unconfirmed" row when there's no unconfirmed revenue
5. **Consistent Design**: Matches other tooltip patterns in the app
6. **Enhanced Hover State**: Subtle cursor highlight on the bar

