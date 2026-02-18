

## Client Visits Card — Gap Analysis and Enhancements

### Issues Found

**1. Card wrapper missing design token**
All three `<Card>` instances (loading, empty, main states) use bare `<Card>` without `className={tokens.card.wrapper}` (`rounded-2xl`). Every other analytics card applies this token.

**2. Profile link uses `<a>` instead of React Router `<Link>`**
Line 226 uses a raw `<a href=...>` for the stylist profile navigation. This causes a full page reload instead of a client-side transition. Must use `<Link to=...>` from `react-router-dom`.

**3. Drill-down stat values use raw classes instead of tokens**
The `<p className="text-sm font-medium">` on lines 238, 241, 245 should use `tokens.body.emphasis` (`font-sans text-sm font-medium text-foreground`) for consistency with the design system.

**4. No click affordance on the bar chart**
Users have no visual cue that bars are interactive. Add a small hint text below the chart ("Click a bar to explore") that fades out once a bar has been clicked, following the pattern used in other drill-down cards.

**5. No active-bar highlight**
When a bar is expanded, there is no visual distinction showing which bar is selected. The expanded bar should use a slightly stronger fill opacity or a different gradient stop to indicate selection.

**6. Drill-down sub-labels use raw classes**
`<p className="text-xs text-muted-foreground">` labels like "New Clients", "Returning", "Top Services" should use `tokens.label.tiny` or at minimum the muted body token for consistency.

### Plan

**File modified**: `src/components/dashboard/sales/ClientVisitsCard.tsx`

1. Add `className={tokens.card.wrapper}` to all three `<Card>` elements (loading, empty, main)
2. Replace the `<a href=...>` profile link with React Router `<Link to=...>` (add import)
3. Replace raw `text-sm font-medium` on drill-down stat values with `tokens.body.emphasis`
4. Replace raw `text-xs text-muted-foreground` on drill-down labels with appropriate tokens
5. Add a subtle "Click a bar to explore" hint below the chart that uses `tokens.body.muted` styling with reduced opacity, hidden once a bar has been clicked (track via a `hasInteracted` state)
6. Add active-bar highlighting: when `expandedStaff` matches a bar's `staffId`, use a second SVG gradient (`clientVisitsBarGradientActive`) with higher opacity stops (0.7 to 0.35) so the selected bar visually stands out

### No other files need changes
The hook (`useClientVisitsByStaff.ts`) and the integration in `SalesTabContent.tsx` are correct. The `PinnableCard` wrapper is applied externally as expected. The `AnalyticsFilterBadge` is correctly placed in the right column of the header.
