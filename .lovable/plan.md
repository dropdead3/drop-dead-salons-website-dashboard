

## Expandable Location Rows (Replace Horizontal Scroll)

### Problem
The location table has too many columns (Location, Revenue, Trend, Services, Products, Transactions, Avg Ticket, Status, Arrow) causing a horizontal scroll that hides data. This feels clunky and forces users to scroll sideways to see important metrics.

### Solution
Replace the wide table with a compact card/row layout where each location shows only the essentials (Name + Revenue) by default. Tapping/clicking a row expands it to reveal the remaining data points in a clean, stacked layout below -- no horizontal scroll needed.

### Visual Design

**Collapsed (default):**
```text
[pin] North Mesa              $1,146   >
[pin] Val Vista Lakes           $875   >
```

**Expanded (after click):**
```text
[pin] North Mesa              $1,146   v
  +-----------------------------------------+
  |  Services    Products    Transactions    |
  |  $1,146      $0         6               |
  |                                         |
  |  Avg Ticket  Trend       Status         |
  |  $191        [sparkline] Pending        |
  +-----------------------------------------+
[pin] Val Vista Lakes           $875   >
```

- Clicking a row toggles it open/closed (chevron rotates from right to down)
- The expanded detail area uses a 2x3 or 3x2 grid of mini stat blocks
- Clicking the chevron or row again collapses it
- Clicking the detail area itself can still navigate to the full location drill-down (or we add a small "View details" link inside the expanded area)
- The "Today" Status info (checked out / pending / last appt time) renders inside the expanded section too

### What Changes

**`src/components/dashboard/AggregateSalesCard.tsx`** (location table section, ~lines 630-830):

1. **Replace the `<Table>` with a list of expandable rows**
   - Add `expandedLocationId` state (string or null) to track which row is open
   - Each row is a `div` with click handler to toggle expansion
   - Collapsed row shows: MapPin icon, location name, revenue amount, and a rotating ChevronRight/ChevronDown icon
   - Expanded section renders below with a grid of the remaining metrics

2. **Expanded detail grid** (inside each row when open):
   - 3-column grid on desktop, 2-column on mobile
   - Each cell: label (text-xs muted) + value (text-sm font-display)
   - Cells: Services, Products, Transactions, Avg Ticket, Trend (sparkline), and Status (if today)
   - A small "View full details" link at the bottom that navigates to the drill-down page

3. **Keep all existing functionality**:
   - Sorting still works (applied to the list order)
   - Sort controls move to a small dropdown or inline toggle above the list (since there are no column headers anymore)
   - Region filter stays in the header
   - Collapse/expand (show top 5) still works
   - CSV export still works

4. **Sort control replacement**:
   - Since we lose column headers, add a "Sort by: [Revenue v]" dropdown next to the region filter
   - Options: Revenue, Name, Services, Products, Transactions, Avg Ticket
   - Direction toggle (asc/desc) as a small button next to it

### Technical Details

- `expandedLocationId` state: `useState<string | null>(null)` -- only one row open at a time for clean UX
- Chevron rotation: use `transition-transform duration-200` with `rotate-90` when expanded
- Expanded content uses `framer-motion` AnimatePresence for smooth height animation (already installed)
- The sort dropdown replaces the clickable column headers -- same `handleLocationSort` logic, just triggered from a Select instead
- No new files needed -- all changes within `AggregateSalesCard.tsx`
- Mobile-first: the collapsed row is clean and readable at any width; expanded grid adapts via responsive columns

### Files Modified
1. `src/components/dashboard/AggregateSalesCard.tsx` -- replace table with expandable row list, add sort dropdown, add expandedLocationId state

