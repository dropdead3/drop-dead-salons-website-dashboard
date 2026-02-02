
# Remove Demo Button from Schedule Page

## Overview
Remove the "Demo" button from the Schedule page header. This button currently toggles a demo mode that shows sample appointments for testing purposes.

## Changes Required

### File 1: `src/pages/dashboard/Schedule.tsx`

**Remove the demo mode toggle handler prop** (line 323):
- Remove `onDemoModeToggle={handleDemoModeToggle}` from the `ScheduleHeader` component props
- This will cause the button to not render since it's conditionally shown based on this prop

**Optionally clean up unused code**:
- Remove `handleDemoModeToggle` function (lines 219-227)
- Remove `demoMode` state if no longer needed elsewhere

### File 2: `src/components/dashboard/schedule/ScheduleHeader.tsx`

**Remove the Demo button JSX** (lines 253-276):
- Remove the entire `{/* Demo Mode Toggle */}` section
- Remove `FlaskConical` from the lucide-react import if no longer used

**Update Props Interface**:
- Remove `demoMode?: boolean` prop
- Remove `onDemoModeToggle?: () => void` prop

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/dashboard/Schedule.tsx` | Remove `onDemoModeToggle` prop, optionally clean up `handleDemoModeToggle` function |
| `src/components/dashboard/schedule/ScheduleHeader.tsx` | Remove Demo button JSX, remove related props from interface, remove unused import |

## Summary
A straightforward removal of the demo mode toggle button from the Schedule page header. The button is currently used for testing with sample appointments but is no longer needed in the production interface.
