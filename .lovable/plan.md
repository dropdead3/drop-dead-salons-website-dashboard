
# Blacklisted/Banned Client Warning System

## Overview
Implement a comprehensive system to flag clients as blacklisted/banned and display prominent warnings throughout the booking workflow to prevent team members from accidentally scheduling appointments with restricted clients.

## Implementation Approach

### 1. Database Schema Update
Add two new columns to the `phorest_clients` table:

| Column | Type | Description |
|--------|------|-------------|
| `is_banned` | `boolean` | Flag indicating if client is blacklisted (default: false) |
| `ban_reason` | `text` | Optional explanation for why the client was banned |
| `banned_at` | `timestamp` | When the ban was applied (for audit trail) |
| `banned_by` | `uuid` | Who applied the ban (references auth.users) |

### 2. Warning Display Locations

#### A. Client Directory (List View)
- Add a red "Banned" badge next to client names in the list
- Visual indicator: `Ban` icon with red background styling
- Banned clients sorted last or optionally filterable

#### B. Client Detail Sheet
- Prominent red alert banner at the top when viewing a banned client's profile
- Shows ban reason if provided
- Uses the existing `Alert` component with `destructive` variant

#### C. Booking Wizard - Client Step
- Red warning badge on client search results for banned clients
- When a banned client is selected: show a confirmation dialog warning the team member
- Option to proceed (for edge cases) or go back and select another client

#### D. Quick Booking Popover - Client Selection
- Same visual indicator in search results
- Same warning dialog before proceeding

#### E. Register/Checkout - Client Select
- Warning badge on banned clients in search
- Alert banner when a banned client is selected

### 3. UI Components

**New Components:**
- `BannedClientBadge` - Reusable red badge with Ban icon
- `BannedClientAlert` - Alert banner showing ban status and reason
- `BannedClientWarningDialog` - Confirmation dialog when booking a banned client

**Example Alert Banner:**
```
+------------------------------------------------------------------+
|  ⛔ CLIENT BANNED                                                |
|  This client has been blacklisted and should not be scheduled.   |
|  Reason: [Reason text if provided]                               |
+------------------------------------------------------------------+
```

### 4. Admin Controls

Add ability for authorized users (admin, manager, super_admin) to:
- Mark a client as banned from the Client Detail Sheet
- Provide a ban reason
- Remove the ban status if needed

This will be a simple toggle button in the Client Detail Sheet header, visible only to users with appropriate permissions.

---

## Technical Details

### Database Migration
```sql
-- Add ban-related columns to phorest_clients
ALTER TABLE phorest_clients
ADD COLUMN is_banned boolean DEFAULT false,
ADD COLUMN ban_reason text,
ADD COLUMN banned_at timestamp with time zone,
ADD COLUMN banned_by uuid REFERENCES auth.users(id);

-- Create index for efficient filtering
CREATE INDEX idx_phorest_clients_is_banned ON phorest_clients(is_banned) WHERE is_banned = true;
```

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/dashboard/clients/BannedClientBadge.tsx` | Reusable badge component |
| `src/components/dashboard/clients/BannedClientAlert.tsx` | Alert banner for detail views |
| `src/components/dashboard/clients/BannedClientWarningDialog.tsx` | Confirmation dialog |

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/dashboard/ClientDirectory.tsx` | Add banned badge to list items, add "Banned" filter tab |
| `src/components/dashboard/ClientDetailSheet.tsx` | Add alert banner at top, add ban/unban toggle for admins |
| `src/components/dashboard/schedule/booking/ClientStep.tsx` | Add banned indicator and warning on selection |
| `src/components/dashboard/schedule/QuickBookingPopover.tsx` | Add banned indicator in client search results |
| `src/components/dashboard/register/RegisterClientSelect.tsx` | Add banned warning |

### Warning Dialog Flow

When a team member selects a banned client for booking:

1. Show `AlertDialog` with:
   - Title: "Client is Blacklisted"
   - Description: Ban reason (if available) + warning message
   - Actions: "Go Back" (primary) | "Proceed Anyway" (secondary/outlined)

2. If they proceed:
   - Allow booking to continue
   - Optionally log this override action for audit purposes

### Type Updates

Update the client interface to include:
```typescript
interface Client {
  // ... existing fields
  is_banned?: boolean;
  ban_reason?: string | null;
  banned_at?: string | null;
  banned_by?: string | null;
}
```

---

## Summary

This implementation provides a multi-layered warning system:

1. **Visual Indicators**: Banned clients are immediately identifiable in all lists
2. **Detail View Alerts**: Clear warning when viewing a banned client's profile
3. **Booking Guardrails**: Confirmation dialog prevents accidental scheduling
4. **Admin Controls**: Authorized users can manage ban status

The system is designed to warn but not completely block (for edge cases where management approves an exception), while making it very clear that the client has been flagged.
