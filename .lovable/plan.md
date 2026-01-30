
# Add Organization & Payment Indicators to Platform Accounts

## Summary

Enhance the Platform Accounts view with additional business intelligence:
1. **Account Number** - Auto-generated unique identifier starting at 1000
2. **Business Location** - State/Province and Country for each location
3. **Stripe Payment Status** - Track which locations are connected to Stripe and their processing status

---

## Database Changes

### 1. Organizations Table - Add Account Number

Add an auto-incrementing `account_number` column that starts at 1000:

```sql
-- Create a sequence starting at 1000
CREATE SEQUENCE IF NOT EXISTS organization_account_number_seq START WITH 1000;

-- Add account_number column with auto-generated default
ALTER TABLE public.organizations 
ADD COLUMN account_number INTEGER UNIQUE DEFAULT nextval('organization_account_number_seq');

-- Backfill existing organizations
UPDATE public.organizations 
SET account_number = nextval('organization_account_number_seq')
WHERE account_number IS NULL;
```

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `account_number` | INTEGER | nextval sequence | Unique ID starting at 1000 |

### 2. Locations Table - Add Geography Fields

Add state/province and country for each location:

```sql
ALTER TABLE public.locations
ADD COLUMN state_province TEXT,
ADD COLUMN country TEXT DEFAULT 'US';
```

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `state_province` | TEXT | null | State or province code (e.g., "TX", "ON") |
| `country` | TEXT | 'US' | Country code (e.g., "US", "CA") |

### 3. Locations Table - Add Stripe Payment Fields

Track Stripe integration status per location:

```sql
ALTER TABLE public.locations
ADD COLUMN stripe_account_id TEXT,
ADD COLUMN stripe_payments_enabled BOOLEAN DEFAULT false,
ADD COLUMN stripe_status TEXT DEFAULT 'not_connected' 
  CHECK (stripe_status IN ('not_connected', 'pending', 'active', 'issues', 'suspended'));
```

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `stripe_account_id` | TEXT | null | Stripe Connect account ID |
| `stripe_payments_enabled` | BOOLEAN | false | Whether payments are actively processing |
| `stripe_status` | TEXT | 'not_connected' | Current status of Stripe integration |

### Stripe Status Values

| Status | Icon | Color | Description |
|--------|------|-------|-------------|
| `not_connected` | Circle | Gray | No Stripe account linked |
| `pending` | Clock | Yellow | Account created, awaiting verification |
| `active` | Check | Green | Payments processing normally |
| `issues` | Alert | Orange | Requires attention (failed payouts, etc.) |
| `suspended` | X | Red | Account suspended |

---

## Type Updates

### Update Organization Interface

File: `src/hooks/useOrganizations.ts`

```typescript
export interface Organization {
  // ... existing fields
  account_number: number | null;
}
```

### Update Location Types

File: `src/hooks/useLocations.ts` (or create if needed)

```typescript
export interface Location {
  // ... existing fields
  state_province: string | null;
  country: string | null;
  stripe_account_id: string | null;
  stripe_payments_enabled: boolean;
  stripe_status: 'not_connected' | 'pending' | 'active' | 'issues' | 'suspended';
}
```

---

## Hook Enhancements

### Update useOrganizationsWithStats

Enhance the hook to fetch aggregated Stripe status per organization:

```typescript
export interface OrganizationListItem extends Organization {
  locationCount: number;
  // New fields
  stripeLocationsActive: number;    // Locations with active Stripe
  stripeLocationsTotal: number;     // Total locations with Stripe enabled
  hasStripeIssues: boolean;         // Any location with issues
  primaryLocation: {                // First active location's geography
    state_province: string | null;
    country: string | null;
  } | null;
}
```

The hook will aggregate:
- Count of locations with `stripe_status = 'active'`
- Count of locations with `stripe_payments_enabled = true`
- Boolean flag if any location has `stripe_status = 'issues'`
- Primary location's state/country for display

---

## UI Updates

### Accounts Table - New Columns

Replace current table layout with:

| Column | Data | Display |
|--------|------|---------|
| **Account** | `account_number` | `#1000` format with org name/logo |
| **Type** | `business_type` | Label text |
| **Location** | Primary location | State/Country (e.g., "TX, US") |
| **Status** | `status` | Badge |
| **Plan** | `subscription_tier` | Label text |
| **Locations** | Count | Number with MapPin icon |
| **Payments** | Stripe status | Status indicator |
| **Actions** | Menu | Dropdown |

### Stripe Payment Status Indicator

Visual indicator showing aggregated payment status:

```text
┌─────────────────────────────────┐
│  ● Active (2/3)                 │  All locations active
│  ◐ Partial (1/3)                │  Some locations active
│  ⚠ Issues                       │  One or more has issues
│  ○ Not Connected                │  No Stripe setup
└─────────────────────────────────┘
```

Component design:
- Green dot + "2/3" = 2 of 3 locations have active Stripe
- Orange warning icon if any location has issues
- Gray if no Stripe connected

---

## Files to Modify

| File | Changes |
|------|---------|
| **Migration** | Add `account_number` to organizations, add `state_province`, `country`, `stripe_account_id`, `stripe_payments_enabled`, `stripe_status` to locations |
| `src/hooks/useOrganizations.ts` | Update types, enhance `useOrganizationsWithStats` to include Stripe aggregates and primary location |
| `src/pages/dashboard/platform/Accounts.tsx` | Update table columns: Account #, Location, Payments indicator |
| `src/components/platform/CreateOrganizationDialog.tsx` | Optionally add primary state/country fields |
| `src/pages/dashboard/platform/AccountDetail.tsx` | Display account number, Stripe status per location |

---

## Table Column Layout

### Updated Table Headers

```tsx
<TableHeader>
  <TableRow>
    <TableHead>Account</TableHead>        {/* Account # + Name */}
    <TableHead>Type</TableHead>
    <TableHead>Location</TableHead>       {/* NEW: State, Country */}
    <TableHead>Status</TableHead>
    <TableHead>Plan</TableHead>
    <TableHead>Locations</TableHead>
    <TableHead>Payments</TableHead>       {/* NEW: Stripe status */}
    <TableHead className="text-right">Actions</TableHead>
  </TableRow>
</TableHeader>
```

### Account Cell Display

```tsx
<TableCell>
  <div className="flex items-center gap-3">
    <div className="h-10 w-10 rounded-xl bg-violet-500/10 ...">
      {/* Logo or Building2 icon */}
    </div>
    <div>
      <p className="font-medium text-white">{org.name}</p>
      <p className="text-xs text-slate-500">#{org.account_number}</p>
    </div>
  </div>
</TableCell>
```

### Location Cell Display

```tsx
<TableCell>
  {org.primaryLocation ? (
    <span className="text-sm text-slate-300">
      {org.primaryLocation.state_province}, {org.primaryLocation.country}
    </span>
  ) : (
    <span className="text-sm text-slate-500">—</span>
  )}
</TableCell>
```

### Payments Status Cell

```tsx
<TableCell>
  <StripeStatusIndicator 
    activeCount={org.stripeLocationsActive}
    totalCount={org.locationCount}
    hasIssues={org.hasStripeIssues}
  />
</TableCell>
```

The indicator component will show:
- Green dot with "X/Y" if any active
- Orange warning icon if issues
- Gray "Not Connected" if none

---

## Visual Design Reference

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Account             │ Type   │ Location │ Status │ Plan    │ Locations │ Payments  │ Actions  │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [logo] Drop Dead    │ Salon  │ TX, US   │ active │ Standard│ 📍 2      │ ● 2/2     │ ⋯        │
│        #1000        │        │          │        │         │           │           │          │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [logo] Luxe Spa     │ Spa    │ CA, US   │ pending│ Starter │ 📍 1      │ ⚠ Issues  │ ⋯        │
│        #1001        │        │          │        │         │           │           │          │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [logo] New Salon    │ Salon  │ ON, CA   │ pending│ Standard│ 📍 3      │ ○ Not Set │ ⋯        │
│        #1002        │        │          │        │         │           │           │          │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Order

1. Run database migration (add all new columns)
2. Update TypeScript types in hooks
3. Enhance `useOrganizationsWithStats` hook with new aggregations
4. Create `StripeStatusIndicator` component
5. Update Accounts table with new columns
6. Update AccountDetail page to show per-location Stripe status
