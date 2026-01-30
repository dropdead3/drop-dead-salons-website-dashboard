

## Native Payroll System with Gusto Integration

This plan implements a complete payroll solution for account owners using **Gusto Embedded Payroll**, enabling secure bank connections, automated payroll runs, tax compliance, and comprehensive reporting.

---

### Overview

Gusto handles the complex regulatory requirements (taxes, W-2s, compliance) while your platform provides the user interface and organization-specific context. Account owners will:

1. **Connect their business** to Gusto via OAuth
2. **Onboard employees** through embedded Gusto components
3. **Run payroll** with commission calculations from existing sales data
4. **Access reports** for payroll history, tax documents, and analytics

---

### Architecture

```text
+------------------+       +-------------------+       +----------------+
|  Account Owner   | ----> |   Your Platform   | ----> |   Gusto API    |
|   Dashboard      |       |   (Edge Function  |       | (OAuth + REST) |
+------------------+       |    Proxy Layer)   |       +----------------+
                           +-------------------+
                                    |
                           +-------------------+
                           |   Supabase DB     |
                           | gusto_connections |
                           | payroll_runs      |
                           | employee_payroll  |
                           +-------------------+
```

**Key Components:**
- **OAuth Proxy Edge Function**: Handles Gusto OAuth flow securely
- **Payroll Proxy Edge Function**: Routes Embedded SDK requests with proper tokens
- **Token Storage**: Encrypted company tokens in `gusto_connections` table
- **Embedded React SDK**: Gusto's UI components for payroll operations

---

### Changes Summary

| Area | Files | Action |
|------|-------|--------|
| Database | Migration | **Create** - `gusto_connections`, `payroll_runs`, `employee_payroll_settings` tables |
| Edge Functions | `gusto-oauth`, `gusto-payroll-proxy` | **Create** - Handle OAuth and API proxy |
| Hooks | `useGustoConnection.ts`, `usePayroll.ts` | **Create** - Manage Gusto connection state |
| Pages | `Payroll.tsx`, `PayrollSettings.tsx`, `PayrollReports.tsx` | **Create** - Owner dashboard pages |
| Components | `src/components/dashboard/payroll/` | **Create** - Connection status, run payroll, reports |
| Settings | Admin Settings | **Edit** - Add payroll configuration section |
| Config | Platform Integrations | **Edit** - Add Gusto as available integration |

---

### Database Schema

#### Table: `gusto_connections`
Stores the OAuth tokens per organization (one Gusto company per organization).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `organization_id` | UUID | FK to `organizations` |
| `gusto_company_uuid` | TEXT | Gusto's company identifier |
| `access_token_encrypted` | TEXT | AES-encrypted access token |
| `refresh_token_encrypted` | TEXT | AES-encrypted refresh token |
| `token_expires_at` | TIMESTAMPTZ | Token expiration (2 hours from issue) |
| `connection_status` | TEXT | `pending`, `connected`, `disconnected`, `error` |
| `connected_by` | UUID | User who connected |
| `connected_at` | TIMESTAMPTZ | When connection was established |
| `last_synced_at` | TIMESTAMPTZ | Last successful API call |

#### Table: `payroll_runs`
Local record of payroll runs for reporting and audit.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `organization_id` | UUID | FK to `organizations` |
| `gusto_payroll_uuid` | TEXT | Gusto's payroll identifier |
| `pay_period_start` | DATE | Start of pay period |
| `pay_period_end` | DATE | End of pay period |
| `check_date` | DATE | When employees are paid |
| `status` | TEXT | `draft`, `submitted`, `processed`, `cancelled` |
| `total_gross_pay` | NUMERIC | Sum of all gross pay |
| `total_employer_taxes` | NUMERIC | Employer tax obligations |
| `total_employee_deductions` | NUMERIC | Employee deductions |
| `total_net_pay` | NUMERIC | Sum of all net pay |
| `employee_count` | INTEGER | Employees in this run |
| `submitted_by` | UUID | Who submitted the payroll |
| `submitted_at` | TIMESTAMPTZ | When payroll was submitted |

#### Table: `employee_payroll_settings`
Per-employee payroll configuration (extends `employee_profiles`).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `employee_id` | UUID | FK to `employee_profiles.user_id` |
| `organization_id` | UUID | FK to `organizations` |
| `gusto_employee_uuid` | TEXT | Gusto's employee identifier |
| `pay_type` | TEXT | `hourly`, `salary`, `commission` |
| `hourly_rate` | NUMERIC | If hourly |
| `salary_amount` | NUMERIC | If salaried (annual) |
| `commission_enabled` | BOOLEAN | Use commission tiers |
| `direct_deposit_status` | TEXT | `not_started`, `pending`, `verified` |
| `is_payroll_active` | BOOLEAN | Include in payroll runs |

---

### Edge Functions

#### 1. `gusto-oauth` (New)
Handles the complete OAuth flow with Gusto.

**Endpoints:**
- `POST /start` - Initiates OAuth, returns authorization URL
- `POST /callback` - Exchanges code for tokens, stores encrypted
- `POST /disconnect` - Revokes access and clears tokens
- `GET /status` - Returns connection status for an organization

**Security:**
- Tokens encrypted at rest using Supabase Vault
- CSRF protection via `state` parameter
- Only `super_admin` or org `owner` can initiate

#### 2. `gusto-payroll-proxy` (New)
Proxies requests from the Gusto Embedded SDK.

**Functionality:**
- Attaches bearer token to outgoing requests
- Auto-refreshes expired tokens
- Logs API calls for audit
- Sanitizes responses for security

---

### UI Components

#### Payroll Dashboard Tab
New admin section accessible to `super_admin` and organization `owner` roles.

**Location:** `/dashboard/admin/payroll`

**Sub-sections:**

| Tab | Description |
|-----|-------------|
| **Run Payroll** | Start a new payroll, review hours/commissions, submit |
| **History** | List of past payroll runs with status and totals |
| **Employees** | Employee payroll settings, direct deposit status |
| **Reports** | Tax documents, YTD summaries, export to CSV |
| **Settings** | Gusto connection, pay schedules, defaults |

#### Component: `GustoConnectionCard`
Shows connection status with actions to connect/disconnect.

```text
+-----------------------------------------------+
|  🏦 Payroll Connection                        |
|                                               |
|  [Gusto Logo]  Connected ✓                    |
|  Last synced: 2 hours ago                     |
|                                               |
|  [Sync Now]  [Disconnect]                     |
+-----------------------------------------------+
```

#### Component: `RunPayrollWizard`
Step-by-step payroll submission flow.

**Steps:**
1. **Select Pay Period** - Choose period and check date
2. **Review Hours** - Import/confirm hours worked per employee
3. **Add Commissions** - Auto-calculate from `phorest_performance_metrics`
4. **Review Totals** - Show gross, taxes, net per employee
5. **Submit** - Confirm and submit to Gusto

#### Component: `PayrollHistoryTable`
Sortable/filterable table of past payrolls.

| Column | Description |
|--------|-------------|
| Pay Period | Date range |
| Check Date | Payment date |
| Employees | Count |
| Gross Pay | Total gross |
| Net Pay | Total net |
| Status | Badge |
| Actions | View details, download summary |

#### Component: `EmployeePayrollList`
Shows each employee's payroll setup status.

- Direct deposit status indicator
- Pay type badge
- Last paid amount
- Link to Gusto's embedded onboarding for missing info

---

### Permissions & Access Control

**Who can access payroll:**
- `super_admin` - Full access to all payroll features
- Organization `owner` (from `organization_admins` table) - Full access
- `admin` role - View-only access to reports (configurable)

**RLS Policies:**
- All payroll tables scoped to `organization_id`
- Only org admins/owners can read/write their org's data
- Platform users (`platform_owner`, `platform_admin`) can view for support

**New Permissions:**
- `manage_payroll` - Run payroll, manage settings
- `view_payroll_reports` - View historical data (no submission rights)
- `manage_employee_compensation` - Edit pay rates and settings

---

### Commission Integration

Leverage existing `phorest_performance_metrics` and `phorest_daily_sales_summary` data:

1. When running payroll, fetch sales data for the pay period
2. Apply `commission_tiers` to calculate commission amounts per employee
3. Pre-populate the payroll run with calculated commissions
4. Allow manual adjustments before submission

**Commission Calculation Logic:**
```typescript
// Fetch employee sales for pay period
const sales = await fetchEmployeeSales(employeeId, periodStart, periodEnd);

// Get applicable commission tiers
const serviceSales = sales.filter(s => s.type === 'service');
const productSales = sales.filter(s => s.type === 'product');

// Calculate based on existing commission_tiers table
const serviceCommission = calculateTieredCommission(serviceSales.total, serviceTiers);
const productCommission = calculateTieredCommission(productSales.total, productTiers);

return serviceCommission + productCommission;
```

---

### Implementation Phases

**Phase 1: Foundation**
- Database tables and RLS policies
- Gusto OAuth edge function
- Connection status UI
- Add payroll nav items

**Phase 2: Employee Sync**
- Employee payroll settings table
- Sync employees with Gusto
- Direct deposit status tracking
- Employee payroll list component

**Phase 3: Run Payroll**
- Payroll proxy edge function
- Run payroll wizard
- Commission calculation integration
- Submit to Gusto

**Phase 4: Reporting**
- Payroll history table
- YTD summaries
- Tax document links (W-2s)
- Export functionality

---

### Secrets Required

The following API credentials will need to be configured:

| Secret Name | Description |
|-------------|-------------|
| `GUSTO_CLIENT_ID` | OAuth client ID from Gusto Partner Portal |
| `GUSTO_CLIENT_SECRET` | OAuth client secret |
| `GUSTO_ENCRYPTION_KEY` | AES key for encrypting tokens at rest |

---

### Files to Create/Modify

| File | Action |
|------|--------|
| Database migration | **New** - Create payroll tables |
| `supabase/functions/gusto-oauth/index.ts` | **New** - OAuth handler |
| `supabase/functions/gusto-payroll-proxy/index.ts` | **New** - API proxy |
| `src/hooks/useGustoConnection.ts` | **New** - Connection state |
| `src/hooks/usePayroll.ts` | **New** - Payroll operations |
| `src/hooks/useEmployeePayroll.ts` | **New** - Employee settings |
| `src/pages/dashboard/admin/Payroll.tsx` | **New** - Main payroll page |
| `src/components/dashboard/payroll/GustoConnectionCard.tsx` | **New** |
| `src/components/dashboard/payroll/RunPayrollWizard.tsx` | **New** |
| `src/components/dashboard/payroll/PayrollHistoryTable.tsx` | **New** |
| `src/components/dashboard/payroll/EmployeePayrollList.tsx` | **New** |
| `src/components/dashboard/payroll/PayrollReportsTab.tsx` | **New** |
| `src/components/dashboard/payroll/CommissionPreview.tsx` | **New** |
| `src/components/dashboard/DashboardLayout.tsx` | **Edit** - Add payroll nav |
| `src/App.tsx` | **Edit** - Add routes |
| `src/config/platformIntegrations.ts` | **Edit** - Add Gusto |

---

### Technical Notes

1. **Token Security**: All Gusto tokens stored encrypted; decryption happens only in edge functions

2. **Multi-Tenant Isolation**: Each organization has its own Gusto company connection; tokens are never shared

3. **Gusto Sandbox**: Development will use Gusto's sandbox environment for testing

4. **Webhook Support** (Future): Gusto can send webhooks for payroll events; infrastructure prepared for this

5. **Embedded SDK**: The `@gusto/embedded-react-sdk` provides pre-built UI components that we'll wrap with your platform's styling

6. **Commission Sync**: Payroll calculations will pull from existing sales/performance data, ensuring consistency with displayed stats

