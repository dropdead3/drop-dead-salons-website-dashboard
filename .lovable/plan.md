

# Fix: Alex Not Appearing in "Add Member" Search

## The Problem

Alex (alexmaxday@gmail.com) is not appearing in the "Add Members" search results because his `employee_profiles` record has `organization_id = NULL`.

The `useTeamMembers` hook filters team members by:
```typescript
.eq('organization_id', effectiveOrganization.id)
```

Since Alex's profile isn't associated with any organization, he's excluded from all organization-based queries.

---

## Database Finding

| Field | Value |
|-------|-------|
| user_id | `52c43316-2ba5-4367-96d4-f097f8a492ea` |
| full_name | Alex Day |
| email | alexmaxday@gmail.com |
| is_approved | true |
| is_active | true |
| **organization_id** | **NULL** (this is the problem) |

---

## Solution Options

### Option A: Fix Alex's Profile (Data Fix - Recommended)
Assign Alex to the organization by running this SQL:

```sql
UPDATE employee_profiles 
SET organization_id = 'fa23cd95-decf-436a-adba-4561b0ecc14d'
WHERE user_id = '52c43316-2ba5-4367-96d4-f097f8a492ea';
```

This is likely a one-off data issue that occurred during account creation.

### Option B: Investigate Root Cause (If This Happens Often)
If multiple users are missing organization assignments, we should investigate the signup/onboarding flow to ensure `organization_id` is always set when creating employee profiles.

---

## Recommendation

**Run Option A** - This is a data fix that should be applied once. After running the SQL update, Alex will immediately appear in the team member search.

Do you want me to apply this database fix?

