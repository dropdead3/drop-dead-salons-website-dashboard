

## Add Executive Brief Button to Leadership Tab

### What changes

**1. Remove the Infotainer banner**
- File: `src/components/dashboard/analytics/LeadershipTabContent.tsx`
- Remove the "EXECUTIVE INTELLIGENCE" Infotainer component entirely

**2. Add an "Executive Brief" button to the Leadership tab**
- Add a button (e.g., "View Executive Brief") at the top of the Leadership tab that opens a dialog/drawer containing the Weekly Lever content
- When clicked, it opens a Sheet (slide-over drawer) showing:
  - The `WeeklyLeverSection` content (lever recommendation or SilenceState/KPI setup prompt)
  - Generate New button for refreshing the lever
- This keeps the Leadership tab clean (Executive Summary + Trend Chart) while making the AI brief one click away

**3. Implementation in `LeadershipTabContent.tsx`**
- Import `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetTrigger` from the existing UI components
- Import `WeeklyLeverSection` (already exists at `src/components/dashboard/analytics/WeeklyLeverSection.tsx`)
- Add a row at the top with a styled button: "Executive Brief" with a `Brain` or `Target` icon
- Clicking opens a Sheet from the right containing `WeeklyLeverSection`

### Visual layout

```text
|-------------------------------------------------------|
| [Target] Executive Brief  ............  [View Brief >] |
|-------------------------------------------------------|
|                                                       |
|  [Executive Summary Card]                             |
|                                                       |
|  [Executive Trend Chart]                              |
|                                                       |
|-------------------------------------------------------|
```

When the button is clicked, a right-side drawer slides open with the full Weekly Lever content (recommendation, silence state, or KPI setup prompt).

### Technical details
- File to modify: `src/components/dashboard/analytics/LeadershipTabContent.tsx`
- No new files needed -- reuses existing `WeeklyLeverSection` and shadcn `Sheet` components
- The Infotainer import can be removed since it will no longer be used here

