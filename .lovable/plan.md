

# Allow Front Desk (Receptionist) and Leadership Roles to View All Clients

## Overview

Update the RLS policies and page logic to allow users with leadership roles (admin, manager, super_admin) **and the receptionist (front desk) role** to view all clients in the system, while stylists continue to see only clients assigned to them.

---

## Current State

| Component | Current Behavior |
|-----------|-----------------|
| RLS Policy | Stylists only see clients where `auth.uid() = preferred_stylist_id` |
| Admin RLS Policy | Admins can manage clients via `is_coach_or_admin()` function |
| MyClients.tsx | Always filters `.eq('preferred_stylist_id', user?.id)` |
| Result | All 504 clients have `preferred_stylist_id = NULL`, so nobody sees any clients |

---

## Solution

### 1. Create a New Database Function

Create a helper function to check if a user can view all clients:

```sql
CREATE OR REPLACE FUNCTION public.can_view_all_clients(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'manager', 'super_admin', 'receptionist')
  )
  OR EXISTS (
    SELECT 1
    FROM public.employee_profiles
    WHERE user_id = _user_id
      AND is_super_admin = true
  )
$$;
```

### 2. Update RLS Policy on `phorest_clients`

Replace the current restrictive policy with one that allows:
- Stylists to see their own clients (via `preferred_stylist_id`)
- Leadership + receptionist to see **all** clients

```sql
-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Stylists can view their own clients" ON public.phorest_clients;

-- Create new inclusive policy
CREATE POLICY "Users can view clients based on role"
ON public.phorest_clients
FOR SELECT
USING (
  auth.uid() = preferred_stylist_id 
  OR public.can_view_all_clients(auth.uid())
);
```

### 3. Update `MyClients.tsx` Page Logic

Modify the data fetching query to conditionally remove the `preferred_stylist_id` filter for users who can view all clients.

**File:** `src/pages/dashboard/MyClients.tsx`

**Changes:**
1. Import `useAuth` roles
2. Check if user has a role that allows viewing all clients
3. Conditionally apply or skip the `preferred_stylist_id` filter

```tsx
// Add role check at the top of the component
const { user, roles } = useAuth();

// Determine if user can see all clients
const canViewAllClients = roles.some(role => 
  ['admin', 'manager', 'super_admin', 'receptionist'].includes(role)
);

// Update the query to conditionally filter
const { data: clients, isLoading } = useQuery({
  queryKey: ['my-clients-full', user?.id, canViewAllClients],
  queryFn: async () => {
    let query = supabase
      .from('phorest_clients')
      .select('*')
      .order('total_spend', { ascending: false });
    
    // Only filter by preferred_stylist_id for stylists
    if (!canViewAllClients) {
      query = query.eq('preferred_stylist_id', user?.id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
  enabled: !!user?.id,
});
```

---

## Files to Modify

| File | Changes |
|------|---------|
| Database Migration | Add `can_view_all_clients()` function + update RLS policy |
| `src/pages/dashboard/MyClients.tsx` | Add role-based query logic |

---

## Result

| Role | What They See |
|------|---------------|
| Admin | All 504 clients |
| Manager | All 504 clients |
| Super Admin | All 504 clients |
| Receptionist (Front Desk) | All 504 clients |
| Stylist | Only clients where `preferred_stylist_id` matches their ID |
| Stylist Assistant | Only clients where `preferred_stylist_id` matches their ID |

This provides operational flexibility for front desk staff to look up any client while maintaining privacy for stylist-specific views.

