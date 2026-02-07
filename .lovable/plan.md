
# Format Meetings & Accountability Page to Match Dashboard Style

## Current Issues

Looking at the screenshot, the page has several layout inconsistencies compared to standard dashboard pages:

| Issue | Current | Should Be |
|-------|---------|-----------|
| Max width | `max-w-4xl` (~56rem) | `max-w-[1600px]` (full dashboard width) |
| Title size | `text-2xl` | `text-3xl lg:text-4xl` |
| Spacing | Basic padding | `space-y-6` consistent spacing |
| Layout | Narrow centered column | Full-width dashboard layout |

## Solution

Update the page layout and header styling to match other dashboard pages like Reward Shop, Management Hub, and Team Directory.

## Changes

### File: `src/pages/dashboard/ScheduleMeeting.tsx`

**Layout Container Changes:**
- Change `max-w-4xl` to `max-w-[1600px]` for full dashboard width
- Add `space-y-6` for consistent section spacing

**Header Changes:**
- Increase title from `text-2xl` to `text-3xl lg:text-4xl`
- Ensure consistent spacing with `mt-1` on description

**Tabs Content:**
- Adjust spacing to use `space-y-6` pattern

```tsx
// Before
<div className="p-6 lg:p-8 max-w-4xl mx-auto">
  <div className="mb-8">
    <h1 className="text-2xl font-display font-medium mb-2">Meetings & Accountability</h1>
    <p className="text-muted-foreground">...</p>
  </div>
  <Tabs defaultValue="schedule" className="space-y-6">

// After  
<div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
  <div>
    <h1 className="font-display text-3xl lg:text-4xl">Meetings & Accountability</h1>
    <p className="text-muted-foreground mt-1">...</p>
  </div>
  <Tabs defaultValue="schedule">
```

---

## Visual Result

**Before:**
- Narrow column (~900px wide) centered in the page
- Small header text
- Content feels cramped in wide viewport

**After:**
- Full dashboard width (up to 1600px)
- Large, bold header matching other pages
- Content spreads naturally across the available space
- Consistent with Reward Shop, Management Hub, Team Directory

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/dashboard/ScheduleMeeting.tsx` | Update container max-width, header typography, spacing classes |
