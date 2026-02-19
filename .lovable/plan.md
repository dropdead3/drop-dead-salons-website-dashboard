

## Move Zura Insights and Announcements Buttons to Analytics Header

### What Changes
The Zura Insights and Announcements buttons will move from the top of the page (where the greeting used to be) down to where the "YOUR COMMAND CENTER" heading currently sits. The "YOUR COMMAND CENTER" heading will be removed entirely. This collapses the top of the page and makes the layout cleaner.

### Changes

**File: `src/pages/dashboard/DashboardHome.tsx`**

1. **Remove the top buttons block (lines 272-280)**: Delete the `motion.div` that renders `AIInsightsDrawer` / `PersonalInsightsDrawer` and `AnnouncementsDrawer` at the top of the page, including its `border-b` divider.

2. **Replace "YOUR COMMAND CENTER" heading with the buttons (lines 736-754 and 776-794)**: In both the compact and detailed analytics rendering paths, replace the `h2` heading (`t('home.analytics')`) with the Zura Insights and Announcements buttons. The filter bar and customize menu remain in place on the right side -- only the left-side heading text is swapped out for the two buttons.

**File: `src/locales/en.json`** (optional cleanup)
- The `"analytics": "YOUR COMMAND CENTER"` translation key can be left in place or removed since it will no longer be referenced on this page.

### Result
The top of the Command Center page becomes significantly cleaner -- no floating buttons above the content. Instead, the Zura Insights and Announcements buttons sit naturally at the start of the analytics section, replacing the redundant "YOUR COMMAND CENTER" label.
