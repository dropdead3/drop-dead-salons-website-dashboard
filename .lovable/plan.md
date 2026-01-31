
# Independent Stylist / Booth Renter Management System

## Overview
Build a comprehensive booth rental management system that allows salons to manage independent stylists who rent chairs/spaces in their business. This includes contract management via PandaDoc, rent payment tracking, onboarding workflows, retail commission structures, and dedicated revenue analytics.

---

## System Architecture

### Database Schema

#### 1. Add New Role: `booth_renter`
Extend the existing `app_role` enum to include the independent stylist role.

```sql
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'booth_renter';
```

Update `public.roles` table with display metadata:
```sql
INSERT INTO public.roles (name, display_name, description, color, icon, sort_order, is_system)
VALUES ('booth_renter', 'Booth Renter', 'Independent stylist renting space', 'orange', 'Store', 7, true);
```

#### 2. Booth Renter Profiles Table
Extends employee_profiles with renter-specific details.

```sql
CREATE TABLE public.booth_renter_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Business Info
  business_name TEXT,
  business_license_number TEXT,
  license_state TEXT,
  ein_number TEXT, -- For 1099 purposes
  
  -- Contact
  billing_email TEXT,
  billing_phone TEXT,
  billing_address JSONB, -- {street, city, state, zip}
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'terminated')),
  onboarding_complete BOOLEAN DEFAULT false,
  
  -- Dates
  start_date DATE,
  end_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, organization_id)
);
```

#### 3. Booth Rental Contracts Table
Track rental agreements linked to PandaDoc.

```sql
CREATE TABLE public.booth_rental_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  booth_renter_id UUID NOT NULL REFERENCES booth_renter_profiles(id) ON DELETE CASCADE,
  
  -- Contract Details
  contract_name TEXT NOT NULL,
  contract_type TEXT DEFAULT 'standard' CHECK (contract_type IN ('standard', 'month_to_month', 'annual')),
  
  -- PandaDoc Integration
  pandadoc_document_id TEXT,
  pandadoc_status TEXT DEFAULT 'draft' CHECK (pandadoc_status IN ('draft', 'sent', 'viewed', 'completed', 'voided', 'declined')),
  document_url TEXT,
  signed_at TIMESTAMPTZ,
  
  -- Terms
  start_date DATE NOT NULL,
  end_date DATE,
  auto_renew BOOLEAN DEFAULT true,
  notice_period_days INTEGER DEFAULT 30,
  
  -- Rent Configuration
  rent_amount DECIMAL(10,2) NOT NULL,
  rent_frequency TEXT NOT NULL CHECK (rent_frequency IN ('weekly', 'monthly')),
  due_day_of_week INTEGER, -- 0=Sunday, for weekly
  due_day_of_month INTEGER, -- 1-28, for monthly
  
  -- Additional Terms
  security_deposit DECIMAL(10,2) DEFAULT 0,
  security_deposit_paid BOOLEAN DEFAULT false,
  includes_utilities BOOLEAN DEFAULT true,
  includes_wifi BOOLEAN DEFAULT true,
  includes_products BOOLEAN DEFAULT false,
  additional_terms JSONB, -- Flexible storage for custom terms
  
  -- Retail Commission
  retail_commission_enabled BOOLEAN DEFAULT true,
  retail_commission_rate DECIMAL(5,4) DEFAULT 0.10, -- 10% default
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_signature', 'active', 'expired', 'terminated')),
  terminated_at TIMESTAMPTZ,
  termination_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 4. Rent Payments Table
Track individual rent payments.

```sql
CREATE TABLE public.rent_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  booth_renter_id UUID NOT NULL REFERENCES booth_renter_profiles(id),
  contract_id UUID NOT NULL REFERENCES booth_rental_contracts(id),
  
  -- Payment Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  due_date DATE NOT NULL,
  
  -- Amounts
  base_rent DECIMAL(10,2) NOT NULL,
  late_fee DECIMAL(10,2) DEFAULT 0,
  credits_applied DECIMAL(10,2) DEFAULT 0,
  adjustments DECIMAL(10,2) DEFAULT 0,
  adjustment_notes TEXT,
  total_due DECIMAL(10,2) GENERATED ALWAYS AS (base_rent + late_fee - credits_applied + adjustments) STORED,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  balance DECIMAL(10,2) GENERATED ALWAYS AS (base_rent + late_fee - credits_applied + adjustments - amount_paid) STORED,
  
  -- Payment Details
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue', 'waived')),
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  stripe_payment_intent_id TEXT,
  stripe_invoice_id TEXT,
  
  -- Auto-pay
  autopay_scheduled BOOLEAN DEFAULT false,
  autopay_attempted_at TIMESTAMPTZ,
  autopay_failed_reason TEXT,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 5. Renter Auto-Pay Settings Table
Store payment method and autopay preferences.

```sql
CREATE TABLE public.renter_payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booth_renter_id UUID NOT NULL REFERENCES booth_renter_profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Stripe Connect
  stripe_customer_id TEXT,
  stripe_payment_method_id TEXT,
  payment_method_last_four TEXT,
  payment_method_brand TEXT, -- visa, mastercard, etc.
  payment_method_type TEXT, -- card, bank_account
  
  -- Auto-pay settings
  autopay_enabled BOOLEAN DEFAULT false,
  autopay_days_before_due INTEGER DEFAULT 0, -- 0 = on due date
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(booth_renter_id)
);
```

#### 6. Retail Commission Tracking Table
Track retail sales commissions for booth renters.

```sql
CREATE TABLE public.renter_retail_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  booth_renter_id UUID NOT NULL REFERENCES booth_renter_profiles(id),
  
  -- Sale Reference
  retail_sale_id UUID, -- Link to retail_sales if applicable
  sale_date DATE NOT NULL,
  
  -- Commission Details
  sale_amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,4) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  
  -- Payout
  payout_status TEXT DEFAULT 'pending' CHECK (payout_status IN ('pending', 'included_in_statement', 'paid')),
  payout_date DATE,
  payout_reference TEXT,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 7. Renter Onboarding Tasks Table
Track renter-specific onboarding checklist.

```sql
CREATE TABLE public.renter_onboarding_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT DEFAULT 'action' CHECK (task_type IN ('action', 'document', 'form', 'acknowledgment')),
  required BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- Optional link/action
  link_url TEXT,
  form_template_id UUID,
  document_template_id TEXT, -- PandaDoc template ID
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.renter_onboarding_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booth_renter_id UUID NOT NULL REFERENCES booth_renter_profiles(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES renter_onboarding_tasks(id) ON DELETE CASCADE,
  
  completed_at TIMESTAMPTZ DEFAULT now(),
  completed_data JSONB, -- Any data collected
  
  UNIQUE(booth_renter_id, task_id)
);
```

---

## File Structure

```
src/
├── components/dashboard/booth-renters/
│   ├── BoothRentersList.tsx               # Main list view
│   ├── BoothRenterCard.tsx                # Summary card
│   ├── BoothRenterDetailSheet.tsx         # Full profile slide-out
│   ├── BoothRenterForm.tsx                # Add/edit form
│   ├── RentalContractForm.tsx             # Contract creation
│   ├── RentalContractCard.tsx             # Contract display
│   ├── RentPaymentTracker.tsx             # Payment status grid
│   ├── RentPaymentDialog.tsx              # Record payment
│   ├── AutoPaySetupDialog.tsx             # Configure autopay
│   ├── RenterOnboardingChecklist.tsx      # Onboarding progress
│   ├── RenterRetailCommissions.tsx        # Commission tracking
│   └── IssueContractDialog.tsx            # PandaDoc contract issuance
├── components/dashboard/analytics/
│   └── RentRevenueAnalytics.tsx           # Rent revenue dashboard
├── hooks/
│   ├── useBoothRenters.ts                 # Renter CRUD
│   ├── useRentalContracts.ts              # Contract management
│   ├── useRentPayments.ts                 # Payment tracking
│   ├── useRenterPaymentSettings.ts        # Auto-pay configuration
│   ├── useRenterOnboarding.ts             # Onboarding tasks
│   ├── useRenterRetailCommissions.ts      # Commission tracking
│   └── useRentRevenueAnalytics.ts         # Analytics aggregation
├── pages/dashboard/admin/
│   ├── BoothRenters.tsx                   # Main management page
│   └── RentPayments.tsx                   # Payment tracker page
└── supabase/functions/
    ├── process-rent-payments/index.ts     # Auto-pay processing cron
    └── generate-rent-invoices/index.ts    # Invoice generation cron
```

---

## Implementation Phases

### Phase 1: Database & Role Setup
1. **Migration**: Add `booth_renter` role to enum
2. **Tables**: Create all renter-related tables with RLS
3. **Permissions**: Add granular permissions
   - `manage_booth_renters` - Full CRUD access
   - `view_booth_renters` - Read-only access
   - `view_rent_payments` - See payment history
   - `manage_rent_payments` - Record payments
   - `view_rent_analytics` - See rent revenue analytics

### Phase 2: Booth Renter Management UI
**Location**: `/dashboard/admin/booth-renters`

**Features**:
- List all booth renters with status filters
- Add new renter (creates user account with booth_renter role)
- View/edit renter profile and business info
- Track active contracts and payment status

```
┌──────────────────────────────────────────────────────────────────────────┐
│ BOOTH RENTERS                                                            │
│ Manage independent stylists renting space                                │
├──────────────────────────────────────────────────────────────────────────┤
│ [+ Add Renter]  [Filter: All ▼]  [Search...]                            │
│                                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ 🟢 Sarah Martinez                                                   │ │
│ │ Martinez Style Co.                                                  │ │
│ │ Rent: $800/mo • Due: 1st • Status: Current                         │ │
│ │ Contract: Active until Dec 31, 2026                                 │ │
│ │ [View] [Contract] [Payments]                                        │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ 🟡 James Chen                                                       │ │
│ │ JC Hair Studio                                                      │ │
│ │ Rent: $200/wk • Due: Monday • Status: Payment Due                  │ │
│ │ Contract: Month-to-month                                            │ │
│ │ [View] [Contract] [Payments]                                        │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

### Phase 3: Contract Management with PandaDoc
**Features**:
- Create contracts from templates
- Issue via PandaDoc integration
- Track signature status
- Auto-apply terms to billing on completion

**Contract Issuance Flow**:
1. Admin selects renter and chooses "Issue Contract"
2. Select PandaDoc template or create custom
3. Pre-fill fields from renter profile
4. Send for signature via PandaDoc API
5. Webhook updates status and extracts terms
6. Contract becomes active on completion

```
┌────────────────────────────────────────────────────────────────┐
│ ISSUE RENTAL CONTRACT                                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ Renter: Sarah Martinez                                         │
│                                                                │
│ CONTRACT TEMPLATE                                              │
│ [Standard Booth Rental Agreement ▼]                           │
│                                                                │
│ ─────────────────────────────────────────────────────────     │
│                                                                │
│ RENT CONFIGURATION                                             │
│ Frequency: (•) Monthly  ( ) Weekly                            │
│ Amount: [$800.00    ]                                         │
│ Due Day: [1st of month ▼]                                     │
│                                                                │
│ ─────────────────────────────────────────────────────────     │
│                                                                │
│ CONTRACT TERM                                                  │
│ Start Date: [Feb 1, 2026 ▼]                                   │
│ End Date:   [Jan 31, 2027 ▼]  ☑ Auto-renew                   │
│                                                                │
│ ─────────────────────────────────────────────────────────     │
│                                                                │
│ RETAIL COMMISSION                                              │
│ ☑ Enable retail product sales commission                      │
│ Rate: [10] %                                                  │
│                                                                │
│ ADDITIONAL INCLUSIONS                                          │
│ ☑ Utilities  ☑ WiFi  ☐ Products                              │
│                                                                │
│ Security Deposit: [$800.00    ]                               │
│                                                                │
│                      [Cancel]  [Issue via PandaDoc →]         │
└────────────────────────────────────────────────────────────────┘
```

### Phase 4: Rent Payment Tracking
**Location**: `/dashboard/admin/rent-payments`

**Features**:
- Calendar/grid view of upcoming payments
- Filter by status (pending, overdue, paid)
- Record manual payments
- View payment history per renter
- Late fee management

```
┌──────────────────────────────────────────────────────────────────────────┐
│ RENT PAYMENT TRACKER                       [February 2026 ◀ ▶]          │
│ [Weekly ▼] [All Locations ▼]                                            │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Renter              │ Due Date  │ Amount   │ Status    │ Actions       │
│ ─────────────────────┼───────────┼──────────┼───────────┼─────────────  │
│  Sarah Martinez      │ Feb 1     │ $800.00  │ 🟢 Paid   │ [Receipt]     │
│  James Chen          │ Feb 3     │ $200.00  │ 🔴 Overdue│ [Record Pay]  │
│  Alex Rivera         │ Feb 5     │ $150.00  │ 🟡 Pending│ [Record Pay]  │
│  Maria Thompson      │ Feb 10    │ $200.00  │ ⏰ Autopay│ [Details]     │
│                                                                          │
│ ─────────────────────────────────────────────────────────────────────── │
│ SUMMARY                                                                  │
│ Total Due: $1,350.00  │  Collected: $800.00  │  Outstanding: $550.00    │
└──────────────────────────────────────────────────────────────────────────┘
```

### Phase 5: Auto-Pay System
**Features**:
- Renters can set up payment methods (Stripe Connect)
- Configure autopay on/before due date
- Automatic processing via edge function cron
- Failed payment notifications

**Edge Function**: `process-rent-payments`
- Runs daily at 00:05 UTC
- Queries payments with `autopay_scheduled = true` and `due_date <= today`
- Charges via Stripe
- Updates payment status
- Sends confirmation/failure notifications

### Phase 6: Onboarding for Booth Renters
**Features**:
- Configurable onboarding task list for renters
- Different from employee onboarding (no training modules)
- Focus on: contracts, tax forms, policies, keys/access

**Default Renter Onboarding Tasks**:
1. ☐ Sign Booth Rental Agreement (PandaDoc)
2. ☐ Submit W-9 Form
3. ☐ Provide Proof of Liability Insurance
4. ☐ Read & Acknowledge Salon Policies
5. ☐ Complete Payment Setup
6. ☐ Key/Access Card Assignment

### Phase 7: Retail Commission Tracking
**Features**:
- Booth renters can sell salon retail products
- Configurable commission rate per contract
- Track sales attributed to renter
- Generate commission statements

**Integration Points**:
- Extend `RetailSales` to capture `sold_by_booth_renter_id`
- Calculate commission on product sales only (not services)
- Exclude from standard commission tier calculations

### Phase 8: Rent Revenue Analytics
**Location**: Analytics Hub > New "Rent" tab (Super Admin only)

**Metrics**:
- Total Rent Revenue (MTD/YTD)
- Collection Rate (% of due amount collected)
- Overdue Amounts
- Occupancy Rate (if tracking stations)
- Revenue by Renter
- Payment Trend (12-month chart)

```
┌────────────────────────────────────────────────────────────────────────┐
│ RENT REVENUE ANALYTICS                          [Last 12 Months ▼]    │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────────────┐ │
│ │ $9,600      │ │ $115,200    │ │ 96%         │ │ $350             │ │
│ │ Monthly     │ │ Annual      │ │ Collection  │ │ Overdue          │ │
│ │ Rent Rev    │ │ Rent Rev    │ │ Rate        │ │ Balance          │ │
│ │ ↑ 5%        │ │ ↑ 12%       │ │ ↓ 2%        │ │ 2 renters        │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └──────────────────┘ │
│                                                                        │
│ RENT COLLECTION TREND                                                  │
│ ┌───────────────────────────────────────────────────────────────────┐│
│ │     ▲                                                             ││
│ │    ╱╲    ╱╲       ╱╲                                             ││
│ │   ╱  ╲  ╱  ╲  ━━╱  ╲━━━━━━━━━━━━━━━                             ││
│ │  ╱    ╲╱    ╲╱      ╲                                            ││
│ │ ╱                    ╲                                           ││
│ │Mar Apr May Jun Jul Aug Sep Oct Nov Dec Jan Feb                   ││
│ └───────────────────────────────────────────────────────────────────┘│
│                                                                        │
│ BY RENTER                                                              │
│ ┌────────────────────────────────────────────────────────────────────┐│
│ │ Renter          │ Monthly Rate │ Collected │ Outstanding │ Status ││
│ │ Sarah Martinez  │ $800         │ $9,600    │ $0          │ 🟢     ││
│ │ James Chen      │ $800 (wk)    │ $3,400    │ $200        │ 🔴     ││
│ │ Alex Rivera     │ $600 (wk)    │ $2,550    │ $150        │ 🟡     ││
│ └────────────────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────────────┘
```

---

## Key Enhancements & Suggestions

### 1. Station/Chair Assignment
- Track which physical station each renter occupies
- Support multiple stations per renter
- Station availability calendar view

### 2. Renter Portal (Self-Service)
- Dedicated dashboard for booth renters
- View/pay rent invoices
- Update payment methods
- View commission statements
- Download tax documents (1099)

### 3. Prorated Rent Calculations
- Auto-calculate prorated amounts for mid-month starts
- Handle rent increases with proper proration

### 4. Late Fee Automation
- Configurable grace period (e.g., 5 days)
- Auto-apply late fees after grace period
- Flat fee or percentage options

### 5. Rent Increase Management
- Schedule future rent increases
- Notification system for upcoming changes
- Audit trail of rate changes

### 6. Amenity Billing Add-ons
- Track additional charges (extra products, supplies)
- Add to monthly statement

### 7. Commission Statements
- Generate monthly/quarterly commission statements
- PDF export for renter records
- Track commission payouts

### 8. 1099 Preparation
- Aggregate annual payments for 1099-MISC
- Export data for tax filing
- Renter W-9 collection and storage

### 9. Insurance Expiration Tracking
- Store liability insurance details
- Alert before expiration
- Require updated proof of insurance

### 10. Multi-Location Rent Management
- Renters can rent at multiple locations
- Separate contracts per location
- Consolidated statements optional

---

## Permissions & Role Integration

| Permission | Super Admin | Admin | Manager | Booth Renter |
|------------|-------------|-------|---------|--------------|
| `manage_booth_renters` | ✅ | ✅ | ✅ | ❌ |
| `view_booth_renters` | ✅ | ✅ | ✅ | Self only |
| `manage_rent_payments` | ✅ | ✅ | ✅ | ❌ |
| `view_rent_payments` | ✅ | ✅ | ✅ | Self only |
| `view_rent_analytics` | ✅ | ❌ | ❌ | ❌ |
| `issue_renter_contracts` | ✅ | ✅ | ❌ | ❌ |
| `configure_renter_autopay` | ✅ | ✅ | ❌ | Self only |

---

## Edge Functions

### 1. `generate-rent-invoices`
Scheduled: 1st of each month at 00:00 UTC
- Creates rent_payments records for the upcoming period
- Calculates due dates based on contract terms
- Handles weekly vs monthly frequencies

### 2. `process-rent-payments`
Scheduled: Daily at 06:00 UTC
- Processes autopay for due/overdue payments
- Charges Stripe payment methods
- Updates payment status
- Sends confirmation emails
- Logs failures for admin review

### 3. `check-late-payments`
Scheduled: Daily at 00:05 UTC
- Marks overdue payments
- Applies late fees after grace period
- Sends reminder notifications

---

## Files to Create/Modify

| Action | File | Description |
|--------|------|-------------|
| **Create** | Migration | Add booth_renter role, all new tables, RLS, permissions |
| **Create** | `src/hooks/useBoothRenters.ts` | Renter profile CRUD |
| **Create** | `src/hooks/useRentalContracts.ts` | Contract management |
| **Create** | `src/hooks/useRentPayments.ts` | Payment tracking |
| **Create** | `src/hooks/useRenterPaymentSettings.ts` | Autopay configuration |
| **Create** | `src/hooks/useRenterOnboarding.ts` | Onboarding tasks |
| **Create** | `src/hooks/useRenterRetailCommissions.ts` | Commission tracking |
| **Create** | `src/hooks/useRentRevenueAnalytics.ts` | Analytics queries |
| **Create** | `src/pages/dashboard/admin/BoothRenters.tsx` | Main management page |
| **Create** | `src/pages/dashboard/admin/RentPayments.tsx` | Payment tracker page |
| **Create** | `src/components/dashboard/booth-renters/*.tsx` | All UI components |
| **Create** | `src/components/dashboard/analytics/RentRevenueAnalytics.tsx` | Analytics panel |
| **Create** | `supabase/functions/generate-rent-invoices/index.ts` | Invoice generation |
| **Create** | `supabase/functions/process-rent-payments/index.ts` | Autopay processing |
| **Create** | `supabase/functions/check-late-payments/index.ts` | Late fee automation |
| **Modify** | `src/hooks/useUserRoles.ts` | Add booth_renter to ALL_ROLES |
| **Modify** | `src/hooks/useRoleUtils.ts` | Add booth_renter color/icon |
| **Modify** | `src/hooks/useRetailSales.ts` | Add booth renter commission tracking |
| **Modify** | `src/pages/dashboard/admin/AnalyticsHub.tsx` | Add Rent tab |
| **Modify** | Sidebar configuration | Add booth renter navigation |

---

## Technical Considerations

- **RLS Policies**: Organization-scoped access for all tables, self-access for booth renters
- **Stripe Connect**: Use platform's Stripe account for collecting rent (no separate accounts needed)
- **PandaDoc Templates**: Create reusable templates for standard rental agreements
- **Audit Trail**: Log all contract changes and payment adjustments
- **Timezone Handling**: Use organization timezone for due date calculations
- **Generated Columns**: Use Postgres computed columns for balance calculations

---

## Edge Cases

- **Mid-period Contract Start**: Prorate first payment
- **Early Termination**: Calculate final settlement, return deposits
- **Rent Increases**: Schedule in advance, notify renter
- **Disputed Payments**: Track dispute status, exclude from collection metrics
- **Multiple Contracts**: Handle transition between contract terms
- **Partial Payments**: Allow installment tracking
- **Commission on Returns**: Deduct from future commissions
