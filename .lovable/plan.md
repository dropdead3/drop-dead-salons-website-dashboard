
# Team Stats Page for Admins with Member Toggle

## Overview

Transform the "My Stats" page into a dual-purpose page that:
- **For Admins**: Shows as "Team Stats" with a dropdown to toggle between team members (filtered to Stylists and Stylist Assistants only)
- **For Stylists/Stylist Assistants**: Shows as "My Stats" (their own stats only, no toggle)

---

## Changes Summary

| Change | Description |
|--------|-------------|
| Update nav visibility | Add `admin` role to stats nav item so admins can see it |
| Update nav label | Show "Team Stats" for admin, "My Stats" for stylists |
| Add team member selector | Dropdown to select stylist/stylist_assistant for admins |
| Make stats dynamic | Use selected user ID instead of hardcoded current user |
| Update page header | Dynamic title based on role and selected member |

---

## Technical Details

### 1. Update Navigation Item

**File: `src/components/dashboard/DashboardLayout.tsx`**

Update `statsNavItems` to include admin roles and use a dynamic label:

```typescript
const statsNavItems: NavItem[] = [
  { 
    href: '/dashboard/stats', 
    label: 'My Stats', // Label will be dynamic in component
    icon: BarChart3, 
    permission: 'view_own_stats', 
    roles: ['stylist', 'stylist_assistant', 'admin', 'super_admin', 'manager'] // Add admin roles
  },
  // ... other items
];
```

Then in the sidebar rendering logic, dynamically change the label to "Team Stats" for admin/manager/super_admin roles.

---

### 2. Update Stats Page with Team Member Selector

**File: `src/pages/dashboard/Stats.tsx`**

**Add new state and queries:**

```typescript
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function Stats() {
  const { user, roles } = useAuth();
  
  // Check if user is admin/manager
  const isAdmin = roles.includes('admin') || roles.includes('super_admin') || roles.includes('manager');
  
  // State for selected team member (for admins)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  
  // Fetch team members with stylist/stylist_assistant roles (only for admins)
  const { data: teamMembers } = useQuery({
    queryKey: ['stats-team-members'],
    queryFn: async () => {
      // Get users with stylist or stylist_assistant roles
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['stylist', 'stylist_assistant']);
      
      if (!userRoles?.length) return [];
      
      const userIds = [...new Set(userRoles.map(r => r.user_id))];
      
      const { data: profiles } = await supabase
        .from('employee_profiles')
        .select('user_id, full_name, display_name, photo_url')
        .in('user_id', userIds)
        .eq('is_active', true)
        .order('full_name');
      
      return profiles || [];
    },
    enabled: isAdmin,
  });
  
  // Determine which user's stats to show
  const effectiveUserId = isAdmin && selectedMemberId ? selectedMemberId : user?.id;
  
  // Get the selected member's name for display
  const selectedMember = teamMembers?.find(m => m.user_id === selectedMemberId);
```

**Update data fetching to use `effectiveUserId`:**

All hooks that currently use `user?.id` should use `effectiveUserId` instead:
- `useUserPhorestMapping(effectiveUserId)`
- `useUserSalesSummary(effectiveUserId, ...)`
- Finding Phorest metrics by `effectiveUserId`

**Update page header with team member selector:**

```tsx
<div className="flex items-center justify-between mb-8">
  <div>
    <h1 className="font-display text-3xl lg:text-4xl mb-2">
      {isAdmin ? 'TEAM STATS' : 'MY STATS'}
    </h1>
    <p className="text-muted-foreground font-sans">
      {isAdmin 
        ? 'View performance metrics for any team member.' 
        : 'Track your personal performance metrics.'}
    </p>
  </div>
  
  {/* Team member selector - only for admins */}
  {isAdmin && teamMembers && teamMembers.length > 0 && (
    <Select 
      value={selectedMemberId || ''} 
      onValueChange={(value) => setSelectedMemberId(value || null)}
    >
      <SelectTrigger className="w-[250px]">
        <SelectValue placeholder="Select team member..." />
      </SelectTrigger>
      <SelectContent>
        {teamMembers.map((member) => (
          <SelectItem key={member.user_id} value={member.user_id}>
            {member.display_name || member.full_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )}
</div>
```

**Show "viewing as" indicator when viewing another member's stats:**

```tsx
{isAdmin && selectedMemberId && selectedMember && (
  <div className="mb-4 p-3 bg-primary/10 rounded-lg flex items-center gap-2">
    <Users className="w-4 h-4 text-primary" />
    <span className="text-sm">
      Viewing stats for <strong>{selectedMember.display_name || selectedMember.full_name}</strong>
    </span>
  </div>
)}
```

---

### 3. Update Sidebar Label Dynamically

**File: `src/components/dashboard/SidebarNavContent.tsx`**

In the section that renders nav items, check if the item is the stats page and the user has admin roles, then display "Team Stats" instead of "My Stats":

```typescript
// When rendering the stats nav item
const getNavLabel = (item: NavItem) => {
  if (item.href === '/dashboard/stats') {
    const isAdminUser = authRoles.includes('admin') || authRoles.includes('super_admin') || authRoles.includes('manager');
    return isAdminUser ? 'Team Stats' : 'My Stats';
  }
  return item.label;
};
```

---

## Files to Modify

| File | Action |
|------|--------|
| `src/components/dashboard/DashboardLayout.tsx` | Update roles array for stats nav item |
| `src/components/dashboard/SidebarNavContent.tsx` | Add dynamic label logic for stats item |
| `src/pages/dashboard/Stats.tsx` | Add team member selector, use effectiveUserId, dynamic header |

---

## User Experience

| Role | Nav Label | Page Title | Can Toggle Members? |
|------|-----------|------------|---------------------|
| Stylist | "My Stats" | "MY STATS" | No |
| Stylist Assistant | "My Stats" | "MY STATS" | No |
| Admin/Manager/Super Admin | "Team Stats" | "TEAM STATS" | Yes - dropdown with stylists only |

---

## Data Flow

```text
Admin visits /dashboard/stats
       │
       ▼
┌─────────────────────────────────┐
│ Fetch team members with         │
│ stylist/stylist_assistant roles │
└─────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Show selector dropdown          │
│ (Stylists & Stylist Assistants) │
└─────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Admin selects team member       │
│ selectedMemberId updates        │
└─────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ All data hooks refetch using    │
│ effectiveUserId = selectedId    │
└─────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Page displays selected          │
│ member's performance data       │
└─────────────────────────────────┘
```

This approach reuses the existing Stats page infrastructure while adding a simple team member toggle for admins, keeping the codebase clean and avoiding duplication.
