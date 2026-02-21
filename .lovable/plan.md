

# Final Branding Sweep + Build Gate Enforcement

## Findings Summary

Source code is clean -- zero tenant references in `src/` or `public/`. The remaining issues are in the database schema, live data defaults, and AI build rules.

---

## Part A: Database Schema Fixes

### A1. Rename `dd_certified` column to `extensions_certified`

The `employee_profiles` table has a column `dd_certified` (added by a legacy migration). This is a platform-level schema element that should not carry tenant branding.

**Migration:**
```sql
ALTER TABLE public.employee_profiles 
  RENAME COLUMN dd_certified TO extensions_certified;
```

**Code updates (2 files):**
- `src/pages/dashboard/MyProfile.tsx` -- replace all `dd_certified` references with `extensions_certified`
- `src/pages/dashboard/ViewProfile.tsx` -- same replacement

### A2. Neutralize schema defaults

The `business_settings.business_name` column has a default value of `'Drop Dead'`. This should be a generic default since it's platform infrastructure.

**Migration:**
```sql
ALTER TABLE public.business_settings 
  ALTER COLUMN business_name SET DEFAULT 'My Business';
```

Note: The actual live data (`Drop Dead Salons`, `Drop Dead Hair Studios & Salons LLC`) is Organization-level tenant data -- correct and should NOT be changed. Only the schema default is being neutralized.

### A3. Fix hardcoded tenant name in SMS template

The `appointment_confirmation` SMS template contains "Drop Dead Gorgeous" hardcoded in the message body. This should use a template variable instead.

**Migration:**
```sql
UPDATE public.sms_templates 
SET message_body = 'Hi {{first_name}}! Your appointment is confirmed for {{appointment_date}} at {{appointment_time}}. See you soon!'
WHERE template_key = 'appointment_confirmation';
```

### A4. Fix hardcoded tenant name in graduation requirement

**Migration:**
```sql
UPDATE public.graduation_requirements
SET description = 'Complete extensions certification program with passing score'
WHERE title = 'Extensions Certification';
```

---

## Part B: Build Rules Update (Prevent Future Leaks)

### B1. Update `project-bible.mdc`

Replace line 10:
> "branded 'Drop Dead 75 Dashboard'"

With:
> A multi-tenant SaaS salon management platform. Each tenant (Organization) has its own brand identity stored in `business_settings`. The platform brand is "Zura" -- see `src/lib/brand.ts` for tokens.

### B2. Update `dev-context.mdc`

Replace the example organization name from `"Drop Dead 75"` to `"Example Salon"` and the email from `eric@dropdeadhair.com` / `eric@dropdeadsalons.com` to `admin@example.com`.

### B3. Update `brand-packaging.mdc`

The "Drop Dead + Zura Flywheel" section describes a specific tenant's business relationship. Replace with a generic "Tenant Brand + Zura Flywheel" description that explains how any organization brand feeds into the Zura ecosystem.

### B4. Add Tenant Branding Prevention Rule

Create a new `.cursor/rules/tenant-brand-guard.mdc` rule that explicitly blocks tenant-specific branding from being introduced into platform code. This rule will:

- List prohibited patterns (hardcoded tenant names, URLs, social handles, email addresses)
- Require all tenant identity to resolve through `businessSettings` or `organizations` table lookups
- Require platform identity to resolve through `src/lib/brand.ts` tokens
- Define the boundary: Platform code = generic. Tenant data = database only.
- Reference the entity hierarchy: Platform -> Organization -> Location -> User

---

## Execution Order

1. Database migrations (A1-A4) -- single SQL migration
2. Code updates for `dd_certified` -> `extensions_certified` (2 files)
3. Build rules updates (B1-B3) -- 3 file edits
4. New guard rule (B4) -- 1 new file

## Risk

Low. The column rename will auto-propagate to `types.ts`. Live tenant data is untouched. Build rules are AI guidance files only.

