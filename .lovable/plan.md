

# Forms Templates System Implementation Plan

## Overview

This plan creates a comprehensive **Forms Templates** system under **Business Operations** in Settings. The system will allow admins to:

1. Create and manage form templates (service agreements, model releases, consultation forms)
2. Attach forms to specific services (requiring signature before appointment begins)
3. Track client signatures with "sign once" logic (no re-signing for same service/form)
4. Enforce form requirements during check-in workflow

---

## Database Schema

### New Tables

#### 1. `form_templates` - Stores all form templates

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `id` | UUID | gen_random_uuid() | Primary key |
| `name` | TEXT | NOT NULL | Template name (e.g., "Extensions Agreement") |
| `description` | TEXT | | Brief description for admin view |
| `form_type` | TEXT | | Category: 'service_agreement', 'model_release', 'consultation', 'custom' |
| `content` | TEXT | NOT NULL | Markdown content of the form |
| `version` | TEXT | NOT NULL | Version label (e.g., "v1.0") |
| `is_active` | BOOLEAN | true | Whether this version is active |
| `requires_witness` | BOOLEAN | false | Future: witness signature support |
| `created_by` | UUID | | Reference to employee who created |
| `created_at` | TIMESTAMPTZ | now() | |
| `updated_at` | TIMESTAMPTZ | now() | |

#### 2. `service_form_requirements` - Links forms to services

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `id` | UUID | gen_random_uuid() | Primary key |
| `service_id` | UUID | FK | References phorest_services.id |
| `form_template_id` | UUID | FK | References form_templates.id |
| `is_required` | BOOLEAN | true | Whether form is mandatory |
| `signing_frequency` | TEXT | 'once' | 'once', 'per_visit', 'annually' |
| `created_at` | TIMESTAMPTZ | now() | |

#### 3. `client_form_signatures` - Tracks client signatures

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `id` | UUID | gen_random_uuid() | Primary key |
| `client_id` | TEXT | NOT NULL | phorest_client_id |
| `form_template_id` | UUID | FK | Which form was signed |
| `form_version` | TEXT | NOT NULL | Version at time of signing |
| `signed_at` | TIMESTAMPTZ | now() | When signature was captured |
| `typed_signature` | TEXT | | Typed name for e-signature |
| `ip_address` | TEXT | | For audit trail |
| `appointment_id` | UUID | | Optional link to appointment |
| `collected_by` | UUID | | Staff member who collected |

---

## Row-Level Security (RLS) Policies

```text
form_templates:
  - SELECT: All authenticated users (to render forms)
  - INSERT/UPDATE/DELETE: Admins, managers, super_admins only

service_form_requirements:
  - SELECT: All authenticated users
  - INSERT/UPDATE/DELETE: Admins, managers, super_admins only

client_form_signatures:
  - SELECT: Staff can view signatures for their clients
  - INSERT: Authenticated users (staff collect signatures)
  - DELETE: Super_admin only (audit trail protection)
```

---

## File Structure

```text
src/
├── components/dashboard/settings/
│   └── FormsTemplatesContent.tsx        # Main settings panel (new)
├── components/dashboard/forms/
│   ├── FormTemplateEditor.tsx           # Create/edit form dialog (new)
│   ├── FormTemplateList.tsx             # List with actions (new)
│   ├── FormPreviewDialog.tsx            # Preview form content (new)
│   ├── ServiceFormLinkDialog.tsx        # Link forms to services (new)
│   └── FormSigningDialog.tsx            # Client signature capture (new)
├── hooks/
│   ├── useFormTemplates.ts              # CRUD for form_templates (new)
│   ├── useServiceFormRequirements.ts    # Link forms to services (new)
│   └── useClientFormSignatures.ts       # Signature tracking (new)
└── pages/dashboard/admin/
    └── Settings.tsx                     # Add 'forms' category routing
```

---

## Implementation Steps

### Step 1: Database Migration

Create the three new tables with RLS policies:

```sql
-- form_templates table
CREATE TABLE public.form_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  form_type TEXT DEFAULT 'custom',
  content TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT 'v1.0',
  is_active BOOLEAN DEFAULT true,
  requires_witness BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- service_form_requirements junction table
CREATE TABLE public.service_form_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES phorest_services(id) ON DELETE CASCADE,
  form_template_id UUID NOT NULL REFERENCES form_templates(id) ON DELETE CASCADE,
  is_required BOOLEAN DEFAULT true,
  signing_frequency TEXT DEFAULT 'once' CHECK (signing_frequency IN ('once', 'per_visit', 'annually')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(service_id, form_template_id)
);

-- client_form_signatures table
CREATE TABLE public.client_form_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  form_template_id UUID NOT NULL REFERENCES form_templates(id),
  form_version TEXT NOT NULL,
  signed_at TIMESTAMPTZ DEFAULT now(),
  typed_signature TEXT,
  ip_address TEXT,
  appointment_id UUID,
  collected_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_form_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_form_signatures ENABLE ROW LEVEL SECURITY;

-- RLS Policies (using existing has_role function)
CREATE POLICY "Anyone can read form templates"
  ON form_templates FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage form templates"
  ON form_templates FOR ALL TO authenticated
  USING (public.is_coach_or_admin(auth.uid()));

-- Similar policies for other tables...
```

### Step 2: Settings Configuration

Update `useSettingsLayout.ts`:

```typescript
// Add to SECTION_GROUPS operations categories:
categories: ['business', 'locations', 'schedule', 'dayrate', 'forms', 'levels', 'onboarding', 'handbooks']

// Add icon color:
forms: '#0EA5E9', // Sky blue (FileCheck icon)
```

Update `Settings.tsx`:

```typescript
// Add to SettingsCategory type:
type SettingsCategory = '...' | 'forms' | null;

// Add to categoriesMap:
forms: {
  id: 'forms',
  label: 'Forms',
  description: 'Client agreements & waivers',
  icon: FileCheck,
}

// Add routing for activeCategory === 'forms'
```

### Step 3: Forms Templates Content Component

Create `FormsTemplatesContent.tsx` with tabbed interface:

```text
+------------------------------------------+
| FORMS & AGREEMENTS                       |
+------------------------------------------+
| [Templates] [Service Links] [Signatures] |
+------------------------------------------+

Templates Tab:
- List of all form templates with version badges
- "New Template" button opens FormTemplateEditor
- Actions: Preview, Edit, Set Active, Delete

Service Links Tab:
- Table showing services and their required forms
- "Link Form" button per service
- Shows signing frequency setting

Signatures Tab:
- Searchable log of client signatures
- Filter by form type, date range, client
- Export capability for audits
```

### Step 4: Form Template Editor

Create `FormTemplateEditor.tsx`:

```text
+------------------------------------------+
| Create New Form Template           [X]   |
+------------------------------------------+
| Name: [Service Agreement             ]   |
|                                          |
| Type: [Service Agreement ▼]              |
|       - Service Agreement                |
|       - Model Release                    |
|       - Consultation Form                |
|       - Custom                           |
|                                          |
| Version: [v1.0]                          |
|                                          |
| Content (Markdown):                      |
| +--------------------------------------+ |
| | # Service Agreement                  | |
| |                                      | |
| | By signing below, I agree to...      | |
| +--------------------------------------+ |
|                                          |
| [ ] Make this the active version         |
|                                          |
|              [Cancel] [Save Template]    |
+------------------------------------------+
```

### Step 5: Service Form Linking

Create `ServiceFormLinkDialog.tsx`:

- Modal to assign forms to services
- Multi-select for services (batch assignment)
- Signing frequency selector: Once / Per Visit / Annually
- Visual preview of which services have forms

### Step 6: Client Signature Capture

Create `FormSigningDialog.tsx` (similar to AgreementStep pattern):

```text
+------------------------------------------+
| Required Forms for Check-In              |
+------------------------------------------+
| Extensions Service Agreement (v1.2)      |
|                                          |
| [Scrollable form content preview]        |
|                                          |
| [✓] I have read and agree to the above   |
|                                          |
| Type your name to sign:                  |
| [ Sarah Johnson                     ]    |
|                                          |
|                    [Cancel] [Sign & Continue]
+------------------------------------------+
```

### Step 7: Check-In Integration

Modify `TodaysQueueSection.tsx` and `QueueCard.tsx`:

1. Before `handleCheckIn()`, query for unsigned required forms
2. If forms are needed, open `FormSigningDialog` instead of immediate check-in
3. After successful signature, proceed with normal check-in flow

```typescript
// Pseudocode for check-in validation
const handleCheckIn = async (appointmentId: string, clientId: string, serviceId: string) => {
  // Get required forms for this service
  const requiredForms = await getRequiredFormsForService(serviceId);
  
  // Check which ones client has already signed
  const unsignedForms = await getUnsignedForms(clientId, requiredForms);
  
  if (unsignedForms.length > 0) {
    // Open signing dialog
    setFormsToSign(unsignedForms);
    setFormSigningOpen(true);
    return;
  }
  
  // Proceed with check-in
  updateStatus.mutate({ appointmentId, status: 'checked_in' });
};
```

---

## UI/UX Considerations

1. **One-time signing**: Once a client signs a form, they don't see it again for the same service type (unless version changes or annual renewal)

2. **Version tracking**: When form content is updated with a new version, previously signed versions remain valid - only new clients sign the new version

3. **Visual indicators**: Queue cards show a small "forms needed" badge when unsigned forms exist

4. **Batch operations**: Allow linking one form to multiple services at once

5. **Preview mode**: Staff can preview forms before asking clients to sign

---

## Technical Details

### Hooks Structure

**useFormTemplates.ts:**
- `useFormTemplates()` - List all templates
- `useActiveFormsByType(type)` - Get active templates by category
- `useCreateFormTemplate()` - Create mutation
- `useUpdateFormTemplate()` - Update mutation
- `useDeleteFormTemplate()` - Delete mutation

**useServiceFormRequirements.ts:**
- `useRequiredFormsForService(serviceId)` - Get linked forms
- `useServicesWithForms()` - List services with form count
- `useLinkFormToService()` - Create link mutation
- `useUnlinkFormFromService()` - Remove link mutation

**useClientFormSignatures.ts:**
- `useClientSignatures(clientId)` - Get client's signatures
- `useUnsignedFormsForClient(clientId, serviceIds)` - Check-in validation
- `useRecordSignature()` - Record new signature mutation

### Form Types Enum

```typescript
export const FORM_TYPES = {
  service_agreement: { label: 'Service Agreement', icon: FileCheck },
  model_release: { label: 'Model Release', icon: Camera },
  consultation: { label: 'Consultation Form', icon: ClipboardList },
  custom: { label: 'Custom Form', icon: FileText },
} as const;
```

---

## Migration Strategy

1. Deploy database migration first
2. Add settings category and basic template management
3. Add service linking functionality
4. Add signature capture flow
5. Integrate with check-in workflow

All existing appointments/services continue working normally until forms are explicitly linked to services.

