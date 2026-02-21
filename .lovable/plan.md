

## Commission System: Gap Analysis and Enhancement Plan

### Critical Gap: Commission Resolution Engine is Disconnected

You built a 3-tier commission priority system (per-stylist override > level default > revenue-band fallback), but the **calculation engine that every analytics and payroll component uses still only reads revenue-band tiers**. The level rates and overrides exist in the database and settings UI -- they're just never consulted when actually computing commissions.

This means every commission number shown in the app today (Payroll Overview, Commission Summary Card, Staff Commission Table, Individual Staff Report, Tier Progression, My Pay portal) is **ignoring stylist levels and overrides entirely**.

---

### What Needs to Change

**1. Unified Commission Resolution Hook (new)**

Create a `useResolveCommission` hook that implements the 3-tier priority:

| Priority | Source | Lookup |
|----------|--------|--------|
| 1 (highest) | Per-stylist override | `stylist_commission_overrides` where `is_active = true` and not expired |
| 2 | Stylist level default | `stylist_levels.service_commission_rate` / `retail_commission_rate` via `employee_profiles.stylist_level` |
| 3 (fallback) | Revenue-band tiers | Existing `commission_tiers` table (current behavior) |

This hook will accept a `userId` and revenue amounts, then resolve the correct rate by checking each tier in order. It replaces direct calls to `useCommissionTiers.calculateCommission` throughout the app.

**2. Wire Resolution Into All Consumers**

Every component that currently calls `calculateCommission(serviceRevenue, productRevenue)` needs to switch to the new resolver that also takes `userId`:

- `usePayrollForecasting` -- payroll projections per employee
- `useIndividualStaffReport` -- staff detail page commissions
- `CommissionSummaryCard` -- analytics commission totals
- `StaffCommissionTable` -- per-stylist commission breakdown
- `CommissionCalculator` -- the inline calculator widget
- `useTierDistribution` -- tier progression and impact analysis
- `CommandCenterAnalytics` -- pinned commission cards

**3. Commission Source Indicator**

In analytics views, show which rate source is active for each stylist so operators can see at a glance who has overrides vs level defaults vs fallbacks:

- A small badge: "Override", "Level: Signature Artist", or "Tier: Gold"
- This makes the commission structure transparent and auditable

**4. Override Expiry Handling**

The overrides table has `expires_at` but the query in `useStylistCommissionOverrides` only filters by `is_active = true` -- it doesn't check expiration. Expired overrides will still be applied as if they're current.

**5. Commission Audit Trail (Enhancement)**

When commission rates change (level rate edited, override added/removed/expired), there's no historical record. For payroll disputes or retroactive analysis, add a `commission_rate_history` table that logs changes.

---

### Technical Plan

**New file: `src/hooks/useResolveCommission.ts`**
- Fetches all three data sources: overrides (for org), stylist levels, and revenue-band tiers
- Exports `resolveCommission(userId, serviceRevenue, productRevenue)` that returns `{ serviceRate, retailRate, serviceCommission, retailCommission, totalCommission, source: 'override' | 'level' | 'tier', sourceName: string }`
- Handles override expiry check (`expires_at` comparison)
- Needs `employee_profiles.stylist_level` to map user to their level's rates

**Modified: `src/hooks/usePayrollForecasting.ts`**
- Replace `useCommissionTiers` with `useResolveCommission`
- Change commission calculation block (lines 207-226) to call per-employee resolution instead of flat tier lookup
- Each `EmployeeProjection` gets a new `commissionSource` field

**Modified: `src/hooks/useIndividualStaffReport.ts`**
- Replace `calculateCommission(serviceRevenue, productRevenue)` at line 432 with resolved commission that accounts for the staff member's level and any override

**Modified: `src/hooks/useTierDistribution.ts`**
- Update to work with the new resolution model -- progression opportunities should be based on the stylist's actual active rate source, not just revenue-band tiers

**Modified: `src/components/dashboard/sales/CommissionSummaryCard.tsx`**
- Accept the new resolver interface instead of flat `calculateCommission`
- Show aggregate by source type (how much commission comes from overrides vs level rates vs tier fallback)

**Modified: `src/components/dashboard/sales/StaffCommissionTable.tsx`**
- Add a "Source" column showing where each stylist's rate comes from
- Use per-stylist resolution instead of flat calculation

**Modified: `src/components/dashboard/analytics/SalesTabContent.tsx`**
- Pass the new resolver to commission components

**Modified: `src/components/dashboard/CommandCenterAnalytics.tsx`**
- Pass the new resolver to pinned commission cards

**Modified: `src/hooks/useStylistCommissionOverrides.ts`**
- Add expiry filtering: `or('expires_at.is.null,expires_at.gt.${now}')`

**Database migration: `commission_rate_history` table**
- Columns: `id`, `organization_id`, `user_id` (nullable for level-wide changes), `change_type` ('override_added' | 'override_removed' | 'override_expired' | 'level_rate_changed'), `previous_service_rate`, `new_service_rate`, `previous_retail_rate`, `new_retail_rate`, `changed_by`, `created_at`
- RLS: org members can view, admins can insert

---

### Summary of Gaps Found

| Gap | Severity | Status |
|-----|----------|--------|
| Level-based rates never used in commission calculation | **Critical** | All commission numbers are wrong for orgs using level rates |
| Per-stylist overrides never consulted during calculation | **Critical** | Override data is stored but ignored |
| Override expiry not checked in query | **High** | Expired overrides still treated as active |
| No commission source transparency in analytics | **Medium** | Operators can't see which rate applies to whom |
| No audit trail for rate changes | **Medium** | No history for payroll disputes |
| `useTierDistribution` progression logic assumes revenue-band tiers only | **Medium** | Progression opportunities are misleading for level-based orgs |

### Files Changed

| File | Change |
|------|--------|
| `src/hooks/useResolveCommission.ts` | New unified commission resolution hook |
| `src/hooks/usePayrollForecasting.ts` | Use per-employee resolution |
| `src/hooks/useIndividualStaffReport.ts` | Use resolved commission |
| `src/hooks/useTierDistribution.ts` | Update progression for multi-source model |
| `src/hooks/useStylistCommissionOverrides.ts` | Add expiry filtering |
| `src/components/dashboard/sales/CommissionSummaryCard.tsx` | Source-aware display |
| `src/components/dashboard/sales/StaffCommissionTable.tsx` | Add source column |
| `src/components/dashboard/analytics/SalesTabContent.tsx` | Wire new resolver |
| `src/components/dashboard/CommandCenterAnalytics.tsx` | Wire new resolver |
| Migration | Create `commission_rate_history` table |

