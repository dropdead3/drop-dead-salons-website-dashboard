
# Add Double-Click to Navigate to Day View

## Overview

Add the ability to double-click on a day column header in the Week view to navigate directly to the Day view for that specific date.

---

## Current Behavior

- The Week view displays 7 day columns with headers showing the day name (MON, TUE, etc.), date number, and appointment count
- Users must use the view toggle in the toolbar to switch between Week and Day views
- There's no quick way to jump to a specific day's detailed view

---

## Proposed Behavior

- Double-clicking on any day column header in Week view will:
  1. Set the calendar's current date to that day
  2. Switch the view from "week" to "day"
- This provides a natural, intuitive way to drill down into a specific day

---

## Technical Implementation

### 1. Update WeekView Component

**File:** `src/components/dashboard/schedule/WeekView.tsx`

Add a new prop for the double-click handler:

```typescript
interface WeekViewProps {
  currentDate: Date;
  appointments: PhorestAppointment[];
  hoursStart?: number;
  hoursEnd?: number;
  onAppointmentClick: (appointment: PhorestAppointment) => void;
  onSlotClick?: (date: Date, time: string) => void;
  selectedLocationId?: string;
  onDayDoubleClick?: (date: Date) => void;  // NEW PROP
}
```

Attach the handler to the day header cell (the div containing day name, date, and appointment count):

```tsx
<div 
  key={day.toISOString()} 
  className={cn(
    'py-3 px-2 text-center border-l border-border/50 cursor-pointer select-none',
    dayIsToday && 'bg-primary/10'
  )}
  onDoubleClick={() => onDayDoubleClick?.(day)}
>
  {/* existing header content */}
</div>
```

### 2. Update Schedule Page

**File:** `src/pages/dashboard/Schedule.tsx`

Create a handler function and pass it to WeekView:

```tsx
// Handler for double-clicking a day in week view
const handleDayDoubleClick = (date: Date) => {
  setCurrentDate(date);
  setView('day');
};

// In the render:
<WeekView
  currentDate={currentDate}
  appointments={displayAppointments}
  hoursStart={preferences.hours_start}
  hoursEnd={preferences.hours_end}
  onAppointmentClick={handleAppointmentClick}
  onSlotClick={handleSlotClick}
  selectedLocationId={selectedLocation}
  onDayDoubleClick={handleDayDoubleClick}  // NEW PROP
/>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/schedule/WeekView.tsx` | Add `onDayDoubleClick` prop to interface, add `cursor-pointer select-none` classes and `onDoubleClick` handler to day header cells |
| `src/pages/dashboard/Schedule.tsx` | Create `handleDayDoubleClick` function, pass it to WeekView component |

---

## User Experience

| Action | Result |
|--------|--------|
| Double-click on "TUE 27" header | Switches to Day view showing Tuesday, January 27 |
| Double-click on "SAT 31" header | Switches to Day view showing Saturday, January 31 |

The cursor will change to pointer on hover over the day headers to indicate they're interactive, and `select-none` prevents accidental text selection during double-click.
