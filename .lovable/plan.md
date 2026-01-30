

# Create Platform Administrator Login

## Current Situation

The Platform Login page at `/platform-login` is fully functional, but **no users have platform access** yet because the `platform_roles` table is empty. You need to assign a platform role to at least one user.

---

## What We'll Do

Create a database migration to assign the `platform_owner` role to your primary account (`eric@dropdeadhair.com`), which will grant full platform administration access.

---

## Implementation

### Database Migration

Execute a single SQL statement to grant platform access:

```sql
-- Assign platform_owner role to the primary account
INSERT INTO public.platform_roles (user_id, role, granted_by)
SELECT 
  id as user_id,
  'platform_owner' as role,
  id as granted_by
FROM auth.users
WHERE email = 'eric@dropdeadhair.com';
```

---

## After Implementation

Once the migration runs, you'll be able to:

1. Go to `/platform-login`
2. Enter your credentials for `eric@dropdeadhair.com`
3. Successfully log in to the **Platform Admin Hub**
4. Access the full platform administration features:
   - Platform Overview
   - Salon Accounts management
   - Migrations/Import tools
   - Platform Settings (where you can invite additional platform team members)

---

## Login Credentials

| Field | Value |
|-------|-------|
| **URL** | `/platform-login` |
| **Email** | `eric@dropdeadhair.com` |
| **Password** | *(your existing password for this account)* |

---

## Security Note

The `platform_owner` role is the highest level of platform access. From the Platform Settings page, you'll be able to invite additional team members with appropriate roles:

- `platform_admin` - Full platform access
- `platform_support` - View orgs, perform migrations
- `platform_developer` - View access, testing/debugging

