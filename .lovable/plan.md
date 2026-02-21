

## Unify Commission Tiers into Stylist Levels

### Problem

Two separate systems define commission rates:

| System | Table | What it does |
|--------|-------|-------------|
| **Stylist Levels** | `stylist_levels` | Has `service_commission_rate` and `retail_commission_rate` columns — but all 7 levels currently have NULL rates |
| **Commission Tiers** | `commission_tiers` | Revenue-band brackets (Base 0-5k at 35%, Standard 5k-10k at 40%, etc.) with separate "applies_to" logic for services vs products |

These model the same thing. A stylist's level IS their commission tier. The revenue-band approach adds complexity without value — a Level 3 stylist earns Level 3 rates regardless of whether they did $4k or $8k in a period. The tier system only exists because the level rates were never populated.

### Solution

Make `stylist_levels` the single source of truth for commission rates. Remove the `commission_tiers` system entirely.

### What Changes

**1. Populate level commission rates**

Seed the 7 existing stylist levels with commission rates that align with the current tier structure:

| Level | Label | Service % | Retail % |
|-------|-------|-----------|----------|
| 1 | New Talent | 35% | 10% |
| 2 | Studio Artist | 38% | 10% |
| 3 | Core Artist | 40% | 10% |
| 4 | Lead Artist | 43% | 10% |
| 5 | Senior Artist | 45% | 10% |
| 6 | Signature Artist | 48% | 10% |
| 7 | Icon Artist | 50% | 10% |

These rates are editable from the existing Experience Levels editor in Settings, which already has commission rate input fields.

**2. Simplify the commission resolution engine**

The `useResolveCommission` hook currently resolves: Override > Level > Tier Fallback. After this change:

- **Override** (per-stylist exception) -- stays the same
- **Level** (from `stylist_levels`) -- becomes the primary source (rates are now populated)
- **Tier Fallback** -- removed entirely

For stylists with no level assigned and no override, the system returns 0% (with a clear "Unassigned" indicator prompting the admin to assign a level). This enforces the Zura non-negotiable: commission models must be defined before payouts.

**3. Remove Commission Tiers infrastructure**

- Delete `CommissionTiersEditor.tsx` component
- Delete `useCommissionTiers.ts` hook
- Remove the `CommissionTiersEditor` import from `StylistLevelsContent.tsx`
- Update `useResolveCommission.ts` to remove tier fallback logic
- Update `usePayrollAnalytics.ts` to remove tier references
- Update `useTierDistribution.ts` to work from levels instead of tiers
- Update `EarningsBreakdownCard.tsx` (My Pay) to use level-based resolution
- Update `PayrollSummaryReport.tsx` to use level-based resolution
- Update `CommissionIntelligence.tsx` to remove "Tier Fallback" as a source badge

**4. Update Commission Intelligence (Payroll tab)**

The "Source" column simplifies to just two values:
- **Level Default** — rate comes from assigned level
- **Override** — rate comes from individual exception

Stylists with no level show "Unassigned" with a warning indicator.

### Technical Plan

**Database: Seed level commission rates**
- UPDATE each `stylist_levels` row to set `service_commission_rate` and `retail_commission_rate`
- No schema changes needed — columns already exist

**`src/hooks/useResolveCommission.ts`**
- Remove `useCommissionTiers` import and tier fallback logic
- Resolution becomes: Override > Level > return zeros with empty source
- Remove `calculateCommission` from the return (no longer needed)

**`src/hooks/useCommissionTiers.ts`** -- DELETE
- All consumers will be updated to use level-based resolution

**`src/components/dashboard/sales/CommissionTiersEditor.tsx`** -- DELETE

**`src/hooks/useTierDistribution.ts`**
- Remove `useCommissionTiers` dependency
- Build distribution from stylist levels instead of revenue tiers

**`src/hooks/usePayrollAnalytics.ts`**
- Remove `useCommissionTiers` import, use `useStylistLevels` for rate lookups

**`src/components/dashboard/mypay/EarningsBreakdownCard.tsx`**
- Replace `useCommissionTiers` with level-based resolution from `useResolveCommission`

**`src/components/dashboard/reports/PayrollSummaryReport.tsx`**
- Replace `useCommissionTiers` with `useResolveCommission`

**`src/components/dashboard/settings/StylistLevelsContent.tsx`**
- Remove `CommissionTiersEditor` import and render

**`src/components/dashboard/payroll/CommissionIntelligence.tsx`**
- Remove "Tier Fallback" source badge
- Show warning for unassigned stylists

**`src/hooks/usePayrollForecasting.ts`**
- Check if it references commission tiers and update accordingly

### Files Changed

| File | Change |
|------|--------|
| `src/hooks/useResolveCommission.ts` | Remove tier fallback, simplify to Override > Level |
| `src/hooks/useCommissionTiers.ts` | Deleted |
| `src/components/dashboard/sales/CommissionTiersEditor.tsx` | Deleted |
| `src/hooks/useTierDistribution.ts` | Rebuild on levels instead of tiers |
| `src/hooks/usePayrollAnalytics.ts` | Remove tier dependency |
| `src/components/dashboard/mypay/EarningsBreakdownCard.tsx` | Use level-based resolution |
| `src/components/dashboard/reports/PayrollSummaryReport.tsx` | Use level-based resolution |
| `src/components/dashboard/settings/StylistLevelsContent.tsx` | Remove CommissionTiersEditor |
| `src/components/dashboard/payroll/CommissionIntelligence.tsx` | Remove tier fallback badge, add unassigned warning |
| `src/hooks/usePayrollForecasting.ts` | Update if tier-dependent |

### Enforcement

After this change, an admin **must** assign a stylist to a level before that stylist earns commission. This aligns with the Zura non-negotiable: "Commission models must be defined before payouts." The Team Commission Roster will surface unassigned stylists with a clear warning.

### Further Improvement Suggestions

| Enhancement | Description |
|-------------|-------------|
| **Level rate editor inline** | When editing a level in the Experience Levels card, show a live preview of how many stylists would be affected by a rate change |
| **Rate change impact simulation** | Before saving a level's new commission rate, show projected impact on this period's total commissions |
| **Unassigned enforcement** | Block payroll finalization if any active stylist has no level assigned |
| **Rate history** | Track when level rates change in `commission_rate_history` for audit trail |

