

## Clean Up Executive Brief Card Nesting

### Problem
The Executive Brief area has three nested card layers:
1. Outer "Executive Brief" wrapper (with its own icon, title, close button, and `shadow-lg`)
2. The `WeeklyLeverSection` component (which is itself a `Card` with icon, title, and "Generate New" button)
3. The inner content area (empty state or recommendation)

This creates a visually redundant "card within a card within a card" effect and the outer wrapper adds an unnecessary `shadow-lg`.

### Solution
Remove the intermediate wrapper card entirely. When the Executive Brief button is expanded, render `WeeklyLeverSection` directly -- it already has its own card styling, header with icon, title, and action button. The close (X) button moves into the `WeeklyLeverSection` header row, passed as a callback prop.

### Changes

**File: `src/components/dashboard/analytics/LeadershipTabContent.tsx`**
- Remove the intermediate wrapper div (the one with `shadow-lg`, "EXECUTIVE BRIEF" header, and close button)
- Render `<WeeklyLeverSection />` directly inside the motion container
- Pass an `onClose` prop to `WeeklyLeverSection` so it can render the X button in its own header

**File: `src/components/dashboard/analytics/WeeklyLeverSection.tsx`**
- Accept an optional `onClose?: () => void` prop
- When `onClose` is provided, render the X close button in the header row (after the "Generate New" button)

### Result
The expanded Executive Brief will show exactly one card: the Weekly Lever card with its icon, title, Generate New button, and close button all in one header row. No nested card borders, no corner shadows.

