

## Rename "My Schedule" to "My Work Days"

Update the card title and all related labels across the codebase for consistency.

### Changes

**1. `src/components/dashboard/WorkScheduleWidgetCompact.tsx`**
- Change both instances of `MY SCHEDULE` to `MY WORK DAYS` (lines 32 and 49)

**2. `src/components/dashboard/WidgetsSection.tsx`**
- Rename the widget label from `My Schedule` to `My Work Days` (line 22)
- Update the VisibilityGate `elementName` from `My Schedule Widget` to `My Work Days Widget` (line 137)

**3. `src/components/dashboard/DashboardCustomizeMenu.tsx`**
- Rename the customization menu label from `My Schedule` to `My Work Days` (line 141)

**4. `src/components/dashboard/PersonalInsightsDrawer.tsx`**
- Rename the insight category label from `My Schedule` to `My Work Days` (line 39)

### Files not changed (intentionally)
- `AIChatPanel.tsx` -- conversational prompt ("What's my schedule today?") reads naturally as-is
- `send-insights-email/index.ts` -- edge function emoji map key; changing would require coordination with insight generation logic

### Files Modified
- `src/components/dashboard/WorkScheduleWidgetCompact.tsx`
- `src/components/dashboard/WidgetsSection.tsx`
- `src/components/dashboard/DashboardCustomizeMenu.tsx`
- `src/components/dashboard/PersonalInsightsDrawer.tsx`
