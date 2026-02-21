

## Clean Up Commissions Tab: Unified Commission Intelligence

### The Redundancy Problem

Right now there are two disconnected views of commission data:

| Location | What it shows | Problem |
|----------|--------------|---------|
| Payroll Hub > Commissions tab | Summary cards ($0), empty Tier Distribution, Commission Tiers CRUD table | The "Tier Distribution" card is nearly always empty because the resolution engine prioritizes levels and overrides over revenue-band tiers. The Tiers editor is a configuration tool living on an operational/analytics page. |
| Settings > Stylist Levels | Experience level definitions, Team Commission Roster with drilldown | This is the actual source of truth for most stylist rates, but it's buried in settings. |

The commission resolution hierarchy is **Override > Level > Tier fallback**, so the Tiers editor is only relevant for stylists with no level assigned and no override. Yet it dominates the Commissions tab.

### Proposed Architecture

**Principle**: The Commissions tab should be an **operational intelligence view** (how is commission playing out this period?). Configuration belongs in Settings.

**1. Move the Commission Tiers Editor to Settings**

Relocate `CommissionTiersEditor` from the Commissions tab into the Stylist Levels settings page, positioned below the Team Commission Roster. This groups all three commission configuration layers (levels, overrides, and tier fallbacks) in one place.

The Tiers card gets a subtitle update: "Fallback revenue brackets -- applied when a stylist has no level or override assigned."

**2. Replace the Commissions Tab with a Unified Commission Intelligence View**

Rebuild the Commissions tab content to show the full resolved picture:

```text
COMMISSION INTELLIGENCE
How your team's commissions are resolving this period.

[Current Period Commissions: $X]  [Avg Effective Rate: X%]  [Overrides Active: X]

TEAM COMMISSION BREAKDOWN
Stylist        Level              Svc %   Retail %   Source          Est. Commission
Kristi D.      Level 3 - Core     45%     12%        Override        $2,340
Jordan T.      Level 2 - Rising   40%     10%        Level Default   $1,800
New Stylist    Unassigned          35%      0%        Tier Fallback   $420
                                                                     --------
                                                     Total:          $4,560

[Click any row -> navigates to Settings > Stylist Levels drilldown]
```

This replaces the three summary cards (Current Period, Potential Additional, Near Next Tier) with updated ones that reflect the full resolution engine, not just the tier system. It replaces the empty Tier Distribution card with an actual team breakdown table showing resolved rates and sources.

**3. Cross-link between Commissions Tab and Settings**

- Commissions tab header gets a "Configure Rates" button that links to Settings > Stylist Levels
- Each row in the Commissions breakdown is clickable and navigates to the Settings page with the stylist drilldown open
- The Settings page Team Commission Roster gets a "View Commission Analytics" link back to the Commissions tab

### Technical Plan

**File: `src/components/dashboard/payroll/CommissionIntelligence.tsx` (new)**
- Replaces both `CommissionInsights` and `CommissionTiersEditor` on the Commissions tab
- Fetches team directory, resolved commissions (via `useResolveCommission`), stylist levels, and overrides
- Three summary cards at top:
  - Current Period Commissions (sum of all resolved commissions)
  - Average Effective Service Rate (weighted average across team)
  - Active Overrides count (with expiry warnings)
- Team breakdown table with columns: Stylist, Level, Svc %, Retail %, Source, Est. Commission
- Each row clickable, navigates to `/dashboard/admin/settings?category=levels` (could deep-link to drilldown in future)
- Header "Configure Rates" button links to Settings > Stylist Levels

**File: `src/pages/dashboard/admin/Payroll.tsx` (modified)**
- Replace `CommissionInsights` and `CommissionTiersEditor` imports with single `CommissionIntelligence`
- Commissions TabsContent renders just `<CommissionIntelligence />`

**File: `src/components/dashboard/settings/StylistLevelsContent.tsx` (modified)**
- Import and render `CommissionTiersEditor` below the `TeamCommissionRoster` card
- Add a small "View Commission Analytics" link/button in the TeamCommissionRoster header that navigates to `/dashboard/admin/payroll?tab=commissions`

**Files removed: None** (CommissionTiersEditor stays as a component, just moves location. CommissionInsights gets replaced by CommissionIntelligence.)

**File: `src/components/dashboard/payroll/CommissionInsights.tsx` (deleted)**
- Functionality absorbed into CommissionIntelligence

### Files Changed

| File | Change |
|------|--------|
| `src/components/dashboard/payroll/CommissionIntelligence.tsx` | New unified operational view for Commissions tab |
| `src/pages/dashboard/admin/Payroll.tsx` | Swap old components for `CommissionIntelligence` |
| `src/components/dashboard/settings/StylistLevelsContent.tsx` | Add `CommissionTiersEditor` below roster + cross-link |
| `src/components/dashboard/payroll/CommissionInsights.tsx` | Deleted (replaced) |

### Further Improvement Suggestions

| Enhancement | Description |
|-------------|-------------|
| **Period selector** | Let the Commissions tab filter by pay period (current, previous, custom range) to see historical commission breakdowns |
| **Commission forecast** | "If current pace continues, projected total commission this period is $X" using the existing payroll forecasting hook |
| **Source distribution chart** | Small donut showing what % of team uses Override vs Level Default vs Tier Fallback |
| **Deep-link drilldown** | Clicking a stylist row on the Commissions tab opens the Settings drilldown directly via URL param |
| **Export** | "Download CSV" for the commission breakdown table for payroll processing |
