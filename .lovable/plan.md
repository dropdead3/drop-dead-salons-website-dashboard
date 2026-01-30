
# Account Upgrade & Add-On Management System

## Summary

Build a system that allows organizations to upgrade their subscription plans and purchase additional capacity (locations, user seats) beyond what their base plan includes. This creates a flexible "add-on" model where accounts can stay on their current plan while paying for extra resources.

---

## Current State Analysis

**What We Have:**
- **subscription_plans** table with base limits: `max_locations` (1-5 or unlimited) and `max_users` (5-30 or unlimited)
- **organization_billing** table with `per_location_fee` for charging extra per additional location
- Dynamic user counts from `employee_profiles` table
- Dynamic location counts from `locations` table
- Billing tab in Account Detail page with plan selection and pricing

**What's Missing:**
- No per-user-seat fee tracking (only per-location exists)
- No tracking of "purchased" add-on seats vs "used" seats
- No upgrade history or change log
- No proration calculations for mid-cycle changes
- No UI to configure and visualize capacity usage vs limits

---

## Key Features to Implement

### 1. Add-On Capacity Tracking
Track purchased capacity separately from base plan limits:
- **Additional Locations**: Already have `per_location_fee` - extend to track included vs purchased
- **Additional User Seats**: New fee type for extra users beyond plan limit

### 2. Capacity Usage Visualization
Show organizations their current usage against their total capacity:
- Base plan limits + purchased add-ons = total allowed
- Current usage (locations, users) vs total allowed
- Visual progress bars with warning thresholds

### 3. Plan Upgrade Path
Enable seamless plan changes:
- Compare current plan vs target plan
- Calculate proration for mid-cycle upgrades
- Handle downgrades with capacity checks

### 4. Change History
Track all billing changes for audit:
- Plan upgrades/downgrades
- Add-on purchases
- Pricing changes

---

## Database Schema Changes

### Update `organization_billing` Table

Add new columns:

| Column | Type | Description |
|--------|------|-------------|
| per_user_fee | numeric | Monthly fee per additional user seat |
| additional_locations_purchased | int | Extra locations beyond plan limit |
| additional_users_purchased | int | Extra user seats beyond plan limit |
| included_locations | int | Override plan's included locations (null = use plan default) |
| included_users | int | Override plan's included users (null = use plan default) |

### New Table: `billing_changes`

Track all billing modifications for audit:

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| organization_id | uuid | FK to organizations |
| change_type | text | plan_upgrade, plan_downgrade, add_locations, add_users, pricing_change |
| previous_value | jsonb | Snapshot of old billing config |
| new_value | jsonb | Snapshot of new billing config |
| effective_date | date | When change takes effect |
| proration_amount | numeric | Credit/charge for mid-cycle change |
| notes | text | Admin notes about the change |
| created_by | uuid | Platform user who made change |
| created_at | timestamptz | |

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                    Billing Tab (Enhanced)                        │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Capacity Usage Card (NEW)                      │ │
│  │  ┌──────────────────┐  ┌──────────────────┐                │ │
│  │  │   Locations      │  │   User Seats     │                │ │
│  │  │   ████████░░ 8/10│  │   ██████░░░ 12/20│                │ │
│  │  │   Base: 5        │  │   Base: 15       │                │ │
│  │  │   Add-on: +5     │  │   Add-on: +5     │                │ │
│  │  └──────────────────┘  └──────────────────┘                │ │
│  │                   [+ Add More Capacity]                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Current Plan Card (Existing)                   │ │
│  │  Standard Plan - $199/mo                                    │ │
│  │  [Upgrade Plan]  [Change Billing Cycle]                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Add-Ons Card (NEW)                             │ │
│  │  Per-Location Fee: $25/mo × 3 additional = $75/mo          │ │
│  │  Per-User Fee: $10/mo × 5 additional = $50/mo              │ │
│  │  [Configure Add-Ons]                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Upgrade Dialog (NEW)                           │ │
│  │  Current: Standard ($199/mo, 2 locations, 15 users)        │ │
│  │  ↓                                                          │ │
│  │  Target: Professional ($349/mo, 5 locations, 30 users)     │ │
│  │  ────────────────────────────────────────                   │ │
│  │  Proration: $75 credit for remaining cycle                 │ │
│  │  Effective: Immediately / Next billing cycle               │ │
│  │                               [Cancel] [Confirm Upgrade]    │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## UI Components to Create

### 1. CapacityUsageCard
Visual display of current capacity usage:
- Progress bars for locations and users
- Breakdown of base + add-on capacity
- Warning states when approaching limits
- Quick action to add more capacity

### 2. AddOnsConfigForm
Configure per-unit pricing and purchased quantities:
- Per-location fee and count
- Per-user fee and count
- Real-time cost preview
- Included capacity overrides

### 3. PlanUpgradeDialog
Modal for upgrading/downgrading plans:
- Side-by-side plan comparison
- Feature differences highlighted
- Proration calculator
- Effective date selection

### 4. BillingHistoryCard
Timeline of billing changes:
- Plan changes
- Add-on modifications
- Payment history (future)

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/platform/billing/CapacityUsageCard.tsx` | Visual capacity usage display |
| `src/components/platform/billing/AddOnsConfigForm.tsx` | Add-on configuration form |
| `src/components/platform/billing/PlanUpgradeDialog.tsx` | Plan upgrade modal with proration |
| `src/components/platform/billing/BillingHistoryCard.tsx` | Change history timeline |
| `src/hooks/useOrganizationCapacity.ts` | Calculate capacity limits and usage |
| `src/hooks/useBillingHistory.ts` | CRUD for billing changes |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useOrganizationBilling.ts` | Add new fields for user fees and purchased add-ons |
| `src/hooks/useBillingCalculations.ts` | Include user seat fees in calculations |
| `src/components/platform/billing/BillingConfigurationPanel.tsx` | Add CapacityUsageCard, AddOnsConfigForm |
| `src/components/platform/billing/SetupFeesForm.tsx` | Rename/refactor to include user seat fees |
| `src/components/platform/billing/InvoicePreview.tsx` | Add user seat fee line items |
| Database migration | Add new columns and billing_changes table |

---

## Capacity Calculation Logic

```text
calculateCapacity(billing, plan, currentUsage):
  // Locations
  baseLocations = billing.included_locations ?? plan.max_locations
  purchasedLocations = billing.additional_locations_purchased ?? 0
  totalLocationCapacity = baseLocations + purchasedLocations
  usedLocations = currentUsage.locationCount
  locationUtilization = usedLocations / totalLocationCapacity

  // Users
  baseUsers = billing.included_users ?? plan.max_users
  purchasedUsers = billing.additional_users_purchased ?? 0
  totalUserCapacity = baseUsers + purchasedUsers
  usedUsers = currentUsage.userCount
  userUtilization = usedUsers / totalUserCapacity

  return {
    locations: { base, purchased, total, used, utilization },
    users: { base, purchased, total, used, utilization },
    isOverLimit: usedLocations > totalLocationCapacity || usedUsers > totalUserCapacity,
    nearLimit: locationUtilization > 0.8 || userUtilization > 0.8
  }
```

---

## Proration Logic

For mid-cycle plan changes:

```text
calculateProration(currentPlan, newPlan, daysRemaining, cycleLength):
  // Calculate daily rate for current plan
  currentDailyRate = currentPlan.monthlyAmount / 30
  
  // Credit for unused days on current plan
  unusedCredit = currentDailyRate * daysRemaining
  
  // Charge for new plan's remaining days
  newDailyRate = newPlan.monthlyAmount / 30
  newCharge = newDailyRate * daysRemaining
  
  // Net proration
  netAmount = newCharge - unusedCredit
  
  return {
    creditAmount: unusedCredit,
    newChargeAmount: newCharge,
    netProration: netAmount,
    daysRemaining,
    effectiveDate: now()
  }
```

---

## Security & RLS

- `billing_changes`: Platform users can view/insert all, org admins can view own
- All billing modifications logged with `created_by` user ID
- Capacity changes trigger audit log entries
- Only platform_owner and platform_admin can modify billing terms

---

## Implementation Phases

### Phase 1: Database & Core Logic
1. Add new columns to `organization_billing`
2. Create `billing_changes` table
3. Update `useOrganizationBilling` hook with new fields
4. Create `useOrganizationCapacity` hook
5. Create `useBillingHistory` hook

### Phase 2: Capacity Visualization
1. Build CapacityUsageCard component
2. Integrate into BillingConfigurationPanel
3. Add capacity data to Account Detail stats

### Phase 3: Add-On Management
1. Refactor SetupFeesForm into AddOnsConfigForm
2. Add per-user fee configuration
3. Update billing calculations for user fees
4. Update InvoicePreview with user fees

### Phase 4: Plan Upgrades
1. Build PlanUpgradeDialog with comparison view
2. Implement proration calculator
3. Add change history logging
4. Build BillingHistoryCard

---

## Visual States

### Capacity Bar Colors
- **Green** (0-60%): Healthy usage
- **Yellow** (60-80%): Approaching limit
- **Orange** (80-95%): Near capacity
- **Red** (95%+): At or over limit

### Upgrade Indicators
- Show "Upgrade Available" when usage exceeds 80% of base plan
- Highlight cost savings when add-ons exceed upgrade price
- "Recommended" badge on optimal plan based on usage
