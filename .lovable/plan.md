
# Add Business Type, Plan & Location Count to Organization Cards

## Summary

Enhance the Platform Accounts table to display three key pieces of information for each organization:
1. **Business Type** - Salon, Spa, Esthetics, etc.
2. **Subscription Plan** - Starter, Standard, Professional, Enterprise
3. **Active Locations** - Count of locations for multi-location businesses

---

## Current State Analysis

| Data | Status | Location |
|------|--------|----------|
| Business Type | Missing | Needs new `business_type` column |
| Subscription Plan | Exists but not shown | `subscription_tier` column already in DB |
| Location Count | Calculated only for detail page | `useOrganizationWithStats` hook |

---

## Implementation Plan

### Phase 1: Database Migration

Add a `business_type` column to the `organizations` table with predefined options:

```sql
ALTER TABLE public.organizations 
ADD COLUMN business_type TEXT DEFAULT 'salon' 
CHECK (business_type IN ('salon', 'spa', 'esthetics', 'barbershop', 'med_spa', 'wellness', 'other'));
```

| Value | Display Label |
|-------|---------------|
| `salon` | Salon |
| `spa` | Spa |
| `esthetics` | Esthetics |
| `barbershop` | Barbershop |
| `med_spa` | Med Spa |
| `wellness` | Wellness |
| `other` | Other |

### Phase 2: Update Type Definitions

**File**: `src/hooks/useOrganizations.ts`

Add `business_type` to the `Organization` interface:

```typescript
export interface Organization {
  // ... existing fields
  business_type: 'salon' | 'spa' | 'esthetics' | 'barbershop' | 'med_spa' | 'wellness' | 'other';
}
```

Add to `OrganizationInsert`:

```typescript
business_type?: 'salon' | 'spa' | 'esthetics' | 'barbershop' | 'med_spa' | 'wellness' | 'other';
```

### Phase 3: Create Organizations With Stats Hook

Create a new hook `useOrganizationsWithStats` that fetches all organizations with their location counts in a single efficient query:

```typescript
export interface OrganizationListItem extends Organization {
  locationCount: number;
}

export function useOrganizationsWithStats() {
  return useQuery({
    queryKey: ['organizations-with-stats'],
    queryFn: async () => {
      // Fetch organizations
      const { data: orgs, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch location counts for all orgs
      const { data: locationCounts } = await supabase
        .from('locations')
        .select('organization_id')
        .eq('is_active', true);
      
      // Aggregate counts per org
      const countMap = new Map<string, number>();
      locationCounts?.forEach(loc => {
        const orgId = loc.organization_id;
        if (orgId) countMap.set(orgId, (countMap.get(orgId) || 0) + 1);
      });
      
      return orgs.map(org => ({
        ...org,
        locationCount: countMap.get(org.id) || 0
      }));
    },
  });
}
```

### Phase 4: Update Accounts Table

**File**: `src/pages/dashboard/platform/Accounts.tsx`

Update the table to display the three new columns:

| Current Columns | New Columns |
|-----------------|-------------|
| Salon (name + slug) | (unchanged) |
| Status | Type (business_type) |
| Stage | Plan (subscription_tier) |
| Source | Locations (count badge) |
| Created | (unchanged) |
| Actions | (unchanged) |

**Visual Design:**

```text
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ Salon               │ Type    │ Status  │ Plan         │ Locations │ Created        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ [logo] Drop Dead    │ Salon   │ active  │ Professional │ 3 📍      │ 10 hours ago   │
│        drop-dead... │         │         │              │           │                │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

**Type Display**: Show as simple text with optional icon hint

**Plan Display**: Use a subtle badge or text with plan tier

**Locations Display**: Show count with `MapPin` icon, styled as pill/badge

### Phase 5: Update Create Organization Dialog

**File**: `src/components/platform/CreateOrganizationDialog.tsx`

Add a Business Type selector to the form:

```tsx
<FormField
  control={form.control}
  name="business_type"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Business Type</FormLabel>
      <Select onValueChange={field.onChange} value={field.value}>
        <SelectTrigger>
          <SelectValue placeholder="Select business type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="salon">Salon</SelectItem>
          <SelectItem value="spa">Spa</SelectItem>
          <SelectItem value="esthetics">Esthetics</SelectItem>
          <SelectItem value="barbershop">Barbershop</SelectItem>
          <SelectItem value="med_spa">Med Spa</SelectItem>
          <SelectItem value="wellness">Wellness</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>
    </FormItem>
  )}
/>
```

### Phase 6: Update Account Detail Page

Ensure the AccountDetail page also displays business type in the organization info card.

---

## Files to Modify

| File | Changes |
|------|---------|
| **Migration** | Add `business_type` column to organizations |
| `src/hooks/useOrganizations.ts` | Add `business_type` to types, create `useOrganizationsWithStats` hook |
| `src/pages/dashboard/platform/Accounts.tsx` | Update table with Type, Plan, Locations columns |
| `src/components/platform/CreateOrganizationDialog.tsx` | Add Business Type field |
| `src/pages/dashboard/platform/AccountDetail.tsx` | Display business type |

---

## Technical Details

### Table Column Layout Update

Replace the current columns with:

```tsx
<TableHeader>
  <TableRow>
    <TableHead>Salon</TableHead>
    <TableHead>Type</TableHead>
    <TableHead>Status</TableHead>
    <TableHead>Plan</TableHead>
    <TableHead>Locations</TableHead>
    <TableHead>Created</TableHead>
    <TableHead className="text-right">Actions</TableHead>
  </TableRow>
</TableHeader>
```

### Business Type Labels Mapping

```typescript
const businessTypeLabels: Record<string, string> = {
  salon: 'Salon',
  spa: 'Spa',
  esthetics: 'Esthetics',
  barbershop: 'Barbershop',
  med_spa: 'Med Spa',
  wellness: 'Wellness',
  other: 'Other',
};
```

### Plan Tier Labels Mapping

```typescript
const planLabels: Record<string, string> = {
  starter: 'Starter',
  standard: 'Standard',
  professional: 'Professional',
  enterprise: 'Enterprise',
};
```

### Location Count Cell

```tsx
<TableCell>
  <div className="flex items-center gap-1.5">
    <MapPin className="h-3.5 w-3.5 text-slate-500" />
    <span className="text-sm text-slate-300">{org.locationCount}</span>
  </div>
</TableCell>
```

---

## Filter Updates (Optional Enhancement)

Consider adding a filter dropdown for business type alongside the existing status filter:

```tsx
<Select value={typeFilter} onValueChange={setTypeFilter}>
  <SelectTrigger className="w-[150px]">
    <SelectValue placeholder="All Types" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All Types</SelectItem>
    <SelectItem value="salon">Salon</SelectItem>
    <SelectItem value="spa">Spa</SelectItem>
    {/* ... */}
  </SelectContent>
</Select>
```
