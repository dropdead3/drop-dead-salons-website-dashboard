
## Fix Scroll on Happening Now Drill-Down

The Radix `ScrollArea` component is not resolving height correctly inside the flex column dialog layout, causing the list to overflow without scrolling. The fix is to replace it with a native scrollable div.

### Root Cause
Radix `ScrollArea` uses an internal viewport with `h-full w-full` that fails to resolve a concrete height inside nested flex containers, even with `flex-1 min-h-0`. This is a known Radix quirk.

### Changes (single file: `src/components/dashboard/LiveSessionDrilldown.tsx`)

1. **Remove** the `ScrollArea` import (line 2)
2. **Replace** the `ScrollArea` wrapper (lines 95-97 and 153-154) with a single native scrollable div:
   - Change `<div className="flex-1 min-h-0 overflow-hidden">` + `<ScrollArea className="h-full">` into one `<div className="flex-1 min-h-0 overflow-y-auto">`
   - Remove the closing `</ScrollArea>` and extra `</div>`

This gives the list a native scrollbar that respects the dialog's `max-h-[85vh]` constraint reliably.
