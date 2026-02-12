

# Scale-Proof Location Comparison Bar

## Problem
When an organization has many locations (10, 50, 1,000+), the current divided bar and legend break down:
- Tiny slivers become invisible and unhoverable
- The legend lists every location regardless of count
- The 5-color palette repeats, making segments indistinguishable

## Solution: "Top N + Others" Grouping

Show the top locations individually, then roll everything else into a single "Others" segment with its own expandable detail.

### Bar Behavior
- Show the **top 5 locations** as individual colored segments (matches the 5-color palette exactly -- no repeats)
- Aggregate all remaining locations into a single **"Others"** segment in a neutral gray
- The "Others" segment is hoverable and shows: "X other locations: $total (Y%)"

### Legend Behavior
- Show legend entries only for the top 5 + "Others"
- Cap at 6 items max, always clean

### "Others" Expandable Detail
- Below the bar/legend, if "Others" exists, show a collapsible section
- Follows existing list-capping standards: top 5 visible, "Show all X locations" toggle
- When expanded with more than 8 items, wrap in a ScrollArea (max-h-[280px])
- Each row: location name + revenue + percentage (simple, no color dot needed since they share the gray bucket)

### Side-by-Side Cards
- Keep showing the top 2 locations as featured cards (no change)
- This remains the "Leader vs. Runner-up" comparison

## Technical Details

### Changes to `src/components/dashboard/sales/LocationComparison.tsx`

1. **Add constants**:
   - `MAX_BAR_SEGMENTS = 5` -- max individually colored segments
   - `MAX_VISIBLE_OTHERS = 5` -- initial cap for the "Others" expanded list

2. **Derive `displayData` and `othersData`** in `useMemo`:
   - `displayData` = top 5 from `chartData` (each gets a unique color)
   - `othersData` = remaining locations aggregated into one entry with `color: 'hsl(var(--muted))'`
   - `othersLocations` = the individual locations rolled into "Others" (for the expandable list)

3. **Bar rendering**: Map over `[...displayData, othersEntry]` instead of `chartData`
   - "Others" tooltip shows count and total

4. **Legend rendering**: Same array, 6 items max

5. **Expandable "Others" section** (new):
   - `useState` for `showOthers` toggle
   - `useState` for `showAllOthers` (list cap toggle)
   - Render a bordered section with location rows
   - Wrap in `ScrollArea` when count > 8 and fully expanded
   - Uses existing project patterns (ChevronDown rotation, "Show all X / Show less")

6. **Imports to add**: `useState` from React, `ScrollArea` from ui, `ChevronDown` from lucide

### No other files affected.
