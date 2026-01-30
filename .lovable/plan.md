
# Invite Platform Team Member by Email

## Summary

Implement a complete email invitation system for the Platform Team, allowing admins to invite new users who don't yet have accounts. This mirrors the existing staff invitation system but is tailored for platform-level roles.

---

## Current State

The platform currently has two separate flows:

| Flow | Use Case | Limitation |
|------|----------|------------|
| Staff Invitations | Invite salon team members | Org-level only, not for platform roles |
| Platform Role Assignment | Add platform roles | Requires existing account |

The screenshot shows the Platform Settings > Team tab with "Add Team Member" button. Currently, this only works if the user already has an account. The request is to enable inviting users by email who may not have an account yet.

---

## Solution Architecture

```text
+------------------+    +---------------------+    +------------------+
|  Invite Dialog   | -> | platform_invitations| -> | Edge Function    |
|  (enter email)   |    | (database table)    |    | (send email)     |
+------------------+    +---------------------+    +------------------+
                                                           |
                                                           v
                                                   +------------------+
                                                   |  Email w/ Link   |
                                                   |  (signup token)  |
                                                   +------------------+
                                                           |
                                                           v
                                                   +------------------+
                                                   |  Platform Login  |
                                                   |  (signup flow)   |
                                                   +------------------+
                                                           |
                                                           v
                                                   +------------------+
                                                   |  Auto-assign     |
                                                   |  platform_role   |
                                                   +------------------+
```

---

## Database Changes

### New Table: `platform_invitations`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | TEXT | Invitee email |
| role | platform_role | Admin/Support/Developer |
| invited_by | UUID | User who sent invite |
| token | UUID | Unique signup token |
| status | TEXT | pending/accepted/expired/cancelled |
| expires_at | TIMESTAMPTZ | 7-day expiration |
| accepted_at | TIMESTAMPTZ | When accepted |
| accepted_by | UUID | User who accepted |
| created_at | TIMESTAMPTZ | Created timestamp |

### RLS Policies

- Platform admins/owners can view all invitations
- Platform admins/owners can insert invitations
- Platform admins/owners can update invitation status

---

## Edge Function: `send-platform-invitation`

Creates and sends the invitation email using Resend:

1. Receives: `{ email, role, token, inviter_name }`
2. Constructs personalized HTML email with:
   - Platform branding
   - Role description
   - Signup link with token
   - Expiration notice (7 days)
3. Sends via Resend API

---

## Frontend Components

### Updated: `InvitePlatformUserDialog.tsx`

Add two modes:

1. **Existing User**: Search by email, assign role (current behavior)
2. **New User**: Send email invitation (new behavior)

Flow logic:
- User enters email
- Check if account exists in `employee_profiles`
- If exists: offer to assign role immediately
- If not exists: create invitation and send email

### New Hook: `usePlatformInvitations.ts`

- `usePlatformInvitations()` - List all invitations
- `useCreatePlatformInvitation()` - Create and send invite
- `useCancelPlatformInvitation()` - Cancel pending invite
- `useResendPlatformInvitation()` - Resend expired invite

### Updated: `PlatformLogin.tsx`

Add invitation token handling:
- Check URL for `?invitation=<token>`
- Pre-fill email from invitation
- On signup success: mark invitation accepted, assign platform role

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/send-platform-invitation/index.ts` | Email sending edge function |
| `src/hooks/usePlatformInvitations.ts` | React Query hooks for invitations |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/platform/InvitePlatformUserDialog.tsx` | Add new user invitation flow |
| `src/components/platform/PlatformTeamManager.tsx` | Show pending invitations section |
| `src/pages/PlatformLogin.tsx` | Handle invitation token on signup |

---

## Technical Details

### Database Migration SQL

```sql
-- Create platform_role type if not exists
DO $$ BEGIN
  CREATE TYPE platform_role AS ENUM ('platform_owner', 'platform_admin', 'platform_support', 'platform_developer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create platform invitations table
CREATE TABLE IF NOT EXISTS public.platform_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('platform_admin', 'platform_support', 'platform_developer')),
  invited_by UUID NOT NULL,
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for platform team members
CREATE POLICY "Platform team can view invitations"
  ON public.platform_invitations FOR SELECT
  USING (public.is_platform_user(auth.uid()));

CREATE POLICY "Platform admins can create invitations"
  ON public.platform_invitations FOR INSERT
  WITH CHECK (
    public.has_platform_role(auth.uid(), 'platform_owner') OR
    public.has_platform_role(auth.uid(), 'platform_admin')
  );

CREATE POLICY "Platform admins can update invitations"
  ON public.platform_invitations FOR UPDATE
  USING (
    public.has_platform_role(auth.uid(), 'platform_owner') OR
    public.has_platform_role(auth.uid(), 'platform_admin')
  );
```

### Edge Function Pattern

Following existing patterns (e.g., `notify-assignment-response`):

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

// Sends invitation email with signup link
// Uses RESEND_API_KEY secret
// Returns { success: true, email_id: ... }
```

### Invitation Email Template

- Professional platform branding
- Clear role explanation (Admin/Support/Developer)
- Direct signup link: `{base_url}/platform-login?invitation={token}`
- 7-day expiration warning
- Mobile-responsive HTML

---

## User Flow

### Inviting a New Team Member

1. Admin opens "Add Team Member" dialog
2. Enters email address
3. Selects role (Admin, Support, or Developer)
4. Clicks "Send Invitation"
5. System checks if email exists:
   - **If exists**: Shows option to assign role immediately
   - **If not exists**: Creates invitation, sends email
6. Success toast: "Invitation sent to email@example.com"

### Receiving an Invitation

1. New user receives email with signup link
2. Clicks link → Opens platform login page with pre-filled email
3. Creates account (password + details)
4. System automatically:
   - Marks invitation as accepted
   - Assigns the platform role
5. User is logged in with platform access

---

## Pending Invitations UI

Add a section below the team table showing pending invitations:

| Email | Role | Invited | Expires | Actions |
|-------|------|---------|---------|---------|
| new@example.com | Support | Jan 30 | Feb 6 | Resend · Cancel |

---

## Implementation Order

1. Create database migration for `platform_invitations` table
2. Create `send-platform-invitation` edge function
3. Create `usePlatformInvitations` hook
4. Update `InvitePlatformUserDialog` with new user flow
5. Update `PlatformTeamManager` to show pending invitations
6. Update `PlatformLogin` to handle invitation tokens
