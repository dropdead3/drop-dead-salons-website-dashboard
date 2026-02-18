

# Add Custom Domain Configuration to Website Settings

## Context

Salons need their public-facing website to live at their own domain (e.g., `www.dropdead.salon`) instead of a platform subdomain. This requires two layers:

1. **Configuration layer** (what we build now) -- UI for entering the domain, storing it per organization, showing DNS instructions, and tracking verification status
2. **Infrastructure layer** (future/ops work) -- actual reverse proxy, SSL provisioning, and domain routing on the server side

This plan builds layer 1 in full so the data model and UX are ready. Layer 2 is an ops/infrastructure task that happens outside the app code.

## What Gets Built

### A "Domain" card inside the General tab of Website Settings

- **Custom domain input** -- salon enters their domain (e.g., `mydayspa.com`)
- **DNS instructions panel** -- after saving, shows the exact DNS records they need to add:
  - A record for `@` pointing to the platform IP
  - A record for `www` pointing to the platform IP
  - TXT record for verification
- **Status indicator** -- shows current state: Not configured, Pending verification, Verifying, Active, or Failed
- **Verify button** -- triggers a check (calls an edge function that does a DNS TXT lookup)
- **Remove domain** -- clears the configuration

### Database: New `organization_domains` table

Stores one row per organization with:

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid (PK) | Row ID |
| `organization_id` | uuid (FK, unique) | One domain per org |
| `domain` | text (unique) | The custom domain |
| `verification_token` | text | Random token for TXT record |
| `status` | text | `pending`, `verifying`, `active`, `failed`, `removed` |
| `verified_at` | timestamptz | When DNS was confirmed |
| `ssl_provisioned_at` | timestamptz | When SSL was issued (set by infra) |
| `created_at` / `updated_at` | timestamptz | Timestamps |

RLS: Only org admins and platform users can read/write their own org's domain row.

### Edge Function: `verify-domain`

A lightweight function that:
1. Looks up the org's domain and expected TXT token
2. Does a DNS TXT lookup (via a public DNS API like `dns.google/resolve`)
3. If the token is found, updates status to `active`
4. If not found, keeps status as `verifying` or sets `failed` after repeated attempts

### New hook: Domain management

- `useOrganizationDomain()` -- fetches the domain row for the current org
- `useSaveDomain()` -- inserts/updates the domain with auto-generated verification token
- `useVerifyDomain()` -- calls the edge function
- `useRemoveDomain()` -- soft-deletes (sets status to `removed`)

## Technical Changes

### 1. Database migration: Create `organization_domains` table

```sql
CREATE TABLE public.organization_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  domain TEXT NOT NULL UNIQUE,
  verification_token TEXT NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', ''),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verifying','active','failed','removed')),
  verified_at TIMESTAMPTZ,
  ssl_provisioned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.organization_domains ENABLE ROW LEVEL SECURITY;

-- Org members can read their own domain
CREATE POLICY "Org members can view domain"
  ON public.organization_domains FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

-- Org admins can manage domain
CREATE POLICY "Org admins can manage domain"
  ON public.organization_domains FOR ALL
  USING (public.is_org_admin(auth.uid(), organization_id));

-- Platform users can view all
CREATE POLICY "Platform users full access"
  ON public.organization_domains FOR ALL
  USING (public.is_platform_user(auth.uid()));
```

### 2. New hook: `src/hooks/useOrganizationDomain.ts`

- `useOrganizationDomain(orgId)` -- query fetching the domain row
- `useSaveDomain()` -- mutation that upserts the domain (INSERT ON CONFLICT update)
- `useRemoveDomain()` -- mutation that deletes the row
- `useVerifyDomain()` -- calls the `verify-domain` edge function

### 3. Edge function: `supabase/functions/verify-domain/index.ts`

- Accepts `{ organization_id }` in the request body
- Looks up the domain and token from `organization_domains`
- Queries `https://dns.google/resolve?name=_lovable.{domain}&type=TXT`
- Checks if any TXT record contains the verification token
- Updates `status` to `active` (with `verified_at`) or keeps as `verifying`
- Returns the updated status

### 4. Update: `WebsiteSettingsContent.tsx` GeneralTab

Add a new "Custom Domain" card at the top of the General tab with:
- Domain input field with save button
- After saving: DNS instructions panel with copyable records
- Status badge (color-coded: yellow for pending, blue for verifying, green for active, red for failed)
- "Check DNS" button that triggers verification
- "Remove Domain" with confirmation dialog

### 5. New component: `src/components/dashboard/settings/DomainConfigCard.tsx`

Extracted component for the domain card to keep GeneralTab clean. Contains:
- All domain CRUD UI
- DNS instruction display with copy-to-clipboard
- Status polling (optional: re-check every 30s while in `verifying` state)

## What This Does NOT Do

- Does not set up the actual reverse proxy or SSL provisioning -- that is infrastructure work
- Does not handle www-to-root redirects at the server level
- Does not support multiple domains per organization (one domain per org for now)

## File Summary

| File | Action |
|------|--------|
| `organization_domains` table | Create (migration) |
| `src/hooks/useOrganizationDomain.ts` | Create |
| `src/components/dashboard/settings/DomainConfigCard.tsx` | Create |
| `src/components/dashboard/settings/WebsiteSettingsContent.tsx` | Edit (add DomainConfigCard to GeneralTab) |
| `supabase/functions/verify-domain/index.ts` | Create |

