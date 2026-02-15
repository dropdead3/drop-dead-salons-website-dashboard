
## Refine Dashboard Header Layout

### Current State
The "Zura Insights" and "Announcements" buttons are stacked vertically inside a bordered container, which sits below the "Customize" button. This creates unnecessary vertical height in the header area.

### Changes

**File: `src/pages/dashboard/DashboardHome.tsx` (lines 247-263)**

Restructure the right-side controls so that:
1. The "Customize" button and the Insights/Announcements buttons all sit on the **same horizontal row**, aligned to the right
2. Remove the extra bordered container wrapping the two drawers -- instead, place "Zura Insights" and "Announcements" as peer-level elements alongside "Customize"
3. Use `flex items-center gap-3` so all three controls sit side by side in a single line

The result: a single clean row on the right side of the header containing `[Zura Insights] [Announcements] [Customize]` (or similar order), eliminating the stacked vertical layout and the extra bordered box.

### Technical Detail

Replace the current right-side `div` structure:
```
<div className="flex flex-col items-end gap-3">
  <DashboardCustomizeMenu ... />
  <div className="rounded-xl border ...">
    <div className="flex ... gap-3">
      <AIInsightsDrawer />
      <AnnouncementsDrawer />
    </div>
  </div>
</div>
```

With a flat horizontal layout:
```
<div className="flex items-center gap-3">
  {isLeadership ? <AIInsightsDrawer /> : <PersonalInsightsDrawer />}
  <AnnouncementsDrawer isLeadership={isLeadership} />
  <DashboardCustomizeMenu ... />
</div>
```

This removes the nested container and border, placing all action buttons inline. On mobile, the flex will wrap naturally. The Zura Insights drawer already opens full-width, so no changes needed there.
