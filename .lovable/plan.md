
# Update Organization Slug to "drop-dead-salons"

## Summary

Change the default organization's URL slug from `drop-dead-gorgeous` to `drop-dead-salons` via a database update. The current architecture ensures this change is safe for existing integrations since all data relationships use UUID-based `organization_id` references.

---

## Architecture Analysis

The multi-tenant architecture uses **UUIDs for all data relationships**, not slugs:

| Table | Uses organization_id (UUID) | Uses slug |
|-------|----------------------------|-----------|
| locations | Yes | No |
| employee_profiles | Yes | No |
| clients | Yes | No |
| appointments | Yes | No |
| services | Yes | No |
| Routing (App.tsx) | Yes (`/accounts/:orgId`) | No |

**The slug is only used for:**
1. Display purposes (UI labels, context banner)
2. Audit logging (logged alongside actions)
3. Database lookups via `useOrganizationBySlug` hook (not actively used in routing)

---

## Required Changes

### 1. Database Update (Primary Change)

Update the organization record in the `organizations` table:

```sql
UPDATE organizations 
SET slug = 'drop-dead-salons', 
    name = 'Drop Dead Salons',
    updated_at = now()
WHERE slug = 'drop-dead-gorgeous';
```

This is the **only required change** to update the slug. All other references dynamically pull from this record.

---

## What Automatically Updates (No Code Changes Needed)

These locations display the slug dynamically from the database and will automatically reflect the new value:

| Location | How It Gets Slug | Auto-Updates? |
|----------|------------------|---------------|
| AccountDetail page header | `organization.slug` | Yes |
| PlatformContextBanner | `selectedOrganization.slug` | Yes |
| Edit Organization Dialog | Pre-populated from org record | Yes |
| Audit logs | Logged at action time | Yes (new logs) |
| Organization Switcher | Dynamic from query | Yes |

---

## External References to Verify

The following hardcoded external URLs exist in the codebase but are **independent Square integrations**, not related to the organization slug:

| File | URL | Action |
|------|-----|--------|
| `src/pages/Services.tsx:205` | `https://drop-dead-gorgeous-az.square.site` | External booking link (Square) - separate system |
| `src/pages/Services.tsx:423` | `https://drop-dead-gorgeous-az.square.site` | Same external booking link |

These Square site URLs are **external third-party integrations** and not part of the slug system. They would need to be updated separately if the Square site name changes.

---

## Migration Seed Files (Historical Reference Only)

The migration files contain the old slug for initial seeding:

| File | Line | Content |
|------|------|---------|
| `20260129202631_*.sql` | 3 | `'drop-dead-gorgeous'` in INSERT |
| `20260129202631_*.sql` | 11 | `WHERE slug = 'drop-dead-gorgeous'` |

**These do NOT need to be modified** because:
- Migration files are historical records that have already run
- They use `ON CONFLICT (slug) DO NOTHING` - safe for re-runs
- The database update changes the live record directly

---

## Implementation Steps

### Step 1: Database Migration

Create a new migration to update the organization record:

```sql
-- Update default organization slug and name
UPDATE organizations 
SET 
  slug = 'drop-dead-salons',
  name = 'Drop Dead Salons',
  updated_at = now()
WHERE slug = 'drop-dead-gorgeous';
```

### Step 2: Verify Update

After migration, confirm the change:

```sql
SELECT id, name, slug FROM organizations WHERE slug = 'drop-dead-salons';
```

---

## Impact Assessment

| Area | Impact | Risk Level |
|------|--------|------------|
| Data relationships | None (uses UUIDs) | None |
| API endpoints | None (routes use orgId) | None |
| User sessions | None (org fetched by id) | None |
| Audit logs | Old logs show old slug | Low (historical) |
| External Square links | Separate system | None |
| UI displays | Automatically updated | None |

---

## Files to Create

| File | Purpose |
|------|---------|
| Database migration | Update organization slug and name |

No frontend code changes are required - the slug is already fetched dynamically from the database throughout the application.
