

# Next Feature Build: Platform Settings, Website Tools & Data Infrastructure

This plan tackles the remaining **"coming soon"** placeholders across the Platform Admin and Business Dashboard areas.

---

## Feature Overview

| # | Feature | Location | Priority |
|---|---------|----------|----------|
| 1 | Import Templates Manager | PlatformSettings - Templates Tab | High |
| 2 | Default Organization Settings | PlatformSettings - Defaults Tab | High |
| 3 | Force Logout Implementation | PlatformSecurityTab | Medium |
| 4 | Services Manager DB Integration | ServicesManager.tsx | High |
| 5 | Testimonials Drag-and-Drop | TestimonialsManager.tsx | Medium |
| 6 | Webhook Security (Edge Function) | capture-external-lead | High |

---

## Feature 1: Import Templates Manager

### What Gets Built
A configuration panel to manage default field mappings for data imports from different CRM systems (Phorest, Vagaro, Salon Iris, CSV).

### Current State
```
Import Templates tab → "Import templates coming soon..."
```

### New Implementation

**Components to Create:**
- `PlatformImportTemplatesTab.tsx` - Main templates manager

**Functionality:**
- View existing import templates per source system
- Create/edit field mappings (source field → target column)
- Set default transformations (date formats, phone normalization)
- Clone templates for new organizations
- Preview sample mappings

### Visual Design
```text
+------------------------------------------------------------+
| Import Templates                                            |
+------------------------------------------------------------+
| Select Source: [Phorest ▼]                                  |
+------------------------------------------------------------+
| FIELD MAPPINGS                                              |
| Source Field          →         Target Column               |
| ──────────────────────────────────────────────────         |
| client_name           →         [full_name ▼]               |
| email_address         →         [email ▼]                   |
| mobile                →         [phone ▼]                   |
| created_date          →         [created_at ▼]              |
|                                                [+ Add Row]  |
+------------------------------------------------------------+
| TRANSFORMATIONS                                             |
| Date Format: [YYYY-MM-DD ▼]                                 |
| Phone Format: [E.164 ▼]                                     |
| [x] Normalize names to Title Case                           |
+------------------------------------------------------------+
|                    [Save Template] [Clone for New Org]      |
+------------------------------------------------------------+
```

### Storage Approach
Store in `platform_import_templates` table:
```sql
CREATE TABLE IF NOT EXISTS public.platform_import_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_system TEXT NOT NULL, -- 'phorest', 'vagaro', 'salon_iris', 'csv'
  entity_type TEXT NOT NULL, -- 'clients', 'services', 'appointments', 'staff'
  field_mappings JSONB NOT NULL DEFAULT '[]',
  transformations JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  organization_id UUID REFERENCES organizations(id), -- null = platform default
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
```

---

## Feature 2: Default Organization Settings

### What Gets Built
Configure default values that are applied when creating new organizations.

### Current State
```
Defaults tab → "Default settings coming soon..."
```

### New Implementation

**Components to Create:**
- `PlatformDefaultsTab.tsx` - Default settings configuration

**Settings to Configure:**
1. **Plan & Billing Defaults**
   - Default subscription plan
   - Default billing cycle
   - Trial period length

2. **Feature Defaults**
   - Which features are enabled by default
   - Default role permissions

3. **Operational Defaults**
   - Default timezone
   - Default currency
   - Default appointment duration

### Visual Design
```text
+------------------------------------------------------------+
| Default Organization Settings                               |
+------------------------------------------------------------+
| PLAN DEFAULTS                                               |
| Default Plan: [Professional ▼]                              |
| Billing Cycle: [Monthly ▼]                                  |
| Trial Period: [14] days                                     |
+------------------------------------------------------------+
| FEATURE DEFAULTS                                            |
| [x] Enable 75 Hard program                                  |
| [x] Enable client portal                                    |
| [ ] Enable online booking                                   |
| [ ] Enable inventory management                             |
+------------------------------------------------------------+
| OPERATIONAL DEFAULTS                                        |
| Timezone: [America/New_York ▼]                              |
| Currency: [USD ▼]                                           |
| Default Appointment: [60] minutes                           |
+------------------------------------------------------------+
|                              [Save Defaults]                |
+------------------------------------------------------------+
```

### Storage
Use `site_settings` table with `scope = 'platform'`:
```typescript
{
  key: 'new_org_defaults',
  value: {
    plan: 'professional',
    billing_cycle: 'monthly',
    trial_days: 14,
    features: { enable_75_hard: true, ... },
    timezone: 'America/New_York',
    currency: 'USD',
  }
}
```

---

## Feature 3: Force Logout Implementation

### What Gets Built
A working "Force Logout All Platform Users" function that terminates all active sessions.

### Current State
```typescript
// TODO: Implement force logout
alert('Force logout functionality would be implemented here');
```

### New Implementation

**Edge Function to Create:**
- `force-logout-platform-users` - Revokes all platform user sessions

**Backend Logic:**
1. Query all users with platform roles
2. Call Supabase Admin API to revoke refresh tokens
3. Log the action to `platform_audit_log`
4. Return count of affected users

**UI Updates:**
- Replace `alert()` with actual API call
- Show loading state during operation
- Display success message with count

### Code Pattern
```typescript
// Edge Function: force-logout-platform-users
const { data: platformUsers } = await supabaseAdmin
  .from('user_roles')
  .select('user_id')
  .in('role', ['platform_owner', 'platform_admin', 'platform_support', 'platform_developer']);

for (const user of platformUsers) {
  await supabaseAdmin.auth.admin.signOut(user.user_id, 'global');
}

// Log to audit
await supabaseAdmin.from('platform_audit_log').insert({
  action: 'force_logout_all',
  performed_by: userId,
  details: { affected_users: platformUsers.length },
});
```

---

## Feature 4: Services Manager DB Integration

### What Gets Built
Connect the ServicesManager to the database using existing hooks.

### Current State
```
"Note: Changes made here are currently local only. Database integration coming soon."
```

### Changes Required

**Hook Integration:**
- Replace local `useState` with `useServicesData()` hook
- Wire up `useUpdateService()` for edits
- Wire up `useDeleteService()` for removal
- Wire up `useCreateService()` for new services

**Key Changes:**
1. Fetch real services grouped by category
2. Update mutations to call database
3. Remove mock `initialServices` data
4. Add organization context for multi-tenant

### Before/After Pattern
```typescript
// BEFORE (local state)
const [serviceCategories, setServiceCategories] = useState(initialServices);
const handleSave = () => setServiceCategories([...updated]);

// AFTER (database connected)
const { data: services } = useServicesData();
const updateService = useUpdateService();
const handleSave = () => updateService.mutate({ id, ...changes });
```

---

## Feature 5: Testimonials Drag-and-Drop

### What Gets Built
Add drag-and-drop reordering capability to TestimonialsManager.

### Current State
```
"Order: Drag and drop to reorder testimonials (coming soon)."
```

### Implementation

**Using @dnd-kit** (already installed):
- Wrap testimonials list in `DndContext`
- Make each testimonial a `SortableItem`
- Save new order to database via `display_order` column

**Components to Update:**
- `TestimonialsManager.tsx` - Add sortable container
- `TestimonialsContent.tsx` - Mirror changes

**Database Change:**
```sql
ALTER TABLE public.testimonials
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
```

### Visual Enhancement
```text
+------------------------------------------+
| [≡] "Love this place!" - Lexi V.    ★★★★★|  ← Drag handle
|     "I love Drop Dead! The owner..."     |
|     [Edit] [Toggle] [Delete]             |
+------------------------------------------+
| [≡] "Amazing experience" - Jane D. ★★★★★|
|     "Best salon I've ever been to..."    |
|     [Edit] [Toggle] [Delete]             |
+------------------------------------------+
```

---

## Feature 6: Webhook Security

### What Gets Built
Add signature verification for external lead webhooks.

### Current State
```typescript
// TODO: Add webhook secret verification per source
// - CallRail: Signature verification
// - Meta: App secret verification
// - Google: OAuth token verification
```

### Implementation

**Verification Functions:**
1. **CallRail**: Verify HMAC-SHA256 signature header
2. **Meta (Facebook/Instagram)**: Verify X-Hub-Signature-256
3. **Google Business**: Verify JWT token

**Environment Secrets Required:**
- `CALLRAIL_WEBHOOK_SECRET`
- `META_APP_SECRET`
- `GOOGLE_WEBHOOK_SECRET`

### Code Pattern
```typescript
// Verify CallRail signature
function verifyCallRailSignature(body: string, signature: string): boolean {
  const secret = Deno.env.get('CALLRAIL_WEBHOOK_SECRET');
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

// Verify Meta signature
function verifyMetaSignature(body: string, signature: string): boolean {
  const secret = Deno.env.get('META_APP_SECRET');
  const expected = `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
```

---

## Implementation Order

### Phase 1: Platform Settings (Features 1, 2, 3)
1. Create `platform_import_templates` table
2. Build `PlatformImportTemplatesTab` component
3. Build `PlatformDefaultsTab` component
4. Create `force-logout-platform-users` edge function
5. Wire up Force Logout button

### Phase 2: Data Management (Features 4, 5)
1. Refactor `ServicesManager.tsx` to use hooks
2. Add `display_order` to testimonials table
3. Implement drag-and-drop with @dnd-kit
4. Update both TestimonialsManager and TestimonialsContent

### Phase 3: Security (Feature 6)
1. Add webhook secret environment variables
2. Implement signature verification functions
3. Update `capture-external-lead` edge function
4. Add audit logging for rejected webhooks

---

## File Changes Summary

| File | Action | Feature |
|------|--------|---------|
| `src/components/platform/settings/PlatformImportTemplatesTab.tsx` | **Create** | 1 |
| `src/components/platform/settings/PlatformDefaultsTab.tsx` | **Create** | 2 |
| `supabase/functions/force-logout-platform-users/index.ts` | **Create** | 3 |
| `src/components/platform/settings/PlatformSecurityTab.tsx` | **Edit** | 3 |
| `src/pages/dashboard/admin/ServicesManager.tsx` | **Edit** | 4 |
| `src/pages/dashboard/admin/TestimonialsManager.tsx` | **Edit** | 5 |
| `src/components/dashboard/website-editor/TestimonialsContent.tsx` | **Edit** | 5 |
| `supabase/functions/capture-external-lead/index.ts` | **Edit** | 6 |
| `src/pages/dashboard/platform/PlatformSettings.tsx` | **Edit** | 1, 2 |
| Database Migration | **Create** | 1, 5 |

---

## Database Changes

```sql
-- Feature 1: Import Templates
CREATE TABLE IF NOT EXISTS public.platform_import_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_system TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  field_mappings JSONB NOT NULL DEFAULT '[]',
  transformations JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.platform_import_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can manage templates"
ON public.platform_import_templates
FOR ALL TO authenticated
USING (public.has_platform_role_or_higher(auth.uid(), 'platform_support'))
WITH CHECK (public.has_platform_role_or_higher(auth.uid(), 'platform_support'));

-- Feature 5: Testimonials ordering
ALTER TABLE public.testimonials
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_testimonials_display_order 
ON public.testimonials(display_order);
```

---

## Technical Considerations

### Existing Patterns Used
- `useServicesData` hooks for database operations
- `@dnd-kit` for drag-and-drop (already installed)
- Platform UI components for settings tabs
- Edge function patterns for security

### Security Notes
- Webhook secrets stored in Supabase Edge Function secrets
- Force logout requires platform_admin or higher
- Import templates RLS restricts to platform team

### Estimated Scope

| Feature | Complexity | Estimated Changes |
|---------|------------|-------------------|
| Import Templates Manager | Medium | ~350 lines |
| Default Org Settings | Medium | ~250 lines |
| Force Logout | Low | ~100 lines |
| Services DB Integration | Medium | ~200 lines |
| Testimonials Drag-Drop | Medium | ~250 lines |
| Webhook Security | Low | ~150 lines |
| **Total** | | **~1,300 lines** |

