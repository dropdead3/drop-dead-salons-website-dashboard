
## Add Integrations Status Card to Platform Overview

This plan adds a new card to the Platform Overview page showing a summary of integration status across all business accounts.

---

### Overview

The Platform Overview currently displays stats for accounts, locations, and migrations. We'll add a new "Integrations Health" card that shows:
- How many businesses have each integration connected
- Connection status summary (connected, issues, not configured)
- Quick link to the Integrations settings page

---

### Visual Design

```text
+-------------------------------------------------------+
| INTEGRATIONS HEALTH                        [See All →] |
+-------------------------------------------------------+
| [===] Phorest        1 connected     ● Healthy       |
| [💳] Payroll         0 connected     ○ Not configured |
| [📄] PandaDoc        5 documents     ● Active        |
+-------------------------------------------------------+
| Total: 1 of 3 integrations active                     |
+-------------------------------------------------------+
```

The card will follow the existing platform design system:
- Dark slate background with violet accents
- Consistent with `PlatformActivityFeed` and `PlatformLiveAnalytics` card styling
- Status indicators with color-coded badges

---

### Implementation

#### 1. New Hook: `usePlatformIntegrationStats`
**File:** `src/hooks/usePlatformIntegrationStats.ts`

A hook to aggregate integration status across all organizations:

```typescript
interface IntegrationStat {
  id: string;
  name: string;
  icon: LucideIcon;
  connectedOrgs: number;
  status: 'healthy' | 'issues' | 'not_configured';
  details?: string;
}

interface PlatformIntegrationStats {
  integrations: IntegrationStat[];
  totalActive: number;
  totalAvailable: number;
}
```

Data sources:
- **Phorest**: Count organizations with `source_software = 'phorest'` that have active staff mappings
- **Payroll**: Count `payroll_connections` where `connection_status = 'connected'`
- **PandaDoc**: Count total documents and check webhook activity

---

#### 2. New Component: `PlatformIntegrationsCard`
**File:** `src/components/platform/overview/PlatformIntegrationsCard.tsx`

A compact card showing integration health at a glance:

- Header with title and "See All" link to `/dashboard/platform/settings`
- List of integrations with:
  - Icon (from platform integrations config)
  - Name
  - Connected count or document count
  - Status badge (Healthy/Issues/Not configured)
- Footer showing summary (e.g., "2 of 3 integrations active")

Styling follows existing patterns:
- `rounded-2xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-xl p-6`
- Status badges use `PlatformBadge` component with appropriate variants
- Skeleton loading state matching other cards

---

#### 3. Update Platform Overview Layout
**File:** `src/pages/dashboard/platform/Overview.tsx`

Add the new integrations card alongside the Quick Actions card:

Current layout:
```text
[Live Analytics (2/3 width)] [Quick Actions (1/3 width)]
[Activity Feed (full width)]
```

New layout option A (add to existing row):
```text
[Live Analytics (2/3 width)] [Quick Actions (1/3 width)]
[Integrations Card (1/2)]    [Activity Feed (1/2)]
```

New layout option B (stack with Quick Actions):
```text
[Live Analytics (2/3 width)] [Quick Actions + Integrations stacked (1/3 width)]
[Activity Feed (full width)]
```

Recommended: Option B - Stack the Integrations card below Quick Actions in the right column, maintaining visual balance.

---

### File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/usePlatformIntegrationStats.ts` | **Create** | Hook to aggregate integration status across orgs |
| `src/components/platform/overview/PlatformIntegrationsCard.tsx` | **Create** | Compact integration health overview card |
| `src/pages/dashboard/platform/Overview.tsx` | **Edit** | Add integrations card to the layout |

---

### Technical Details

#### Data Queries

```typescript
// Phorest - check organizations with active staff mappings
const { count: phorestOrgs } = await supabase
  .from('phorest_staff_mapping')
  .select('phorest_branch_id', { count: 'exact', head: true })
  .eq('is_active', true);

// Payroll - count connected organizations
const { count: payrollOrgs } = await supabase
  .from('payroll_connections')
  .select('organization_id', { count: 'exact', head: true })
  .eq('connection_status', 'connected');

// PandaDoc - count documents and check recency
const { data: pandaDocs, count: pandaDocCount } = await supabase
  .from('pandadoc_documents')
  .select('id, created_at', { count: 'exact' })
  .order('created_at', { ascending: false })
  .limit(1);
```

#### Status Logic

| Integration | Healthy | Issues | Not Configured |
|-------------|---------|--------|----------------|
| Phorest | Has active mappings | Has mappings but inactive | No mappings |
| Payroll | `connection_status = 'connected'` | `connection_status = 'error'` | No connection record |
| PandaDoc | Documents exist + recent webhook | Documents exist but stale | No documents |

---

### Skeleton Loading

The component will include a proper skeleton state:

```tsx
<div className="space-y-3">
  {[...Array(3)].map((_, i) => (
    <div key={i} className="flex items-center gap-3">
      <Skeleton className="h-8 w-8 rounded-lg bg-slate-700/50" />
      <Skeleton className="h-4 flex-1 bg-slate-700/50" />
      <Skeleton className="h-5 w-16 rounded-full bg-slate-700/50" />
    </div>
  ))}
</div>
```

---

### Future Enhancements

This initial implementation covers the overview. Future work could include:
- Click-through to see which specific organizations have each integration
- Real-time status checking via edge function health checks
- Alert badges when integrations have errors
- Sync health indicators (last successful sync time)
