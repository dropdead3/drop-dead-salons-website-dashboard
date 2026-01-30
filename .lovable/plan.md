
# Edit Organization Account Dialog

## Summary

Create a comprehensive edit dialog that allows platform administrators to modify all aspects of an organization account. The dialog will be accessible from both the Accounts table (via the actions dropdown) and the AccountDetail page.

---

## Editable Fields

Based on the database schema, the following fields will be editable:

| Field | Type | Section |
|-------|------|---------|
| `name` | Text (required) | Basic Info |
| `slug` | Text (required) | Basic Info |
| `legal_name` | Text | Basic Info |
| `business_type` | Select | Basic Info |
| `logo_url` | Text/URL | Basic Info |
| `status` | Select | Account Status |
| `onboarding_stage` | Select | Account Status |
| `subscription_tier` | Select | Account Status |
| `primary_contact_email` | Email | Contact Info |
| `primary_contact_phone` | Phone | Contact Info |
| `source_software` | Select | Migration Info |
| `timezone` | Select | Settings |
| `activated_at` | Date picker | Account Status |

**Read-only fields** (displayed but not editable):
- `id` - System generated
- `account_number` - Auto-generated sequence
- `created_at` - System timestamp
- `updated_at` - System timestamp

---

## Component Architecture

### New Component: EditOrganizationDialog

**File**: `src/components/platform/EditOrganizationDialog.tsx`

A dialog component that:
- Receives an organization object as a prop
- Pre-populates all form fields with current values
- Groups fields into logical sections with visual separation
- Uses the existing `useUpdateOrganization` mutation hook
- Validates all inputs using Zod schema

### Props Interface

```typescript
interface EditOrganizationDialogProps {
  organization: Organization;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

---

## Dialog Layout

The dialog will use a tabbed or sectioned layout to organize fields:

```text
┌─────────────────────────────────────────────────────────────────┐
│  ✏️ Edit Organization                                     [X]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ── Basic Information ──────────────────────────────────────    │
│                                                                 │
│  Business Name *              URL Slug *                        │
│  ┌─────────────────────┐     ┌─────────────────────┐           │
│  │ Drop Dead Gorgeous  │     │ drop-dead-gorgeous  │           │
│  └─────────────────────┘     └─────────────────────┘           │
│                                                                 │
│  Legal Name                   Business Type                     │
│  ┌─────────────────────┐     ┌─────────────────────┐           │
│  │ DDG Holdings LLC    │     │ Salon           ▾   │           │
│  └─────────────────────┘     └─────────────────────┘           │
│                                                                 │
│  Logo URL                                                       │
│  ┌─────────────────────────────────────────────────┐           │
│  │ https://...                                     │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
│  ── Account Status ─────────────────────────────────────────    │
│                                                                 │
│  Status                      Onboarding Stage                   │
│  ┌─────────────────────┐     ┌─────────────────────┐           │
│  │ Active          ▾   │     │ Live            ▾   │           │
│  └─────────────────────┘     └─────────────────────┘           │
│                                                                 │
│  Subscription Plan            Timezone                          │
│  ┌─────────────────────┐     ┌─────────────────────┐           │
│  │ Standard        ▾   │     │ America/Chicago ▾   │           │
│  └─────────────────────┘     └─────────────────────┘           │
│                                                                 │
│  ── Contact Information ────────────────────────────────────    │
│                                                                 │
│  Contact Email               Contact Phone                      │
│  ┌─────────────────────┐     ┌─────────────────────┐           │
│  │ owner@salon.com     │     │ (555) 123-4567      │           │
│  └─────────────────────┘     └─────────────────────┘           │
│                                                                 │
│  ── Migration Info ─────────────────────────────────────────    │
│                                                                 │
│  Previous Software                                              │
│  ┌─────────────────────────────────────────────────┐           │
│  │ Phorest                                      ▾  │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  Account #1000 • Created Jan 15, 2025                           │
│                                         [Cancel]  [Save Changes]│
└─────────────────────────────────────────────────────────────────┘
```

---

## Form Schema

```typescript
const editFormSchema = z.object({
  // Basic Info
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string()
    .min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, and hyphens only'),
  legal_name: z.string().optional().nullable(),
  business_type: z.enum(['salon', 'spa', 'esthetics', 'barbershop', 'med_spa', 'wellness', 'other']),
  logo_url: z.string().url().optional().nullable().or(z.literal('')),
  
  // Account Status
  status: z.enum(['pending', 'active', 'suspended', 'churned']),
  onboarding_stage: z.enum(['new', 'importing', 'training', 'live']),
  subscription_tier: z.string(),
  timezone: z.string(),
  
  // Contact Info
  primary_contact_email: z.string().email().optional().nullable().or(z.literal('')),
  primary_contact_phone: z.string().optional().nullable(),
  
  // Migration Info
  source_software: z.string().optional().nullable(),
});
```

---

## Integration Points

### 1. Accounts Table (Dropdown Menu)

**File**: `src/pages/dashboard/platform/Accounts.tsx`

Add an "Edit" menu item to the existing dropdown:

```tsx
<DropdownMenuItem onClick={(e) => {
  e.stopPropagation();
  setEditOrg(org);
}}>
  <Pencil className="h-4 w-4 mr-2" />
  Edit Account
</DropdownMenuItem>
```

### 2. AccountDetail Page (Settings Tab + Header Button)

**File**: `src/pages/dashboard/platform/AccountDetail.tsx`

- Replace the placeholder "Configure" button with an "Edit" button
- Populate the Settings tab with editable forms or link to the edit dialog

---

## Files to Create/Modify

| File | Change |
|------|--------|
| `src/components/platform/EditOrganizationDialog.tsx` | **Create** - Full edit dialog with all fields |
| `src/pages/dashboard/platform/Accounts.tsx` | Add "Edit" to dropdown menu, import dialog |
| `src/pages/dashboard/platform/AccountDetail.tsx` | Wire up "Configure" button to open edit dialog |

---

## Technical Details

### Timezone Options

Common timezone options to include:

```typescript
const timezoneOptions = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Phoenix', label: 'Arizona (AZ)' },
  { value: 'America/Anchorage', label: 'Alaska (AK)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii (HI)' },
  { value: 'America/Toronto', label: 'Eastern Time (Canada)' },
  { value: 'America/Vancouver', label: 'Pacific Time (Canada)' },
];
```

### Status Change Handling

When changing status from `pending` to `active`, automatically set `activated_at` to the current timestamp if it's not already set.

### Slug Validation

The slug field should show a warning if changed, as it may affect existing URLs and integrations:

```tsx
{slugChanged && (
  <p className="text-amber-400 text-xs mt-1">
    ⚠️ Changing the slug may break existing integrations
  </p>
)}
```

---

## Styling

The dialog follows the established Platform Theme design system:
- Dark slate background (`bg-slate-800`)
- Violet accent colors for focus states
- Section dividers using subtle borders
- Consistent spacing and typography with other platform dialogs
