

## Level-Based Commission Rates + Per-Stylist Overrides

### What This Solves

Right now, commission rates are set as flat revenue bands (e.g., "$0-$5K = 35%, $5K-$10K = 40%") -- which is a good default structure, but doesn't account for the fact that different **stylist levels** should earn different commission percentages. A New Talent stylist shouldn't earn the same commission rate as a Signature Artist.

This feature adds two things:
1. **Default commission rates per stylist level** -- so each level (New Talent through Icon Artist) has a service commission % and retail commission % baked in
2. **Per-stylist overrides** -- for special circumstances where an individual stylist needs a different rate than their level dictates (e.g., a negotiated contract, a probationary rate, or a bonus structure)

### How It Works

Each stylist level gets two new fields:
- **Service Commission %** -- the default rate that level earns on services
- **Retail Commission %** -- the default rate that level earns on product sales

When calculating payroll commission, the resolution order becomes:
1. Per-stylist override (if one exists) -- highest priority
2. Stylist level default rate -- based on the stylist's assigned level
3. Org-wide commission tiers (existing revenue-band system) -- fallback

Per-stylist overrides are stored with a **reason** field (e.g., "Negotiated contract", "90-day probation rate") and an optional **expiry date** so temporary overrides auto-expire.

### What the UI Looks Like

**Stylist Levels Editor** (existing card in Settings) gets enhanced:
- Each level row now shows two inline commission rate fields (Service % and Retail %)
- When editing a level, the commission rates are editable alongside the name and description
- A small info notice explains "These rates apply to all stylists at this level unless individually overridden"

**Per-Stylist Commission Overrides** (new section in the Stylist Levels card or as a companion card):
- A list of stylists who have active overrides
- Each override shows: stylist name, their level's default rate, their override rate, reason, and expiry
- An "Add Override" button that lets you pick a stylist, set custom service % and retail %, enter a reason, and optionally set an expiry date
- Expired overrides are visually dimmed and can be cleared

### Database Changes

**1. Add commission columns to `stylist_levels`:**
- `service_commission_rate NUMERIC NULL` -- default service commission as a decimal (e.g., 0.35 for 35%)
- `retail_commission_rate NUMERIC NULL` -- default retail commission as a decimal

**2. Create `stylist_commission_overrides` table:**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| organization_id | UUID FK | Scoped to org |
| user_id | UUID | The stylist being overridden |
| service_commission_rate | NUMERIC NULL | Custom service rate |
| retail_commission_rate | NUMERIC NULL | Custom retail rate |
| reason | TEXT | Why this override exists |
| expires_at | TIMESTAMPTZ NULL | Optional auto-expiry |
| is_active | BOOLEAN DEFAULT true | Soft deactivation |
| created_by | UUID | Who set it |
| created_at / updated_at | TIMESTAMPTZ | Standard timestamps |

- Unique constraint on (organization_id, user_id) so each stylist has at most one active override
- RLS: org members can view, org admins can create/update/delete

### Technical Plan

**Migration:**
- Add `service_commission_rate` and `retail_commission_rate` to `stylist_levels`
- Create `stylist_commission_overrides` table with RLS policies, indexes, and updated_at trigger

**File: `src/hooks/useStylistLevels.ts`**
- Add `service_commission_rate` and `retail_commission_rate` to the `StylistLevel` interface
- Include them in `useSaveStylistLevels` mutation payloads

**File: `src/hooks/useStylistCommissionOverrides.ts` (new)**
- `useStylistCommissionOverrides(orgId)` -- fetch all active overrides (with optional `expires_at` filtering)
- `useUpsertCommissionOverride` -- create or update an override
- `useDeleteCommissionOverride` -- remove an override
- `resolveCommissionRate(userId, type: 'service' | 'retail')` -- utility that checks override first, then level default

**File: `src/components/dashboard/settings/StylistLevelsContent.tsx`**
- Add inline Service % and Retail % inputs per level row (visible in both view and edit modes)
- Include the rates in the save payload
- Add a "Commission Overrides" section below the levels list showing active overrides with add/edit/remove

**File: `src/components/dashboard/settings/CommissionOverrideDialog.tsx` (new)**
- Dialog for adding/editing a per-stylist commission override
- Stylist picker, service rate input, retail rate input, reason text field, optional expiry date picker

### Relationship to Existing Commission Systems

| System | Purpose | Still Used? |
|--------|---------|-------------|
| `commission_tiers` (revenue bands) | Org-wide fallback for service commissions based on revenue thresholds | Yes -- fallback when no level rate or override exists |
| `retail_commission_config` | Org-wide retail commission (flat or tiered) | Yes -- fallback for retail when no level rate or override exists |
| **Stylist Level rates** (new) | Default rates per experience tier | New -- primary source |
| **Per-stylist overrides** (new) | Individual exceptions | New -- highest priority |

### Files Changed

| File | Change |
|------|--------|
| Migration | Add columns to `stylist_levels`, create `stylist_commission_overrides` table |
| `src/hooks/useStylistLevels.ts` | Add commission rate fields to interface and mutations |
| `src/hooks/useStylistCommissionOverrides.ts` | New hook for override CRUD and rate resolution |
| `src/components/dashboard/settings/StylistLevelsContent.tsx` | Add commission rate inputs per level + override management section |
| `src/components/dashboard/settings/CommissionOverrideDialog.tsx` | New dialog for per-stylist override editing |

