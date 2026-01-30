

## Onboarding Dashboard for Organization Go-Live Tracking

This plan creates a dedicated Onboarding Dashboard where platform admins can track organizations through their onboarding journey, view upcoming go-live dates, and manage next steps for each account.

---

### Overview

The Onboarding Dashboard will provide:
- **Timeline View**: Visual representation of organizations progressing through onboarding stages
- **Go-Live Calendar**: Upcoming and overdue go-live dates with clear visual indicators
- **Stage Tracking**: Kanban-style or list view showing organizations grouped by stage
- **Action Items**: Per-organization checklist of next steps with quick action buttons

---

### Changes Summary

| Area | File | Action |
|------|------|--------|
| New Page | `src/pages/dashboard/platform/Onboarding.tsx` | **Create** - Main onboarding dashboard |
| New Hook | `src/hooks/useOnboardingOrganizations.ts` | **Create** - Data fetching for onboarding orgs |
| Sidebar | `src/components/platform/layout/PlatformSidebar.tsx` | **Edit** - Add nav link |
| Routing | `src/App.tsx` | **Edit** - Add route for new page |

---

### Dashboard Layout Design

The dashboard will be organized into three main sections:

```text
+------------------------------------------------------------------+
|  Onboarding Dashboard                              [+ New Account]|
|  Track accounts through their go-live journey                     |
+------------------------------------------------------------------+
|                                                                   |
|  SUMMARY CARDS (4 columns)                                        |
| +-------------+ +-------------+ +-------------+ +-------------+   |
| | Total       | | Approaching | | Overdue     | | Avg Days    |   |
| | Onboarding  | | (7 days)    | | Go-Lives    | | to Go-Live  |   |
| | 12          | | 3           | | 2           | | 28 days     |   |
| +-------------+ +-------------+ +-------------+ +-------------+   |
|                                                                   |
+------------------------------------------------------------------+
|                                                                   |
|  GO-LIVE TIMELINE (2/3 width)  |  STAGE BREAKDOWN (1/3 width)    |
| +---------------------------+  | +---------------------------+    |
| | Upcoming Go-Lives         |  | | By Stage                  |    |
| | [Feb 5] Acme Salon  #1002 |  | | New (3)          ●●●      |    |
| | [Feb 12] Beauty Co #1005  |  | | Importing (4)    ●●●●     |    |
| | [Feb 15] Style Hub #1008  |  | | Training (5)     ●●●●●    |    |
| | ...                       |  | | Live (23)                 |    |
| +---------------------------+  | +---------------------------+    |
|                                                                   |
+------------------------------------------------------------------+
|                                                                   |
|  ORGANIZATION CARDS (full width, grouped by stage)                |
| +------------------------------------------------------------------+
| | NEW (3 accounts)                                     [Expand All]|
| +------------------------------------------------------------------+
| | +------------------------------------------------------------+  |
| | | Acme Salon #1002                        Go-Live: Feb 5     |  |
| | | Contact: john@acme.com   Source: Phorest                   |  |
| | | Next Steps:                                                |  |
| | | [ ] Schedule kickoff call                                  |  |
| | | [ ] Request data export                                    |  |
| | | [Import Data] [Edit] [View Dashboard]                      |  |
| | +------------------------------------------------------------+  |
| +------------------------------------------------------------------+
|                                                                   |
| | IMPORTING (4 accounts)                                          |
| | ...                                                             |
+------------------------------------------------------------------+
```

---

### Implementation Details

#### 1. Create Data Hook (`useOnboardingOrganizations.ts`)

A specialized hook that fetches organizations not yet "live" with enriched data:

```typescript
interface OnboardingOrganization extends Organization {
  locationCount: number;
  daysUntilGoLive: number | null;
  isOverdue: boolean;
  isApproaching: boolean; // within 7 days
}

interface OnboardingStats {
  totalOnboarding: number;
  approaching: number;     // go-live within 7 days
  overdue: number;         // past go-live but not live
  byStage: Record<string, number>;
  avgDaysToGoLive: number | null;
}
```

The hook will:
- Filter for `onboarding_stage != 'live'` (or status = 'pending')
- Calculate days until go-live for each organization
- Aggregate stats for the summary cards
- Support sorting by go-live date, stage, or created date

#### 2. Create Onboarding Dashboard Page (`Onboarding.tsx`)

Components within the page:

**Summary Stats Cards**
- Total Onboarding (count of non-live orgs)
- Approaching Go-Live (within 7 days - amber)
- Overdue Go-Lives (past date, not live - red alert)
- Average Days to Go-Live

**Go-Live Timeline**
- Chronological list of upcoming go-live dates
- Click to navigate to account detail
- Visual indicators:
  - **Green**: Today (go-live day!)
  - **Amber**: Within 7 days
  - **Red**: Overdue

**Stage Breakdown**
- Horizontal progress bars showing count per stage
- Click to filter the organization list below

**Organization Cards** (grouped by stage)
- Collapsible sections for each stage (New, Importing, Training)
- Each card shows:
  - Organization name with account number
  - Go-live date with status badge
  - Primary contact info
  - Source software (what they're migrating from)
  - Quick action buttons: Import Data, Edit, View Dashboard

#### 3. Update Sidebar Navigation

Add "Onboarding" link in `PlatformSidebar.tsx`:

```typescript
{ 
  href: '/dashboard/platform/onboarding', 
  label: 'Onboarding', 
  icon: Rocket, // or ClipboardList
  platformRoles: ['platform_owner', 'platform_admin', 'platform_support'] 
}
```

Position: Between "Accounts" and "Migrations" for logical flow.

#### 4. Add Route in App.tsx

```typescript
<Route path="onboarding" element={<PlatformOnboarding />} />
```

---

### Visual Design Details

**Color Coding for Go-Live Status:**
- **Emerald**: Already live (completed)
- **Violet**: No go-live date set
- **Slate**: More than 7 days away
- **Amber**: Within 7 days (approaching)
- **Red**: Past go-live date but not yet live (overdue)

**Stage Progress Visualization:**
Each stage card will show a visual progress indicator:

```text
New → Importing → Training → Live
 ●        ●          ○         ○   (current: Importing)
```

**Overdue Alert Banner:**
When any organization is overdue, show a prominent alert:

```text
+------------------------------------------------------------------+
| ⚠️  2 accounts are past their scheduled go-live date             |
|     [View Overdue Accounts]                                       |
+------------------------------------------------------------------+
```

---

### Technical Notes

1. **Performance**: The hook will use `useQuery` with appropriate caching (30s refetch interval to match Overview page)

2. **Filtering**: Support URL query params for pre-filtering (e.g., `?stage=importing` or `?status=overdue`)

3. **Reuse**: Leverages existing platform UI components:
   - `PlatformPageContainer`, `PlatformPageHeader`
   - `PlatformCard`, `PlatformBadge`, `PlatformButton`
   - `StatCard` pattern from Overview page

4. **Data Consistency**: Uses the same `Organization` type and queries from `useOrganizations.ts`

5. **Real-time Updates**: Hook uses 30-second refetch interval to show near-real-time status

---

### Files to Create/Modify

| File | Change |
|------|--------|
| `src/hooks/useOnboardingOrganizations.ts` | **New** - Data hook for onboarding orgs |
| `src/pages/dashboard/platform/Onboarding.tsx` | **New** - Main dashboard page |
| `src/components/platform/layout/PlatformSidebar.tsx` | **Edit** - Add nav link |
| `src/App.tsx` | **Edit** - Add route and import |

