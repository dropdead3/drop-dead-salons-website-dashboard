
## Fix: 403 RLS Error on Page Settings Save + Page Editor Enhancements

### Root Cause

The `site_settings` table has RLS policies for **SELECT** (public) and **UPDATE** (admins only), but **no INSERT policy**. The `website_pages` row does not exist in the database yet. When the code tries to create it (via `.upsert()` or `.insert()`), it gets blocked by RLS with a 403 error:

```
"new row violates row-level security policy for table 'site_settings'"
```

This causes a cascade of failures:
1. The initial migration in `useWebsitePages` (fire-and-forget upsert) silently fails
2. Every subsequent save attempt in `useUpdateWebsitePages` also fails on the INSERT path
3. The preview shows 404 because `DynamicPage` reads from `website_pages` which is empty
4. The "Failed to save page settings" toast appears

### Fix

**Step 1: Add INSERT RLS policy for `site_settings`**

Create a database migration to add an INSERT policy matching the existing UPDATE policy -- allowing admins, managers, and super_admins to insert new rows:

```sql
CREATE POLICY "Admins can insert site_settings"
  ON public.site_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'manager', 'super_admin')
    )
    OR EXISTS (
      SELECT 1 FROM employee_profiles
      WHERE employee_profiles.user_id = auth.uid()
      AND employee_profiles.is_super_admin = true
    )
  );
```

**Step 2: Harden `useUpdateWebsitePages` mutation**

The current code checks for an existing row, then branches to INSERT or UPDATE. This is fragile. Switch to a single `.upsert()` call which is atomic and handles both cases. Also add proper error handling to the fire-and-forget migration in `useWebsitePages`.

**Step 3: Improve `PageSettingsEditor` UX**

Minor enhancements to the page settings form:
- Add a character counter for SEO Title (60 char limit) and SEO Description (160 char limit) to match the hint text
- Show the full preview URL so users know exactly where the page will live
- Add a subtle status indicator showing whether the page is currently live or draft

---

### Files to Modify

| File | Change |
|------|--------|
| Database migration | Add INSERT policy on `site_settings` for admins |
| `src/hooks/useWebsitePages.ts` | Replace INSERT/UPDATE branch with `.upsert()`, add error handling to migration |
| `src/components/dashboard/website-editor/PageSettingsEditor.tsx` | Add character counters for SEO fields, show full preview URL, add live/draft badge |
