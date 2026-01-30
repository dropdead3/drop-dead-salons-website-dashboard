
# PandaDoc Integration Configuration UI

## Summary

Add a new "Integrations" tab to Platform Settings containing:
1. **PandaDoc Integration Status Card** - Shows connection health, webhook URL, and secret configuration status
2. **Field Mapping Configuration UI** - Allows admins to customize which PandaDoc document fields map to billing columns

This provides platform admins with visibility into the integration state and flexibility to adjust mappings without code changes.

---

## Current State

**What Exists:**
- `site_settings` table stores `pandadoc_field_mapping` configuration
- `pandadoc-webhook` edge function processes webhook events
- Default field mapping hardcoded in webhook and hooks as fallback
- Secrets: `PANDADOC_API_KEY` and `PANDADOC_WEBHOOK_SECRET` (not yet configured)
- PlatformSettings page has existing tab patterns (Team, Security, Templates, Defaults, Branding)

**What's Needed:**
- New "Integrations" tab in Platform Settings
- Status card showing webhook URL and configuration state
- Editable field mapping interface
- Hook to check secret configuration status

---

## Architecture

```text
Platform Settings Page
├── Team
├── Security  
├── Import Templates
├── Defaults
├── Integrations (NEW)
│   ├── PandaDoc Status Card
│   │   ├── Webhook URL (copyable)
│   │   ├── API Key status (configured/not configured)
│   │   ├── Webhook Secret status
│   │   ├── Last webhook received timestamp
│   │   └── Recent documents count
│   │
│   └── Field Mapping Configuration
│       ├── PandaDoc Field → Billing Column mappings
│       ├── Add/Remove mapping rows
│       ├── Billing column dropdown (contract_start_date, etc.)
│       └── Save/Reset buttons
│
└── Branding (Owner Only)
```

---

## UI Design

### Integration Status Card

```text
┌──────────────────────────────────────────────────────────────────┐
│  PandaDoc Integration                              [Test Webhook] │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Status:  ● Connected                                            │
│                                                                   │
│  Webhook URL:                                                     │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ https://vciqmwzgfjxtzagaxgnh.supabase.co/functions/v1/...  │  │
│  │                                                     [Copy] │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Configuration:                                                   │
│  ┌────────────────────┐  ┌────────────────────┐                  │
│  │ API Key            │  │ Webhook Secret     │                  │
│  │ ○ Not Configured   │  │ ○ Not Configured   │                  │
│  │ [Configure]        │  │ [Configure]        │                  │
│  └────────────────────┘  └────────────────────┘                  │
│                                                                   │
│  Stats:                                                           │
│  • Documents received: 12                                         │
│  • Last webhook: 2 hours ago                                      │
│  • Documents pending: 3                                           │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### Field Mapping Configuration

```text
┌──────────────────────────────────────────────────────────────────┐
│  Field Mapping                                            [Reset]│
│  Map PandaDoc document fields to billing configuration           │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  PandaDoc Field Name          Billing Column                      │
│  ─────────────────────────────────────────────────────────────   │
│  ┌──────────────────────┐     ┌──────────────────────┐  [×]      │
│  │ term_start_date      │ →   │ contract_start_date ▼│           │
│  └──────────────────────┘     └──────────────────────┘           │
│  ┌──────────────────────┐     ┌──────────────────────┐  [×]      │
│  │ term_end_date        │ →   │ contract_end_date   ▼│           │
│  └──────────────────────┘     └──────────────────────┘           │
│  ┌──────────────────────┐     ┌──────────────────────┐  [×]      │
│  │ subscription_plan    │ →   │ plan_name_lookup    ▼│           │
│  └──────────────────────┘     └──────────────────────┘           │
│  ┌──────────────────────┐     ┌──────────────────────┐  [×]      │
│  │ monthly_rate         │ →   │ custom_price        ▼│           │
│  └──────────────────────┘     └──────────────────────┘           │
│  ┌──────────────────────┐     ┌──────────────────────┐  [×]      │
│  │ promo_months         │ →   │ promo_months        ▼│           │
│  └──────────────────────┘     └──────────────────────┘           │
│  ┌──────────────────────┐     ┌──────────────────────┐  [×]      │
│  │ promo_rate           │ →   │ promo_price         ▼│           │
│  └──────────────────────┘     └──────────────────────┘           │
│  ┌──────────────────────┐     ┌──────────────────────┐  [×]      │
│  │ setup_fee            │ →   │ setup_fee           ▼│           │
│  └──────────────────────┘     └──────────────────────┘           │
│  ┌──────────────────────┐     ┌──────────────────────┐  [×]      │
│  │ special_notes        │ →   │ notes               ▼│           │
│  └──────────────────────┘     └──────────────────────┘           │
│                                                                   │
│                              [+ Add Mapping]                      │
│                                                                   │
│                                              [Save Mappings]      │
└──────────────────────────────────────────────────────────────────┘
```

---

## Available Billing Columns for Mapping

| Column | Label | Type |
|--------|-------|------|
| contract_start_date | Contract Start Date | Date |
| contract_end_date | Contract End Date | Date |
| plan_name_lookup | Subscription Plan (by name) | Special |
| custom_price | Monthly Rate | Number |
| promo_months | Promo Months | Integer |
| promo_price | Promo Price | Number |
| promo_ends_at | Promo End Date | Date |
| setup_fee | Setup Fee | Number |
| trial_days | Trial Days | Integer |
| billing_cycle | Billing Cycle | Enum |
| notes | Special Notes | Text |
| discount_value | Discount Value | Number |
| per_location_fee | Per Location Fee | Number |
| per_user_fee | Per User Fee | Number |

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/platform/settings/PlatformIntegrationsTab.tsx` | Main integrations tab container |
| `src/components/platform/settings/PandaDocStatusCard.tsx` | Connection status and webhook info |
| `src/components/platform/settings/PandaDocFieldMappingEditor.tsx` | Editable field mapping UI |
| `src/hooks/usePandaDocFieldMapping.ts` | CRUD for field mapping in site_settings |
| `src/hooks/usePandaDocStats.ts` | Query for document statistics |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/dashboard/platform/PlatformSettings.tsx` | Add "Integrations" tab |
| `src/hooks/useSiteSettings.ts` | Add typed hook for pandadoc_field_mapping |

---

## Implementation Details

### usePandaDocFieldMapping Hook

```typescript
interface PandaDocFieldMapping {
  [pandaDocField: string]: string; // maps to billing column
}

const DEFAULT_MAPPING: PandaDocFieldMapping = {
  term_start_date: 'contract_start_date',
  term_end_date: 'contract_end_date',
  subscription_plan: 'plan_name_lookup',
  monthly_rate: 'custom_price',
  promo_months: 'promo_months',
  promo_rate: 'promo_price',
  setup_fee: 'setup_fee',
  special_notes: 'notes',
};

function usePandaDocFieldMapping() {
  // Query site_settings for pandadoc_field_mapping
  // Return data with fallback to DEFAULT_MAPPING
  // Provide update mutation
}
```

### usePandaDocStats Hook

```typescript
interface PandaDocStats {
  totalDocuments: number;
  pendingDocuments: number;
  completedDocuments: number;
  lastWebhookAt: string | null;
}

function usePandaDocStats() {
  // Query pandadoc_documents table for counts
  // Get most recent created_at for "last webhook"
  return useQuery({
    queryKey: ['pandadoc-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pandadoc_documents')
        .select('id, status, created_at')
        .order('created_at', { ascending: false });
      // Calculate stats from results
    }
  });
}
```

### PandaDocStatusCard Component

Shows:
- Webhook URL (constructed from project ID): `https://vciqmwzgfjxtzagaxgnh.supabase.co/functions/v1/pandadoc-webhook`
- Copy button for webhook URL
- Configuration status indicators for API Key and Webhook Secret
- Links to configure secrets (note: secrets API shows which are configured)
- Document statistics from pandadoc_documents table

### PandaDocFieldMappingEditor Component

- Displays current mappings as editable rows
- PandaDoc field: text input (custom field names)
- Billing column: select dropdown with predefined options
- Add/remove mapping buttons
- Save persists to site_settings
- Reset restores to default mapping
- Changes tracked with unsaved indicator

---

## Billing Column Options

Provide a curated list with descriptions:

```typescript
const BILLING_COLUMNS = [
  { value: 'contract_start_date', label: 'Contract Start Date', type: 'date' },
  { value: 'contract_end_date', label: 'Contract End Date', type: 'date' },
  { value: 'plan_name_lookup', label: 'Plan (lookup by name)', type: 'special' },
  { value: 'custom_price', label: 'Monthly Rate', type: 'number' },
  { value: 'base_price', label: 'Base Price', type: 'number' },
  { value: 'promo_months', label: 'Promo Months', type: 'integer' },
  { value: 'promo_price', label: 'Promo Price', type: 'number' },
  { value: 'promo_ends_at', label: 'Promo End Date', type: 'date' },
  { value: 'setup_fee', label: 'Setup Fee', type: 'number' },
  { value: 'trial_days', label: 'Trial Days', type: 'integer' },
  { value: 'billing_cycle', label: 'Billing Cycle', type: 'enum' },
  { value: 'notes', label: 'Special Notes', type: 'text' },
  { value: 'discount_value', label: 'Discount Value', type: 'number' },
  { value: 'per_location_fee', label: 'Per Location Fee', type: 'number' },
  { value: 'per_user_fee', label: 'Per User Fee', type: 'number' },
  { value: 'included_locations', label: 'Included Locations', type: 'integer' },
  { value: 'included_users', label: 'Included Users', type: 'integer' },
];
```

---

## Security & Permissions

- **Tab Access**: Platform admins and owners can access Integrations tab
- **RLS**: Uses existing site_settings policies (platform users can update)
- **Secret Display**: Only shows if secret is configured, never shows actual value
- **Audit**: Consider logging mapping changes to platform_audit_log

---

## Implementation Phases

### Phase 1: Hooks and Data Layer
1. Create `usePandaDocFieldMapping` hook with default fallback
2. Create `usePandaDocStats` hook for document counts
3. Add RLS policy for pandadoc_field_mapping if needed

### Phase 2: Status Card
1. Create `PandaDocStatusCard` component
2. Show webhook URL with copy button
3. Display configuration status for secrets
4. Show document statistics

### Phase 3: Field Mapping Editor
1. Create `PandaDocFieldMappingEditor` component
2. Build editable mapping rows UI
3. Implement add/remove/save/reset functionality
4. Add validation for duplicate fields

### Phase 4: Integration Tab
1. Create `PlatformIntegrationsTab` container
2. Add "Integrations" tab to PlatformSettings
3. Wire up all components

---

## Webhook URL Construction

The webhook URL is deterministic based on the Supabase project ID:

```typescript
const SUPABASE_PROJECT_ID = 'vciqmwzgfjxtzagaxgnh';
const webhookUrl = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/pandadoc-webhook`;
```

This URL should be configured in PandaDoc's webhook settings to receive document events.
