

## QuickBooks Payroll Integration - Multi-Provider Support

This plan extends the payroll system to support **QuickBooks Online Payroll** as an alternative to Gusto, giving account owners flexibility to choose their preferred payroll provider.

---

### Overview

Account owners will be able to:
1. **Choose their payroll provider** - Gusto OR QuickBooks (one active at a time)
2. **Connect via OAuth** - Secure Intuit OAuth 2.0 flow for QuickBooks
3. **Run payroll through QuickBooks** - Same wizard flow with QuickBooks API backend
4. **View unified reports** - Payroll history regardless of provider

The system will track which provider each organization uses and route all payroll operations through the appropriate API.

---

### Architecture

```text
+------------------+       +-------------------+       +----------------+
|  Account Owner   | ----> |   Your Platform   | ----> |   Gusto API    |
|   Dashboard      |       |                   |       +----------------+
+------------------+       |   Edge Functions: |
                           |   - gusto-oauth   |       +------------------+
                           |   - quickbooks-*  | ----> | QuickBooks API   |
                           +-------------------+       +------------------+
                                    |
                           +-------------------+
                           |   Supabase DB     |
                           | payroll_connections|
                           | payroll_runs      |
                           +-------------------+
```

**Key Design Decision**: Rather than separate `gusto_connections` and `quickbooks_connections` tables, we'll use a unified `payroll_connections` table with a `provider` column. This simplifies queries and ensures only one provider is active per organization.

---

### Changes Summary

| Area | Files | Action |
|------|-------|--------|
| Database | Migration | **Modify** - Rename `gusto_connections` to `payroll_connections`, add `provider` enum |
| Edge Functions | `quickbooks-oauth`, `quickbooks-payroll-proxy` | **Create** - Handle QuickBooks OAuth and API |
| Edge Functions | `gusto-oauth`, `gusto-payroll-proxy` | **Create** - Handle Gusto OAuth and API |
| Hooks | `usePayrollConnection.ts` | **Create** - Unified provider connection state |
| Components | `PayrollProviderSelector.tsx` | **Create** - Choose between Gusto/QuickBooks |
| Components | `QuickBooksConnectionCard.tsx` | **Create** - QuickBooks-specific status card |
| Integrations | `IntegrationsTab.tsx` | **Edit** - Add Gusto and QuickBooks as options |
| Config | Integration registry | **Edit** - Add both payroll providers |

---

### Database Schema Changes

#### Table: `payroll_connections` (replaces `gusto_connections`)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `organization_id` | UUID | FK to `organizations` (UNIQUE - one provider per org) |
| `provider` | TEXT | `gusto` or `quickbooks` |
| `external_company_id` | TEXT | Gusto company UUID or QuickBooks realm ID |
| `access_token_encrypted` | TEXT | AES-encrypted access token |
| `refresh_token_encrypted` | TEXT | AES-encrypted refresh token |
| `token_expires_at` | TIMESTAMPTZ | Token expiration |
| `connection_status` | TEXT | `pending`, `connected`, `disconnected`, `error` |
| `connected_by` | UUID | User who connected |
| `connected_at` | TIMESTAMPTZ | When connection was established |
| `last_synced_at` | TIMESTAMPTZ | Last successful API call |
| `metadata` | JSONB | Provider-specific config (QuickBooks: sandbox mode, Gusto: company tier) |

**Key Constraint**: `UNIQUE(organization_id)` ensures only one payroll provider per organization.

#### Update: `payroll_runs` table

Add provider column to existing schema:

| Column | Type | Description |
|--------|------|-------------|
| `provider` | TEXT | `gusto` or `quickbooks` |
| `external_payroll_id` | TEXT | Renamed from `gusto_payroll_uuid` for generality |

#### Update: `employee_payroll_settings` table

| Column | Type | Description |
|--------|------|-------------|
| `external_employee_id` | TEXT | Renamed from `gusto_employee_uuid` |

---

### Edge Functions

#### 1. `quickbooks-oauth` (New)
Handles QuickBooks/Intuit OAuth 2.0 flow.

**Endpoints:**
- `POST /start` - Returns Intuit authorization URL with scopes for payroll
- `POST /callback` - Exchanges code for tokens, stores encrypted with `realm_id`
- `POST /disconnect` - Revokes tokens and clears connection
- `GET /status` - Returns connection status

**QuickBooks-Specific Details:**
- Requires scopes: `com.intuit.quickbooks.payroll`, `com.intuit.quickbooks.accounting`
- Must store `realm_id` (company identifier) alongside tokens
- Tokens expire after 1 hour (shorter than Gusto's 2 hours)
- Implements refresh token rotation (required by Intuit)

#### 2. `quickbooks-payroll-proxy` (New)
Proxies requests to QuickBooks Payroll API.

**Functionality:**
- Attaches bearer token to requests
- Auto-refreshes expired tokens (with rotation handling)
- Routes to `https://payroll.api.intuit.com/v1/...` or sandbox
- Maps internal employee IDs to QuickBooks employee references

---

### QuickBooks Payroll API Integration

QuickBooks Online Payroll provides these key endpoints:

| Endpoint | Purpose |
|----------|---------|
| `GET /payroll-runs` | List payroll history |
| `POST /payroll-runs` | Create new payroll run |
| `GET /payroll-runs/{id}` | Get payroll details |
| `POST /payroll-runs/{id}/submit` | Submit for processing |
| `GET /employees` | List employees in payroll |
| `GET /pay-schedules` | Get pay schedule configurations |

**Key Differences from Gusto:**
- QuickBooks uses `realm_id` instead of `company_uuid`
- Different webhook event format
- Tax document endpoints differ
- No embedded SDK (pure API integration)

---

### UI Components

#### 1. `PayrollProviderSelector.tsx` (New)

Initial selection screen when no provider is connected:

```text
+-----------------------------------------------+
|  Choose Your Payroll Provider                 |
|                                               |
|  +------------------+  +------------------+   |
|  |   [Gusto Logo]   |  | [QuickBooks Logo]|   |
|  |                  |  |                  |   |
|  |  Full-service    |  | Part of your     |   |
|  |  payroll with    |  | QuickBooks       |   |
|  |  compliance      |  | ecosystem        |   |
|  |                  |  |                  |   |
|  |  [Connect Gusto] |  | [Connect QB]     |   |
|  +------------------+  +------------------+   |
|                                               |
|  Note: Only one provider can be active        |
+-----------------------------------------------+
```

#### 2. `QuickBooksConnectionCard.tsx` (New)

Similar to `GustoConnectionCard` but with QuickBooks branding:

```text
+-----------------------------------------------+
|  Payroll Provider                             |
|                                               |
|  [QuickBooks Logo]  Connected                 |
|  Company: ABC Salon LLC                       |
|  Last synced: 30 minutes ago                  |
|                                               |
|  [Sync Now]  [Switch Provider]  [Disconnect]  |
+-----------------------------------------------+
```

**Switch Provider Flow**:
1. User clicks "Switch Provider"
2. Warning dialog: "This will disconnect QuickBooks. Existing payroll history will be preserved."
3. On confirm, disconnect current provider
4. Show provider selector again

#### 3. Update: `RunPayrollWizard.tsx`

Modify to detect active provider and route API calls accordingly:

```typescript
const { provider, connection } = usePayrollConnection();

// Route to appropriate edge function
const submitPayroll = async (data) => {
  const endpoint = provider === 'gusto' 
    ? 'gusto-payroll-proxy' 
    : 'quickbooks-payroll-proxy';
  
  await supabase.functions.invoke(endpoint, {
    body: { action: 'submit', ...data }
  });
};
```

---

### Unified Hook: `usePayrollConnection.ts`

Replaces separate `useGustoConnection` with provider-agnostic hook:

```typescript
interface PayrollConnection {
  id: string;
  provider: 'gusto' | 'quickbooks';
  status: 'connected' | 'pending' | 'disconnected' | 'error';
  companyName?: string;
  lastSyncedAt?: string;
}

export function usePayrollConnection() {
  // Fetches from payroll_connections table
  // Returns null if no provider connected
  // Provides connect/disconnect mutations
}
```

---

### Permissions & Access Control

**No changes needed** - existing payroll permissions apply to both providers:
- `manage_payroll` - Run payroll, connect providers
- `view_payroll_reports` - View history
- `manage_employee_compensation` - Edit pay settings

RLS policies will work unchanged since they're scoped to `organization_id`.

---

### Integration Registry Updates

Add to `IntegrationsTab.tsx` for account-level integrations:

```typescript
const payrollIntegrations: Integration[] = [
  {
    id: 'gusto',
    name: 'Gusto',
    description: 'Full-service payroll with tax compliance and HR.',
    icon: DollarSign,
    status: getPayrollStatus('gusto'),
    configPath: '/dashboard/admin/payroll',
    features: ['Automated Taxes', 'Direct Deposit', 'W-2s', 'Benefits'],
    available: true,
    category: 'payroll',
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks Payroll',
    description: 'Payroll integrated with QuickBooks accounting.',
    icon: Calculator,
    status: getPayrollStatus('quickbooks'),
    configPath: '/dashboard/admin/payroll',
    features: ['QuickBooks Sync', 'Direct Deposit', 'Tax Filing', 'Reports'],
    available: true,
    category: 'payroll',
  },
];
```

Both route to `/dashboard/admin/payroll` where the appropriate UI is shown based on connection state.

---

### Implementation Phases

**Phase 1: Schema Refactor**
- Migrate `gusto_connections` to `payroll_connections` with `provider` column
- Update RLS policies
- Add QuickBooks-specific metadata handling

**Phase 2: QuickBooks OAuth**
- Create `quickbooks-oauth` edge function
- Implement token rotation for Intuit's requirements
- Create connection status card

**Phase 3: QuickBooks Payroll API**
- Create `quickbooks-payroll-proxy` edge function
- Map QuickBooks employee sync
- Implement payroll submission flow

**Phase 4: Unified UI**
- Create provider selector component
- Update payroll wizard for multi-provider support
- Update integrations tab

---

### Secrets Required

Add to existing secrets (Gusto secrets already planned):

| Secret Name | Description |
|-------------|-------------|
| `QUICKBOOKS_CLIENT_ID` | Intuit OAuth client ID |
| `QUICKBOOKS_CLIENT_SECRET` | Intuit OAuth client secret |
| `QUICKBOOKS_ENCRYPTION_KEY` | Can share with Gusto or separate |

---

### Files to Create/Modify

| File | Action |
|------|--------|
| Database migration | **New** - Rename table, add provider enum |
| `supabase/functions/quickbooks-oauth/index.ts` | **New** |
| `supabase/functions/quickbooks-payroll-proxy/index.ts` | **New** |
| `supabase/functions/gusto-oauth/index.ts` | **New** |
| `supabase/functions/gusto-payroll-proxy/index.ts` | **New** |
| `src/hooks/usePayrollConnection.ts` | **New** - Unified hook |
| `src/hooks/usePayroll.ts` | **New** - Payroll operations |
| `src/pages/dashboard/admin/Payroll.tsx` | **New** - Main payroll hub |
| `src/components/dashboard/payroll/PayrollProviderSelector.tsx` | **New** |
| `src/components/dashboard/payroll/GustoConnectionCard.tsx` | **New** |
| `src/components/dashboard/payroll/QuickBooksConnectionCard.tsx` | **New** |
| `src/components/dashboard/payroll/RunPayrollWizard.tsx` | **New** |
| `src/components/dashboard/payroll/PayrollHistoryTable.tsx` | **New** |
| `src/components/dashboard/payroll/EmployeePayrollList.tsx` | **New** |
| `src/components/dashboard/IntegrationsTab.tsx` | **Edit** - Add payroll section |
| `src/components/dashboard/DashboardLayout.tsx` | **Edit** - Add payroll nav |
| `src/App.tsx` | **Edit** - Add payroll routes |
| `supabase/config.toml` | **Edit** - Register new functions |

---

### Technical Notes

1. **Provider Lock**: Only one provider active per organization prevents sync conflicts

2. **Data Portability**: When switching providers, employee pay settings are preserved locally; only external IDs are cleared

3. **Commission Integration**: Works identically for both providers - calculated from Phorest data before submission

4. **QuickBooks Sandbox**: Use `https://sandbox-payroll.api.intuit.com` for development

5. **Token Rotation**: Intuit requires rotating refresh tokens - each refresh returns a new refresh token

6. **Accounting Integration**: QuickBooks payroll can optionally sync journal entries to QuickBooks accounting (future enhancement)

