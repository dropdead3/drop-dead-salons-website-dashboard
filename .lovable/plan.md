
# Create Admin Account for alexmaxday@gmail.com

## Summary

Create a new edge function that allows super admins to provision admin accounts with specific credentials. This function will:
1. Create the auth user with a secure temporary password
2. Auto-approve the employee profile
3. Assign the `admin` role
4. Optionally grant super admin status

---

## Current Architecture

The system uses a multi-layer approach:
- **Auth Layer**: Supabase Auth manages user credentials
- **Profile Layer**: `employee_profiles` table stores user metadata, approval status, and super admin flag
- **Roles Layer**: `user_roles` table stores role assignments (admin, manager, stylist, etc.)
- **Trigger**: `handle_new_user()` automatically creates employee_profile when auth user is created

---

## Implementation Approach

### New Edge Function: `create-admin-account`

Creates an admin account with:
- Email confirmation bypassed (auto-confirmed)
- Account pre-approved
- Admin role assigned
- Optional super admin flag

### Request Body
```json
{
  "email": "alexmaxday@gmail.com",
  "fullName": "Alex Day",
  "password": "SecurePassword123!",  // Optional - generates if not provided
  "grantSuperAdmin": false           // Optional - default false
}
```

### Response
```json
{
  "success": true,
  "userId": "uuid",
  "email": "alexmaxday@gmail.com",
  "password": "GeneratedOrProvided123!",
  "message": "Admin account created successfully"
}
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/create-admin-account/index.ts` | Edge function for admin account creation |

---

## Security

- **Authentication Required**: Caller must provide valid JWT
- **Super Admin Only**: Only existing super admins can create admin accounts
- **Service Role**: Uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS for account creation
- **Audit Logging**: Records action in `account_approval_logs`

---

## Edge Function Logic

```text
1. Verify Authorization header present
2. Validate caller is super admin via employee_profiles.is_super_admin
3. Check if email already exists
4. Generate secure password if not provided
5. Create auth user with supabaseAdmin.auth.admin.createUser()
   - email_confirm: true (bypasses email verification)
   - user_metadata: { full_name, role: 'admin' }
6. Update employee_profile (created by trigger):
   - is_approved: true
   - is_active: true
   - is_super_admin: (if requested)
7. Insert into user_roles: { user_id, role: 'admin' }
8. Log action to account_approval_logs
9. Return credentials
```

---

## Usage After Implementation

Once deployed, call the function:

```bash
curl -X POST \
  'https://vciqmwzgfjxtzagaxgnh.supabase.co/functions/v1/create-admin-account' \
  -H 'Authorization: Bearer YOUR_SUPER_ADMIN_JWT' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "alexmaxday@gmail.com",
    "fullName": "Alex Day",
    "grantSuperAdmin": true
  }'
```

Or invoke from the app's admin panel (future enhancement).

---

## For Immediate Use

After implementing, run the function with:
- **Email**: alexmaxday@gmail.com
- **Full Name**: Alex Day (or preferred name)
- **Grant Super Admin**: true (for full access)

The function will return the generated password which should be securely shared with the user.

---

## Password Generation

If no password provided, generate a secure one:
```typescript
function generateSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  for (let i = 0; i < 16; i++) {
    password += chars[array[i] % chars.length];
  }
  return password;
}
```

---

## Alternative: Direct SQL (If Urgent)

If you need this account created immediately before implementing the edge function, I can provide SQL commands to run directly in the database (though this requires service role access and is less secure than the edge function approach).
