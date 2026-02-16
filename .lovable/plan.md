

# Polish: Move AI Copilot Toggle Into Schedule Header

## Problem
The Copilot toggle button sits outside the dark header bar as a standalone icon to the right, looking disconnected and awkward. It should live inside the header alongside the Settings gear icon.

## Solution

### 1. Remove the Copilot button from `Schedule.tsx`
Remove the `<Button>` with the Sparkles icon that currently sits next to the `<ScheduleHeader>` component (lines 379-389), along with the wrapping `<div className="flex items-center gap-2">` structure.

### 2. Add Copilot toggle into `ScheduleHeader.tsx`
- Pass `copilotOpen` and `onCopilotToggle` as new props to `ScheduleHeader`
- Place the Sparkles button inside the dark header bar, to the left of the Settings gear icon (in the right-side controls area around line 250)
- Style it consistently with the Settings button: `text-background/70 hover:text-background hover:bg-background/10`, with an active state when the copilot is open

### Files Changed
- `src/pages/dashboard/Schedule.tsx` -- remove external button, pass props
- `src/components/dashboard/schedule/ScheduleHeader.tsx` -- add Copilot toggle inside header bar

