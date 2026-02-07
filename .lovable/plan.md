

# Add Internal Organization Flag for Platform-Owned Organizations

## Overview

Add an `is_internal` flag to the organizations table to mark platform-owned organizations (like Drop Dead Salons) that should never be billed. These organizations will display a visual indicator in the Platform Admin accounts list and bypass billing requirements.

---

## Changes

### 1. Database Migration

Add the `is_internal` boolean column to the `organizations` table and set Drop Dead Salons as internal.

```sql
-- Add is_internal flag to organizations table
ALTER TABLE public.organizations 
ADD COLUMN is_internal BOOLEAN NOT NULL DEFAULT false;

-- Mark Drop Dead Salons as internal (platform-owned)
UPDATE public.organizations 
SET is_internal = true 
WHERE id = 'fa23cd95-decf-436a-adba-4561b0ecc14d';

-- Add a comment for documentation
COMMENT ON COLUMN public.organizations.is_internal IS 
  'True for platform-owned organizations that should not be billed';
```

---

### 2. Update Type Definitions

**File: `src/hooks/useOrganizations.ts`**

Add `is_internal` to the `Organization` interface:

```typescript
export interface Organization {
  // ...existing fields
  is_internal?: boolean;
}
```

---

### 3. Update Accounts List UI

**File: `src/pages/dashboard/platform/Accounts.tsx`**

Add a visual indicator (badge) next to internal organizations in the table:

| Element | Change |
|---------|--------|
| Account Cell | Add "Internal" badge with special styling next to the org name |
| Filter | Add an "Internal" filter option to the status/type filters |

The badge will be styled distinctly (using the `primary` or `glow` variant) to stand out:

```tsx
<div>
  <div className="flex items-center gap-2">
    <p className="font-medium text-white">{org.name}</p>
    {org.is_internal && (
      <PlatformBadge variant="glow" size="sm">Internal</PlatformBadge>
    )}
  </div>
  <p className="text-xs text-slate-500">#{org.account_number}</p>
</div>
```

---

### 4. Update Capacity Logic

**File: `src/hooks/useOrganizationCapacity.ts`**

Optionally enhance the capacity logic to automatically treat internal organizations as having unlimited capacity, even without a billing record. This provides a more robust fallback:

```typescript
export function calculateCapacity(
  billing: OrganizationBilling | null,
  plan: SubscriptionPlan | null,
  usage: { locationCount: number; userCount: number },
  isInternal?: boolean  // New optional parameter
): OrganizationCapacity {
  // Internal organizations always get unlimited capacity
  if (isInternal || !plan) {
    return {
      locations: { base: -1, purchased: 0, total: -1, used: usage.locationCount, utilization: 0, remaining: -1, isUnlimited: true },
      users: { base: -1, purchased: 0, total: -1, used: usage.userCount, utilization: 0, remaining: -1, isUnlimited: true },
      isOverLimit: false,
      nearLimit: false,
      locationCostPerMonth: 0,
      userCostPerMonth: 0,
      totalAddOnCost: 0,
    };
  }
  // ...rest of logic
}
```

---

### 5. Update OrganizationListItem Type

**File: `src/hooks/useOrganizations.ts`**

Ensure the list query includes `is_internal`:

```typescript
export interface OrganizationListItem extends Organization {
  locationCount: number;
  stripeLocationsActive: number;
  hasStripeIssues: boolean;
  primaryLocation: { ... } | null;
  // is_internal is inherited from Organization
}
```

---

## File Summary

| File | Action |
|------|--------|
| Database migration | Add `is_internal` column, set Drop Dead Salons to `true` |
| `src/hooks/useOrganizations.ts` | Add `is_internal` to Organization interface |
| `src/pages/dashboard/platform/Accounts.tsx` | Add "Internal" badge in account table rows, add filter option |
| `src/hooks/useOrganizationCapacity.ts` | Handle `isInternal` flag for automatic unlimited capacity |
| `src/hooks/useBusinessCapacity.ts` | Pass organization's `is_internal` flag to capacity calculation |

---

## Visual Result

In the Platform Accounts list:

```text
┌─────────────────────────────────────────────────────────────┐
│ Account                      │ Type   │ Status │ Plan      │
├─────────────────────────────────────────────────────────────┤
│ Drop Dead Salons [Internal]  │ Salon  │ Active │ Enterprise│
│ #10001                       │        │        │           │
├─────────────────────────────────────────────────────────────┤
│ Some Other Salon             │ Salon  │ Active │ Standard  │
│ #10002                       │        │        │           │
└─────────────────────────────────────────────────────────────┘
```

The "Internal" badge will have a glowing violet style to clearly distinguish platform-owned organizations from customer accounts.

