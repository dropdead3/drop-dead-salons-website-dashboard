

## Add Integrations Status Card to Account Overview Tab

This plan adds a new "Business Integrations" card to the Account Detail Overview tab, allowing platform admins to quickly see which integrations a specific business has connected and running inside their dashboard.

---

### Overview

The Platform Admin's Account Detail page currently shows Contact Information and Account Details cards on the Overview tab. We'll add a third card that displays the real-time status of integrations configured by the business:

- Phorest (POS/booking system)
- Payroll (Gusto or QuickBooks)

This gives platform admins instant visibility into the business's integration health without having to impersonate or dig through settings.

---

### Visual Design

```text
OVERVIEW TAB LAYOUT:
+---------------------------+---------------------------+
|   CONTACT INFORMATION     |     ACCOUNT DETAILS       |
|   - Email                 |   - Account #             |
|   - Phone                 |   - Created Date          |
+---------------------------+---------------------------+
|         BUSINESS INTEGRATIONS                         |
+---------+--------------------------+------------------+
| [Icon]  | Phorest                  | ● Connected      |
|         | 2 branches, 8 staff      |                  |
+---------+--------------------------+------------------+
| [Icon]  | Payroll - QuickBooks     | ○ Not Connected  |
|         | --                       |                  |
+---------+--------------------------+------------------+
```

The card will:
- Follow the existing `PlatformCard variant="glass"` styling
- Show integration name, icon, and connection status badge
- Include quick stats (e.g., mapped branches, staff count for Phorest)
- Display "Not Connected" for integrations not yet set up

---

### Data Sources

For each organization, we'll query:

| Integration | Table | Connection Criteria |
|-------------|-------|---------------------|
| **Phorest** | `locations` + `phorest_staff_mapping` | Has locations with `phorest_branch_id` + active staff mappings |
| **Payroll** | `payroll_connections` | `connection_status = 'connected'` |

---

### Implementation

#### 1. New Hook: `useOrganizationIntegrations`
**File:** `src/hooks/useOrganizationIntegrations.ts`

A hook that fetches integration status for a specific organization ID:

```typescript
interface OrganizationIntegrationStatus {
  phorest: {
    connected: boolean;
    branchCount: number;
    staffMappingCount: number;
  };
  payroll: {
    connected: boolean;
    provider: 'gusto' | 'quickbooks' | null;
    connectedAt: string | null;
  };
}
```

The hook will:
- Accept an `organizationId` parameter (not rely on context)
- Query locations table for branches with `phorest_branch_id`
- Join to count active staff mappings per branch
- Query payroll_connections for this specific org
- Return structured status object

---

#### 2. New Component: `AccountIntegrationsCard`
**File:** `src/components/platform/account/AccountIntegrationsCard.tsx`

A card component that displays integration status:

Features:
- Uses the `PlatformCard variant="glass"` styling to match existing cards
- Displays each integration as a row with:
  - Icon (from lucide-react or platform integrations config)
  - Integration name
  - Status badge (Connected/Not Connected)
  - Quick stats or "--" if not connected
- Skeleton loading state
- Empty state message if no integrations are even partially configured

Layout:
```tsx
<PlatformCard variant="glass">
  <PlatformCardHeader>
    <PlatformCardTitle>Business Integrations</PlatformCardTitle>
  </PlatformCardHeader>
  <PlatformCardContent>
    {/* Phorest row */}
    <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-slate-700/50">
          <BookOpen className="h-4 w-4 text-violet-400" />
        </div>
        <div>
          <p className="font-medium text-white">Phorest</p>
          <p className="text-sm text-slate-400">
            {connected ? `${branchCount} branches, ${staffCount} staff` : '--'}
          </p>
        </div>
      </div>
      <PlatformBadge variant={connected ? 'success' : 'default'}>
        {connected ? 'Connected' : 'Not Connected'}
      </PlatformBadge>
    </div>
    {/* Payroll row */}
    ...
  </PlatformCardContent>
</PlatformCard>
```

---

#### 3. Update Account Detail Overview Tab
**File:** `src/pages/dashboard/platform/AccountDetail.tsx`

Add the new integrations card to the Overview tab content:

Current layout (lines 264-404):
```tsx
<TabsContent value="overview" className="space-y-4">
  <div className="grid gap-4 lg:grid-cols-2">
    {/* Contact Info Card */}
    {/* Account Details Card */}
  </div>
</TabsContent>
```

Updated layout:
```tsx
<TabsContent value="overview" className="space-y-4">
  <div className="grid gap-4 lg:grid-cols-2">
    {/* Contact Info Card */}
    {/* Account Details Card */}
  </div>
  {/* Full-width Integrations Card */}
  <AccountIntegrationsCard organizationId={organization.id} />
</TabsContent>
```

Alternatively, if we want it in the 2-column grid, we could place it below Contact Info and have it span one column.

---

### File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useOrganizationIntegrations.ts` | **Create** | Hook to fetch integration status for a specific org |
| `src/components/platform/account/AccountIntegrationsCard.tsx` | **Create** | Card component showing integration status |
| `src/pages/dashboard/platform/AccountDetail.tsx` | **Edit** | Add integrations card to Overview tab |

---

### Technical Notes

1. **Organization Context**: Unlike business dashboard hooks that use context, this hook accepts an `organizationId` prop since platform admins view different organizations without switching context.

2. **Query Optimization**: We'll batch the Phorest and Payroll queries using Promise.all for efficient loading.

3. **Skeleton States**: The card will show skeleton placeholders while loading to maintain UI consistency.

4. **Future Extensibility**: The hook and component are designed to easily add more integrations (PandaDoc, Stripe, Twilio) when they become available at the business level.

5. **Icon Choice**: 
   - Phorest: Calendar or BookOpen icon (represents booking system)
   - Payroll: DollarSign icon (matches existing platform integrations config)

---

### Sample Query Logic

```typescript
// Phorest: Check locations with branch IDs and count staff mappings
const { data: phorestData } = await supabase
  .from('locations')
  .select(`
    id,
    phorest_branch_id,
    phorest_staff_mapping!inner(id, is_active)
  `)
  .eq('organization_id', organizationId)
  .not('phorest_branch_id', 'is', null);

const branchCount = new Set(phorestData?.map(l => l.phorest_branch_id)).size;
const staffCount = phorestData?.flatMap(l => l.phorest_staff_mapping)
  .filter(m => m.is_active).length || 0;

// Payroll: Check connection status
const { data: payrollData } = await supabase
  .from('payroll_connections')
  .select('provider, connection_status, connected_at')
  .eq('organization_id', organizationId)
  .maybeSingle();
```

