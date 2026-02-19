

## Add "Beta Test" Badge to the Top Menu Bar

A small "BETA" badge will be added to the left of the search bar in the dashboard's top header to indicate the entire project is in beta testing.

### Changes

**`src/components/dashboard/DashboardLayout.tsx`**

Insert a styled badge between the left-side controls (sidebar toggle, nav arrows) and the center search bar area. The badge will:

- Display "BETA" in uppercase using `font-display` with wide tracking (per design system rules)
- Use a subtle glass-style appearance: `bg-amber-500/15 text-amber-600 border border-amber-500/30` (amber to signal "in progress / testing")
- Include a `FlaskConical` icon (already imported in the file) for visual context
- Be small and unobtrusive -- `text-[10px]` with a rounded-full pill shape
- Wrapped in a `Tooltip` showing "This project is currently in beta testing" on hover

The badge will be placed at approximately line 1100, after the `NavHistoryArrows` and `OrganizationSwitcher`, and before the search bar `div`.

### Visual Result

```text
[< >] [FLASK BETA]  |  [____Search...____ ⌘K]  |  [Bell] [Avatar]
```

### Technical Details

- No new files needed -- single edit to `DashboardLayout.tsx`
- Uses the already-imported `FlaskConical` icon, `Tooltip`/`TooltipContent`/`TooltipTrigger`, and `Badge` components
- Follows design system: `font-display` for the label, `font-medium` max weight, no banned bold classes
