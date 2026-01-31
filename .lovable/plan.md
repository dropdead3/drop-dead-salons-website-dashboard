

## Self-Service User Seats for Super Admins

This plan enables business organization super admins to purchase additional user seats through a self-service flow, mirroring the existing location seats model.

---

### Overview

| Current State | Proposed State |
|--------------|----------------|
| User capacity calculated but not enforced | Capacity bar shows usage + "Add Seat" button |
| Invite button always enabled | Invite disabled at capacity with upgrade prompt |
| No `useAddUserSeats` hook | New hook for self-service seat purchases |
| No Add User Seats dialog | New dialog matching location seats UX |

---

### What Gets Built

#### 1. User Capacity Bar Component
A new `UserCapacityBar.tsx` component (similar to `LocationCapacityBar.tsx`) that:
- Shows used vs total user seats with progress bar
- Displays "At capacity" / "Near capacity" badges
- Has "Add Seat" button for super admins
- Only visible to super admins

#### 2. Add User Seats Dialog
A new `AddUserSeatsDialog.tsx` component (matching `AddLocationSeatsDialog.tsx`) that:
- Shows current plan summary with included users
- Quantity selector for seats to add
- Real-time cost breakdown showing:
  - Base plan price
  - Current add-on cost
  - New add-on cost with increase highlighted
- Agreement checkbox with billing terms
- Proration info note

#### 3. useAddUserSeats Hook
Extend `useBusinessCapacity.ts` with a new hook that:
- Fetches current billing record
- Updates `additional_users_purchased` field
- Logs change to `billing_changes` table with type `add_users`
- Returns success with new seat count

#### 4. Capacity Enforcement on Invite
Update `InviteStaffDialog.tsx` to:
- Check `canAddUser` from capacity hook
- Show upgrade prompt when at capacity
- Disable invite button with clear messaging

#### 5. Settings Page Integration
Update the "Users" category in `Settings.tsx` to:
- Import and use the capacity hook
- Show `UserCapacityBar` above team members list
- Only show for super admins
- Connect to Add Seats dialog

---

### Visual Changes

**Before (Team Members section):**
```text
+------------------------------------------+
| TEAM MEMBERS                              |
| Manage team members and access levels     |
+------------------------------------------+
| Leadership                                |
|   [User 1] [Role selector] [Remove]       |
|   [User 2] [Role selector] [Remove]       |
+------------------------------------------+
```

**After (with Capacity Bar):**
```text
+------------------------------------------+
| TEAM MEMBERS                              |
| Manage team members and access levels     |
+------------------------------------------+
| [=====-------------] 5 of 10 seats used   |
| [Near capacity]              [Add Seat]   |
+------------------------------------------+
| Leadership                                |
|   [User 1] [Role selector] [Remove]       |
+------------------------------------------+
```

**Add User Seats Dialog:**
```text
+------------------------------------------+
| [icon] Add User Seats                     |
|        Expand your team capacity          |
+------------------------------------------+
| Current plan              Professional    |
| Included users            5               |
| Additional seats          2 x $10 = $20   |
+------------------------------------------+
| How many seats to add?                    |
|        [-]  3  [+]                        |
|        $10 per seat per month             |
+------------------------------------------+
| NEW MONTHLY COST                          |
| Base plan                      $199/mo    |
| User add-ons      $50/mo (+$30)           |
| ──────────────────────────────            |
| Total                          $249/mo    |
+------------------------------------------+
| [x] I agree to updated billing terms.     |
|     My cost will increase by $30.         |
+------------------------------------------+
| [!] Prorated for current billing period   |
+------------------------------------------+
|              [Cancel] [Confirm & Add]     |
+------------------------------------------+
```

---

### Implementation Details

#### File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useBusinessCapacity.ts` | **Edit** | Add `useAddUserSeats` hook |
| `src/components/dashboard/settings/UserCapacityBar.tsx` | **Create** | Capacity visualization |
| `src/components/dashboard/settings/AddUserSeatsDialog.tsx` | **Create** | Self-service upgrade dialog |
| `src/pages/dashboard/admin/Settings.tsx` | **Edit** | Add capacity bar to Users section |
| `src/components/dashboard/InviteStaffDialog.tsx` | **Edit** | Add capacity enforcement |

---

#### 1. useAddUserSeats Hook

Add to `src/hooks/useBusinessCapacity.ts`:

```typescript
export function useAddUserSeats() {
  const { data: profile } = useEmployeeProfile();
  const organizationId = profile?.organization_id;

  const addSeats = async (seatsToAdd: number) => {
    if (!organizationId) throw new Error('No organization found');

    // Get current billing record
    const { data: billing, error: fetchError } = await supabase
      .from('organization_billing')
      .select('id, additional_users_purchased')
      .eq('organization_id', organizationId)
      .single();

    if (fetchError) throw fetchError;

    const currentSeats = billing.additional_users_purchased ?? 0;
    const newSeats = currentSeats + seatsToAdd;

    // Update the billing record
    const { error: updateError } = await supabase
      .from('organization_billing')
      .update({ additional_users_purchased: newSeats })
      .eq('id', billing.id);

    if (updateError) throw updateError;

    // Log the change to audit table
    await supabase.from('billing_changes').insert({
      organization_id: organizationId,
      change_type: 'add_users',  // Uses existing enum value
      previous_value: { additional_users_purchased: currentSeats },
      new_value: { additional_users_purchased: newSeats },
      notes: `Added ${seatsToAdd} user seat(s)`,
    });

    return { previousSeats: currentSeats, newSeats };
  };

  return { addSeats, organizationId };
}
```

---

#### 2. UserCapacityBar Component

Create `src/components/dashboard/settings/UserCapacityBar.tsx`:

- Mirror structure of `LocationCapacityBar.tsx`
- Use `Users` icon instead of `MapPin`
- Display user seats used vs total
- Show utilization progress bar
- "At capacity" / "Near capacity" badges
- "Add Seat" button triggers dialog

---

#### 3. AddUserSeatsDialog Component

Create `src/components/dashboard/settings/AddUserSeatsDialog.tsx`:

- Mirror structure of `AddLocationSeatsDialog.tsx`
- Use `Users` icon
- Calculate costs using `perUserFee` and `additionalUsersPurchased`
- Show base users from plan
- Quantity selector with +/- buttons
- Cost breakdown with increase highlighted
- Agreement checkbox
- Proration info note
- Submit triggers `useAddUserSeats` mutation

---

#### 4. Settings Page Integration

Update the "Users" category in `Settings.tsx`:

```typescript
// Add imports
import { useBusinessCapacity } from '@/hooks/useBusinessCapacity';
import { UserCapacityBar } from '@/components/dashboard/settings/UserCapacityBar';
import { AddUserSeatsDialog } from '@/components/dashboard/settings/AddUserSeatsDialog';

// Add state
const [isAddUserSeatsOpen, setIsAddUserSeatsOpen] = useState(false);
const capacity = useBusinessCapacity();

// In the 'users' category render:
{activeCategory === 'users' && (
  <Card>
    <CardHeader>
      <CardTitle>TEAM MEMBERS</CardTitle>
      <CardDescription>Manage team members and access levels.</CardDescription>
    </CardHeader>
    <CardContent>
      {/* Add capacity bar for super admins */}
      {profile?.is_super_admin && !capacity.isLoading && (
        <div className="mb-6">
          <UserCapacityBar 
            capacity={capacity} 
            onAddSeats={() => setIsAddUserSeatsOpen(true)} 
          />
        </div>
      )}
      
      {/* Existing team members list */}
      ...
    </CardContent>
  </Card>
)}

{/* Add dialog */}
<AddUserSeatsDialog
  open={isAddUserSeatsOpen}
  onOpenChange={setIsAddUserSeatsOpen}
  capacity={capacity}
/>
```

---

#### 5. Invite Dialog Enforcement

Update `InviteStaffDialog.tsx`:

```typescript
// Add import
import { useBusinessCapacity } from '@/hooks/useBusinessCapacity';

// In component
const capacity = useBusinessCapacity();
const canInvite = capacity.canAddUser || capacity.isLoading;

// Update trigger button
<DialogTrigger asChild>
  <Button 
    className="gap-2" 
    disabled={!canInvite}
    title={!canInvite ? 'User seats at capacity' : undefined}
  >
    <UserPlus className="h-4 w-4" />
    Invite Staff
  </Button>
</DialogTrigger>

// Add capacity warning in dialog content when at limit
{!capacity.canAddUser && !capacity.users.isUnlimited && (
  <Alert variant="destructive" className="mb-4">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>
      You've reached your user seat limit. 
      Contact your organization admin to add more seats.
    </AlertDescription>
  </Alert>
)}
```

---

### Access Control

- **Capacity bar visible to**: Super admins only (`profile?.is_super_admin`)
- **Add seats button**: Super admins only
- **Invite enforcement**: All users (disabled when at capacity for everyone)
- **RLS protection**: `organization_billing` table already has proper RLS for updates

---

### Technical Notes

**Why no database changes needed:**
- `organization_billing.additional_users_purchased` column already exists
- `billing_changes` table already supports `add_users` change type
- `useOrganizationCapacity` already calculates user capacity correctly
- `useBusinessCapacity` already exposes `canAddUser`, `perUserFee`, etc.

**Billing flow:**
1. Super admin clicks "Add Seat" button
2. Dialog shows current plan + cost projection
3. Super admin selects quantity and agrees to terms
4. On confirm:
   - `additional_users_purchased` incremented in `organization_billing`
   - Change logged to `billing_changes` for audit
   - Query cache invalidated to refresh UI
5. Invite button becomes enabled (if it was disabled)

