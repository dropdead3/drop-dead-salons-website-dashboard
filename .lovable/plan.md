
# Client Directory Feature Implementation

## Overview
Transform the "My Clients" page into a comprehensive "Client Directory" with dual-tab functionality:
- **All Clients**: Available to users with appropriate permissions (admin, manager, super_admin, receptionist)
- **My Clients**: Default view for stylists showing only their assigned clients

The navigation item will move from "Stats & Leaderboard" to directly under "Team Directory" in the Main section.

## Summary of Changes

### Navigation Updates
Move the link from the Stats section to the Main section, rename it to "Client Directory", and update permissions to be visible to more roles.

### Page Restructure
Add primary tabs to switch between "All Clients" and "My Clients" views, with the "All Clients" tab locked/disabled for users without permission.

### New Filter
Add a stylist filter dropdown (visible only in All Clients tab) to filter clients by their preferred stylist.

---

## Technical Details

### File 1: `src/components/dashboard/DashboardLayout.tsx`

**Move nav item from `statsNavItems` to `mainNavItems`**:

```typescript
// Before (lines 133-137)
const mainNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Command Center', icon: LayoutDashboard, permission: 'view_command_center' },
  { href: '/dashboard/schedule', label: 'Schedule', icon: CalendarDays, permission: 'view_booking_calendar' },
  { href: '/dashboard/directory', label: 'Team Directory', icon: Contact, permission: 'view_team_directory' },
];

// After
const mainNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Command Center', icon: LayoutDashboard, permission: 'view_command_center' },
  { href: '/dashboard/schedule', label: 'Schedule', icon: CalendarDays, permission: 'view_booking_calendar' },
  { href: '/dashboard/directory', label: 'Team Directory', icon: Contact, permission: 'view_team_directory' },
  { href: '/dashboard/clients', label: 'Client Directory', icon: Users, permission: 'view_clients' },
];
```

**Remove from `statsNavItems`**:
```typescript
// Before (lines 161-166)
const statsNavItems: NavItem[] = [
  { href: '/dashboard/stats', label: 'My Stats', icon: BarChart3, permission: 'view_own_stats' },
  { href: '/dashboard/my-clients', label: 'My Clients', icon: Users, permission: 'view_own_stats', roles: ['stylist', 'stylist_assistant'] },
  { href: '/dashboard/my-pay', label: 'My Pay', icon: Wallet, permission: 'view_my_pay' },
  { href: '/dashboard/admin/analytics', label: 'Analytics Hub', icon: TrendingUp, permission: 'view_team_overview' },
];

// After - Remove My Clients line
const statsNavItems: NavItem[] = [
  { href: '/dashboard/stats', label: 'My Stats', icon: BarChart3, permission: 'view_own_stats' },
  { href: '/dashboard/my-pay', label: 'My Pay', icon: Wallet, permission: 'view_my_pay' },
  { href: '/dashboard/admin/analytics', label: 'Analytics Hub', icon: TrendingUp, permission: 'view_team_overview' },
];
```

### File 2: `src/pages/dashboard/MyClients.tsx` (renamed to `ClientDirectory.tsx`)

**Key changes**:

1. **Rename file** to `ClientDirectory.tsx`

2. **Add primary tab state and logic**:
```typescript
const [primaryTab, setPrimaryTab] = useState<'all' | 'my'>(canViewAllClients ? 'all' : 'my');
const [selectedStylist, setSelectedStylist] = useState<string>('all');
```

3. **Fetch stylists for filter dropdown**:
```typescript
const { data: stylists } = useQuery({
  queryKey: ['employee-profiles-for-filter'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('employee_profiles')
      .select('user_id, full_name, display_name')
      .eq('is_active', true)
      .eq('is_approved', true)
      .order('full_name');
    if (error) throw error;
    return data || [];
  },
  enabled: canViewAllClients, // Only fetch if user can see all clients
});
```

4. **Update client query to respect primary tab**:
```typescript
const { data: clients, isLoading } = useQuery({
  queryKey: ['client-directory', user?.id, primaryTab, selectedStylist],
  queryFn: async () => {
    let query = supabase
      .from('phorest_clients')
      .select('*')
      .order('total_spend', { ascending: false });

    // Filter logic based on primary tab
    if (primaryTab === 'my' || !canViewAllClients) {
      // My Clients: only show user's clients
      query = query.eq('preferred_stylist_id', user?.id);
    } else if (selectedStylist !== 'all') {
      // All Clients with stylist filter
      query = query.eq('preferred_stylist_id', selectedStylist);
    }
    // If All Clients with no filter, no preferred_stylist_id constraint

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
  enabled: !!user?.id,
});
```

5. **Add primary tabs UI with lock icon**:
```typescript
<Tabs value={primaryTab} onValueChange={(v) => setPrimaryTab(v as 'all' | 'my')}>
  <TabsList>
    <TabsTrigger 
      value="all" 
      disabled={!canViewAllClients}
      className="gap-2"
    >
      {!canViewAllClients && <Lock className="w-3 h-3" />}
      All Clients
    </TabsTrigger>
    <TabsTrigger value="my">My Clients</TabsTrigger>
  </TabsList>
</Tabs>
```

6. **Add stylist filter dropdown** (only visible in All Clients tab):
```typescript
{primaryTab === 'all' && canViewAllClients && stylists && (
  <Select value={selectedStylist} onValueChange={setSelectedStylist}>
    <SelectTrigger className="w-full md:w-[200px]">
      <User className="w-4 h-4 mr-2 text-muted-foreground" />
      <SelectValue placeholder="All Stylists" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Stylists</SelectItem>
      {stylists.map(stylist => (
        <SelectItem key={stylist.user_id} value={stylist.user_id}>
          {stylist.display_name || stylist.full_name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)}
```

7. **Update page header**:
```typescript
<h1 className="font-display text-3xl lg:text-4xl mb-2">CLIENT DIRECTORY</h1>
<p className="text-muted-foreground font-sans">
  {primaryTab === 'all' 
    ? 'View and manage all salon clients.' 
    : 'Track your client relationships and identify opportunities.'}
</p>
```

### File 3: `src/App.tsx` (or routes configuration)

**Update route path**:
```typescript
// Change from
{ path: 'my-clients', element: <MyClients /> }
// To
{ path: 'clients', element: <ClientDirectory /> }
```

Also add a redirect from `/dashboard/my-clients` to `/dashboard/clients` for backwards compatibility.

---

## Permission Matrix

| Role | Sees Nav Link | All Clients Tab | My Clients Tab | Stylist Filter |
|------|--------------|-----------------|----------------|----------------|
| Super Admin | Yes | Unlocked | Yes | Yes |
| Admin | Yes | Unlocked | Yes | Yes |
| Manager | Yes | Unlocked | Yes | Yes |
| Receptionist | Yes | Unlocked | Yes | Yes |
| Stylist | Yes | Locked | Yes (default) | No |
| Stylist Assistant | Yes | Locked | Yes (default) | No |
| Booth Renter | Yes | Locked | Yes (default) | No |

## UI Layout

```text
+------------------------------------------------------------------+
| CLIENT DIRECTORY                           [Phorest Sync Button] |
| View and manage all salon clients.                               |
+------------------------------------------------------------------+
|                                                                  |
| [ All Clients ] [ My Clients ]           <- Primary tabs         |
|                                                                  |
| [Search...] [Location Filter v] [Stylist Filter v] [VIP|AtRisk] |
|                                                                  |
| +--------------------------------------------------------------+ |
| | Stats Cards (Total, VIP, At Risk, New, Revenue)              | |
| +--------------------------------------------------------------+ |
|                                                                  |
| +--------------------------------------------------------------+ |
| | Client List                                                  | |
| +--------------------------------------------------------------+ |
+------------------------------------------------------------------+
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/DashboardLayout.tsx` | Move Client Directory to mainNavItems, remove from statsNavItems |
| `src/pages/dashboard/MyClients.tsx` | Rename to ClientDirectory.tsx, add primary tabs, add stylist filter |
| `src/App.tsx` (or router config) | Update route path from `/my-clients` to `/clients`, add redirect |

## Implementation Notes

1. **Backward Compatibility**: A redirect from `/dashboard/my-clients` to `/dashboard/clients` ensures existing bookmarks and links continue to work.

2. **RLS Compliance**: The existing RLS policies on `phorest_clients`/`clients` tables already handle permission checks at the database level. The frontend filters are for UX optimization.

3. **Tab State Persistence**: Consider persisting the selected primary tab in localStorage so users return to their last view.

4. **Stats Adjustment**: When on "My Clients" tab, stats should only reflect the user's clients. When on "All Clients" with a stylist filter, stats should reflect that stylist's clients.
