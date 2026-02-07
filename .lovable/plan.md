
# Fix "Invite Staff" Button Not Working

## Root Cause Analysis

The "Invite Staff" button is disabled because the organization lacks a billing configuration. Here's the data flow:

1. **Organization "Drop Dead Salons"** has no `organization_billing` record
2. `useBusinessCapacity()` hook returns `canAddUser: false` when no plan is set
3. The `InviteStaffDialog` component disables the button when `!canInvite`

Current database state:
- Organization: Drop Dead Salons (7 active users)
- Billing record: None
- Plan: None
- Result: `capacity.users.total = 0`, `capacity.canAddUser = false`

---

## Solution Options

### Option A: Create Billing Record for Existing Organization (Recommended)
Create an `organization_billing` record with a plan that has sufficient user capacity.

**Database changes:**
```sql
INSERT INTO organization_billing (organization_id, plan_id, included_users, included_locations)
SELECT 
  'fa23cd95-decf-436a-adba-4561b0ecc14d',
  id,
  -1,  -- Unlimited users
  -1   -- Unlimited locations
FROM subscription_plans 
WHERE tier = 'enterprise'
LIMIT 1;
```

This sets the organization to the Enterprise plan with unlimited capacity.

### Option B: Fix the Capacity Logic to Handle Missing Billing
Modify `calculateCapacity()` to treat missing billing records as "unlimited" rather than "zero capacity" for development/demo purposes.

**File: `src/hooks/useOrganizationCapacity.ts`**

Change the fallback behavior when no plan exists to allow invitations by default.

---

## Recommended Approach

**Option A** is the cleanest solution because:
- It aligns with the expected production behavior (organizations should have billing)
- No code changes required
- Properly configures the demo/development environment

However, we should also consider **Option B** as a defensive measure so that new organizations without billing don't get locked out of inviting staff during onboarding.

---

## Implementation Plan

### Step 1: Database Migration
Create an `organization_billing` record for the existing organization with the Enterprise plan (unlimited users/locations).

### Step 2: Code Enhancement (Optional but Recommended)
Update the capacity logic to provide a graceful fallback when billing is not configured:

**File: `src/hooks/useOrganizationCapacity.ts`**

In the `calculateCapacity` function, when no plan exists, return `isUnlimited: true` instead of `total: 0`:

```typescript
// Default empty state - allow unlimited when no billing configured
if (!plan) {
  return {
    locations: {
      // ... existing fields
      remaining: -1,
      isUnlimited: true,  // Changed from false
    },
    users: {
      // ... existing fields  
      remaining: -1,
      isUnlimited: true,  // Changed from false
    },
    // ...
  };
}
```

---

## Summary of Changes

| Type | Location | Change |
|------|----------|--------|
| Database | `organization_billing` table | Insert billing record for Drop Dead Salons with Enterprise plan |
| Code (optional) | `src/hooks/useOrganizationCapacity.ts` | Make fallback behavior allow invitations when no billing is configured |

---

## Result

After implementing these changes:
- The "Invite Staff" button will be enabled
- Capacity will show as unlimited (or based on the Enterprise plan)
- Future organizations will have a graceful fallback if billing isn't configured immediately
