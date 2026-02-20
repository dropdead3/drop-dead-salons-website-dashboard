

# Floating Action Bar for Schedule Page

## What Changes
The bottom action bar on the Schedule page currently sits flush against the edges with a flat `border-t` style. It needs to match the floating, rounded aesthetic of the collapsed sidebar and top navigation bar -- using `rounded-full`, glassmorphism (`bg-card/80 backdrop-blur-xl border-border`), and floating with margin from the edges.

## Changes

### File: `src/components/dashboard/schedule/ScheduleActionBar.tsx`

Update the outer wrapper div styling:

**Current:**
```
bg-card border-t border-border px-4 py-2.5
```

**New:**
```
bg-card/80 backdrop-blur-xl border border-border rounded-full px-6 py-2.5 mx-4 mb-4 shadow-lg
```

- `rounded-full` -- pill shape matching top nav and collapsed sidebar
- `bg-card/80 backdrop-blur-xl` -- glassmorphism treatment consistent with other floating elements
- `border border-border` -- full border instead of just `border-t`
- `mx-4 mb-4` -- floating margin from edges (bottom and sides)
- `shadow-lg` -- subtle elevation to lift it off the background
- Remove the `border-t-2 border-t-primary/60` selection highlight (replace with a subtler indicator that works with rounded-full, such as a ring or shadow)

### File: `src/pages/dashboard/Schedule.tsx`

Adjust the layout so the action bar floats over the calendar content rather than being a flex child that pushes content up. Wrap it in a container or use absolute/fixed positioning at the bottom of the schedule area so the calendar gets full height beneath it.

