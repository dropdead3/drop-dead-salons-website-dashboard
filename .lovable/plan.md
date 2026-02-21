

## Standardize Back Buttons Across All Dashboard Pages

### The Problem

Back buttons are implemented inconsistently across the app with at least 5 different patterns:

| Pattern | Example | Issues |
|---------|---------|--------|
| Unicode arrow `←` in text | Settings page "← Back to Settings" | No icon component, plain text arrow |
| `ArrowLeft` icon + text label | ViewProfile "Back to Directory" | Inconsistent sizing, spacing |
| Icon-only ghost button with `Link` | ChallengeDetail, ZuraConfig | No visible label (accessibility concern) |
| `DashboardPageHeader` with `backTo` | ManagementHub, AnalyticsHub | Already standardized (the good pattern) |
| Inline `<button>` element | ReportsTabContent "← Back to Reports" | Not even using the Button component |

### The Standard

`DashboardPageHeader` is the correct, already-established pattern for dashboard pages. It renders:
- An `ArrowLeft` icon-only ghost button (with accessible `aria-label` and `title`)
- Inline with the page title and description
- Consistent sizing and spacing

For **in-page** back buttons (like Settings category view or Reports drill-down), where a full page header isn't appropriate, the pattern should be a consistent ghost button with `ArrowLeft` icon + text label.

### Changes

**Group 1: Convert to `DashboardPageHeader` (pages that have their own ad-hoc back + title combo)**

| File | Current Pattern | Change |
|------|----------------|--------|
| `MeetingDetails.tsx` | Standalone `Button` + `ArrowLeft` + "Back to Meetings" | Use `DashboardPageHeader` with `backTo="/dashboard/schedule-meeting"` |
| `MeetingInbox.tsx` | `Link` wrapping `Button` + `ArrowLeft` + "Back to Meetings Hub" | Use `DashboardPageHeader` with `backTo="/dashboard/schedule-meeting"` |
| `ViewProfile.tsx` | `Button` ghost + `ArrowLeft` + "Back to Directory" (3 instances) | Use `DashboardPageHeader` with `backTo="/dashboard/directory"` |
| `ChallengeDetail.tsx` | Icon-only `Button` in `Link` | Use `DashboardPageHeader` with `backTo="/dashboard/admin/challenges"` |
| `ZuraConfigPage.tsx` | Icon-only `Button` in `Link` | Use `DashboardPageHeader` with `backTo="/dashboard/admin/management"` |
| `AccountManagement.tsx` | Icon-only `Button` in `Link` | Use `DashboardPageHeader` with `backTo="/dashboard/admin/management"` |
| `DocumentTracker.tsx` | Icon-only `Button` in `Link` | Use `DashboardPageHeader` with `backTo="/dashboard/admin/management"` |
| `SEOWorkshopHub.tsx` | Icon-only `Button` in `Link` | Use `DashboardPageHeader` with `backTo="/dashboard/admin/management"` |

**Group 2: In-page back buttons (drill-down within same page, not full page navigation)**

| File | Current Pattern | Change |
|------|----------------|--------|
| `Settings.tsx` | `← Back to Settings` (unicode arrow, text) | `ArrowLeft` icon + "Back to Settings" in a ghost `Button`, consistent class |
| `ReportsHub.tsx` | `← Back to Reports` (unicode arrow) | `ArrowLeft` icon + "Back to Reports" |
| `ReportsTabContent.tsx` | Inline `<button>` with `← Back to Reports` | Convert to `Button` component with `ArrowLeft` icon |

**Group 3: Error/empty state back buttons (keep inline but standardize style)**

| File | Current Pattern | Change |
|------|----------------|--------|
| `AccountDetail.tsx` | `← Back to Accounts` (unicode arrow in PlatformButton) | `ArrowLeft` icon + "Back to Accounts" |

### Standardized In-Page Back Button Pattern

For Group 2 and 3, the consistent pattern will be:

```tsx
<Button 
  variant="ghost" 
  size="sm"
  className="-ml-2 text-muted-foreground hover:text-foreground"
  onClick={handler}
>
  <ArrowLeft className="w-4 h-4 mr-1.5" />
  Back to Settings
</Button>
```

This replaces all unicode `←` arrows with the proper `ArrowLeft` icon and ensures consistent sizing, spacing, and hover behavior.

### Files Modified

| # | File | Complexity |
|---|------|-----------|
| 1 | `src/pages/dashboard/MeetingDetails.tsx` | Low -- replace 2 inline back buttons with `DashboardPageHeader` |
| 2 | `src/pages/dashboard/meetings/MeetingInbox.tsx` | Low -- replace Link+Button with `DashboardPageHeader` |
| 3 | `src/pages/dashboard/ViewProfile.tsx` | Low -- replace 3 back buttons with `DashboardPageHeader` |
| 4 | `src/pages/dashboard/admin/ChallengeDetail.tsx` | Low -- replace icon-only back with `DashboardPageHeader` |
| 5 | `src/pages/dashboard/admin/ZuraConfigPage.tsx` | Low -- replace with `DashboardPageHeader` |
| 6 | `src/pages/dashboard/admin/AccountManagement.tsx` | Low -- replace with `DashboardPageHeader` |
| 7 | `src/pages/dashboard/admin/DocumentTracker.tsx` | Low -- replace with `DashboardPageHeader` |
| 8 | `src/pages/dashboard/admin/SEOWorkshopHub.tsx` | Low -- replace with `DashboardPageHeader` |
| 9 | `src/pages/dashboard/admin/Settings.tsx` | Trivial -- swap `←` for `ArrowLeft` icon |
| 10 | `src/pages/dashboard/admin/ReportsHub.tsx` | Trivial -- swap `←` for `ArrowLeft` icon |
| 11 | `src/components/dashboard/analytics/ReportsTabContent.tsx` | Trivial -- convert `<button>` to `<Button>` with `ArrowLeft` |
| 12 | `src/pages/dashboard/platform/AccountDetail.tsx` | Trivial -- swap `←` for `ArrowLeft` icon |

### What Does NOT Change

- Pages already using `DashboardPageHeader` (ManagementHub, AnalyticsHub) -- already correct
- Pages using `PlatformPageHeader` (all platform/* pages) -- already correct and use a different design system
- Auth/public pages (UnifiedLogin "Back to home") -- different context, not dashboard navigation
- In-component navigation (QuickBookingPopover "Back to categories") -- wizard flow, not page-level

