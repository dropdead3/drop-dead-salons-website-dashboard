
# Split Booking Metrics to Standalone Card

## Overview
Extract the "Booked Today" and "Booked This Week" metrics from the Sales Overview card into a dedicated "New Bookings" card on the Command Center dashboard.

## Changes Required

### 1. Create New Component: `src/components/dashboard/NewBookingsCard.tsx`

A standalone card that displays:
- Header: "NEW BOOKINGS" with CalendarPlus icon
- Two metric tiles side-by-side:
  - Booked Today (with CalendarPlus icon, blue)
  - Booked This Week (with CalendarRange icon, purple)
- Info tooltips explaining each metric

### 2. Update `src/components/dashboard/AggregateSalesCard.tsx`

Remove the two booking metric tiles (lines ~400-423):
- Remove "Booked Today" tile
- Remove "Booked This Week" tile  
- Remove `useNewBookings` hook import and usage
- Remove `CalendarPlus` and `CalendarRange` icon imports

The Sales Overview card will now show only 6 KPIs:
- Total Revenue, Services, Products
- Transactions, Avg Ticket, Rev. Tomorrow

### 3. Update `src/pages/dashboard/DashboardHome.tsx`

Add the new `NewBookingsCard` after the Sales Overview section:

```tsx
{/* New Bookings - Leadership Only */}
{isLeadership && (
  <VisibilityGate elementKey="new_bookings">
    <NewBookingsCard />
  </VisibilityGate>
)}
```

## Visual Result

**Sales Overview Card** (cleaned up - 6 KPIs in 2 rows of 3):
```
| Total Revenue | Services | Products    |
| Transactions  | Avg Ticket| Rev. Tomorrow|
```

**New Bookings Card** (new standalone):
```
┌────────────────────────────────────────┐
│ 📅+ NEW BOOKINGS                       │
├────────────────────────────────────────┤
│  📅+              📅≡                  │
│   3                 3                  │
│ Booked Today ⓘ  Booked This Week ⓘ    │
└────────────────────────────────────────┘
```

## Technical Details

### NewBookingsCard Component Structure:
```tsx
export function NewBookingsCard() {
  const { data: newBookings, isLoading } = useNewBookings();

  return (
    <Card className="p-6">
      {/* Header with CalendarPlus icon */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-500/10 flex items-center justify-center rounded-lg">
          <CalendarPlus className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="font-display text-sm tracking-wide">NEW BOOKINGS</h2>
          <p className="text-xs text-muted-foreground">Appointments created</p>
        </div>
      </div>

      {/* Two metric tiles */}
      <div className="grid grid-cols-2 gap-4">
        {/* Booked Today */}
        <div className="text-center p-4 bg-muted/30 rounded-lg">
          <CalendarPlus className="w-5 h-5 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-display">{newBookings?.bookedToday || 0}</p>
          <div className="flex items-center gap-1 justify-center mt-1">
            <p className="text-xs text-muted-foreground">Booked Today</p>
            <MetricInfoTooltip description="..." />
          </div>
        </div>

        {/* Booked This Week */}
        <div className="text-center p-4 bg-muted/30 rounded-lg">
          <CalendarRange className="w-5 h-5 text-purple-600 mx-auto mb-2" />
          <p className="text-2xl font-display">{newBookings?.bookedThisWeek || 0}</p>
          <div className="flex items-center gap-1 justify-center mt-1">
            <p className="text-xs text-muted-foreground">Booked This Week</p>
            <MetricInfoTooltip description="..." />
          </div>
        </div>
      </div>
    </Card>
  );
}
```

## File Summary

| File | Action |
|------|--------|
| `src/components/dashboard/NewBookingsCard.tsx` | Create new component |
| `src/components/dashboard/AggregateSalesCard.tsx` | Remove booking tiles + cleanup imports |
| `src/pages/dashboard/DashboardHome.tsx` | Add NewBookingsCard to layout |
