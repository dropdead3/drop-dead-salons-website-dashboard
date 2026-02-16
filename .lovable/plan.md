

## Remove Executive Brief from Sidebar Navigation

Since the Executive Brief is now consolidated into the Leadership tab of the Analytics Hub and embedded in the Zura Business Insights card, the standalone sidebar entry is redundant.

### Changes

**1. Remove from sidebar nav registry**
- File: `src/config/dashboardNav.ts` (line 99)
- Delete the `executive-brief` entry from the nav items array

**2. Remove from default sidebar layout**
- File: `src/hooks/useSidebarLayout.ts` (line 86)
- Remove `/dashboard/admin/executive-brief` from the default link order

**3. Remove from guidance routes**
- File: `src/utils/guidanceRoutes.ts` (line 37)
- Remove `/dashboard/admin/executive-brief` from the guided routes list

**4. Keep the route in App.tsx**
- The route at `/dashboard/admin/executive-brief` already redirects to `/dashboard/admin/analytics?tab=leadership`, so it stays for backward compatibility (bookmarks, shared links)

**5. Update Decision History empty state text**
- File: `src/pages/dashboard/admin/DecisionHistoryPage.tsx` (line 49)
- Change "Visit the Executive Brief" to "Visit the Leadership tab in Analytics" since the standalone page no longer exists in nav

### What stays unchanged
- The `ExecutiveBriefPage.tsx` file (redirect logic)
- All executive-brief components (WeeklyLeverBrief, SilenceState, etc.) -- still used by the Analytics leadership tab and Business Insights card
- The route definition in App.tsx (backward-compatible redirect)

