

## Restyle Executive Brief as Inline Expandable Button

### Problem
The Executive Brief currently opens a side drawer (Sheet), but it should match the Zura Insights pattern: a compact pill button that expands into an inline card on the page.

### Solution
Replace the Sheet-based approach in `LeadershipTabContent.tsx` with a toggle button that expands/collapses the `WeeklyLeverSection` content inline, using the same visual pattern as `AIInsightsDrawer`:
- **Collapsed**: A compact pill button with icon + label + chevron (matching the Zura Insights button style)
- **Expanded**: An inline card below the button showing the full `WeeklyLeverSection` content with a close button

### Changes

**File: `src/components/dashboard/analytics/LeadershipTabContent.tsx`**

1. Remove all Sheet-related imports and markup
2. Add local `expanded` state toggle
3. Collapsed state: render a compact pill button matching the Zura Insights style:
   - `inline-flex items-center gap-2 h-9 px-4 rounded-md border border-border bg-background`
   - Target icon in a small rounded container
   - "Executive Brief" label
   - ChevronDown that rotates when expanded
4. Expanded state: render the `WeeklyLeverSection` inside an animated card (using framer-motion `AnimatePresence` for smooth open/close, matching the Zura Insights expand animation)
   - Card header with "EXECUTIVE BRIEF" title and close (X) button
   - `WeeklyLeverSection` content inside
5. Use framer-motion for the same transition feel as Zura Insights

### Visual

Collapsed:
```text
[Target] Executive Brief  [v]
```

Expanded:
```text
|-------------------------------------------------|
| EXECUTIVE BRIEF                           [X]   |
|-------------------------------------------------|
| [WeeklyLeverSection content]                    |
|-------------------------------------------------|
```

### Technical details
- Import `useState` from React, `AnimatePresence` and `motion` from framer-motion
- Remove `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetTrigger` imports
- Replace `ChevronRight` with `ChevronDown` and add `X` icon
- Button classes match `AIInsightsDrawer` line 309: `inline-flex items-center gap-2 h-9 px-4 rounded-md border border-border bg-background text-sm font-sans hover:bg-muted/50 transition-colors cursor-pointer`
- Expanded card classes match `AIInsightsDrawer` line 329: `w-full rounded-2xl shadow-lg border border-border/40 bg-card overflow-hidden`
- Single file change only

