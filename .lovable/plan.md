
# Comprehensive Enhancements Implementation Plan

## Overview
This plan implements 20+ enhancements across the Booth Renter Management and Promotions/Vouchers systems. The implementation is organized into 6 phases, each building on the previous, with clear dependencies and testing points.

---

## Phase 1: Database & Infrastructure Extensions

### 1.1 Booth Renter System Extensions

**New Tables/Columns:**
```sql
-- Station/Chair Assignment
CREATE TABLE public.rental_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  location_id TEXT NOT NULL,
  station_name TEXT NOT NULL,
  station_number INTEGER,
  station_type TEXT DEFAULT 'chair' CHECK (station_type IN ('chair', 'booth', 'suite', 'room')),
  is_available BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Station assignments to renters
CREATE TABLE public.station_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID NOT NULL REFERENCES rental_stations(id),
  booth_renter_id UUID NOT NULL REFERENCES booth_renter_profiles(id),
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(station_id, booth_renter_id, assigned_date)
);

-- Insurance tracking
ALTER TABLE public.booth_renter_profiles ADD COLUMN IF NOT EXISTS
  insurance_provider TEXT,
  insurance_policy_number TEXT,
  insurance_expiry_date DATE,
  insurance_verified BOOLEAN DEFAULT false,
  insurance_document_url TEXT;

-- Rent increase scheduling
CREATE TABLE public.scheduled_rent_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES booth_rental_contracts(id),
  new_rent_amount DECIMAL(10,2) NOT NULL,
  effective_date DATE NOT NULL,
  notification_sent BOOLEAN DEFAULT false,
  applied BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Late fee configuration
CREATE TABLE public.rent_late_fee_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  grace_period_days INTEGER DEFAULT 5,
  late_fee_type TEXT DEFAULT 'flat' CHECK (late_fee_type IN ('flat', 'percentage', 'daily')),
  late_fee_amount DECIMAL(10,2) DEFAULT 25.00,
  late_fee_percentage DECIMAL(5,4),
  max_late_fee DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id)
);

-- Commission statements
CREATE TABLE public.renter_commission_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  booth_renter_id UUID NOT NULL REFERENCES booth_renter_profiles(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_sales DECIMAL(10,2) NOT NULL DEFAULT 0,
  commission_rate DECIMAL(5,4) NOT NULL,
  total_commission DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
  paid_at TIMESTAMPTZ,
  statement_pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 1.2 Promotions System Extensions

**New Tables/Columns:**
```sql
-- Referral tracking
CREATE TABLE public.referral_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  referrer_client_id UUID REFERENCES phorest_clients(id),
  referrer_user_id UUID REFERENCES auth.users(id),
  referral_code TEXT NOT NULL UNIQUE,
  reward_type TEXT DEFAULT 'voucher' CHECK (reward_type IN ('voucher', 'credit', 'points', 'discount')),
  referrer_reward_value DECIMAL(10,2),
  referee_reward_value DECIMAL(10,2),
  uses INTEGER DEFAULT 0,
  max_uses INTEGER,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.referral_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_link_id UUID NOT NULL REFERENCES referral_links(id),
  referred_client_id UUID NOT NULL REFERENCES phorest_clients(id),
  first_appointment_id UUID,
  referrer_rewarded BOOLEAN DEFAULT false,
  referee_rewarded BOOLEAN DEFAULT false,
  referrer_reward_id UUID, -- Links to vouchers or balance_transactions
  referee_reward_id UUID,
  converted_at TIMESTAMPTZ DEFAULT now()
);

-- Flash sale tracking
ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS
  is_flash_sale BOOLEAN DEFAULT false,
  flash_sale_countdown_start TIMESTAMPTZ,
  show_homepage_banner BOOLEAN DEFAULT false;

-- A/B testing for promotions
CREATE TABLE public.promotion_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL,
  variant_code TEXT,
  discount_value DECIMAL(10,2),
  description TEXT,
  views INTEGER DEFAULT 0,
  redemptions INTEGER DEFAULT 0,
  revenue_generated DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Promotion redemption tracking (extend existing)
ALTER TABLE public.promotion_redemptions ADD COLUMN IF NOT EXISTS
  variant_id UUID REFERENCES promotion_variants(id),
  revenue_attributed DECIMAL(10,2);
```

### 1.3 Notification Extensions

```sql
-- Add booth renter notification types
INSERT INTO public.email_templates (template_key, name, subject, body, is_active) VALUES
('rent_due_reminder', 'Rent Due Reminder', 'Your Rent Payment is Due', '...', true),
('rent_overdue_notice', 'Rent Overdue Notice', 'Rent Payment Overdue - Action Required', '...', true),
('insurance_expiring', 'Insurance Expiration Notice', 'Your Liability Insurance Expires Soon', '...', true),
('commission_statement', 'Commission Statement', 'Your Monthly Commission Statement', '...', true),
('rent_increase_notice', 'Rent Increase Notice', 'Notice of Rent Adjustment', '...', true);
```

---

## Phase 2: Edge Functions for Automation

### 2.1 Rent Invoice Generation
**File:** `supabase/functions/generate-rent-invoices/index.ts`

- Runs weekly (Sundays) for weekly renters, monthly (1st) for monthly
- Creates `rent_payments` records for upcoming period
- Calculates prorated amounts for mid-period starts
- Handles rent increases via `scheduled_rent_changes`
- Marks autopay schedules

### 2.2 Late Fee Processing
**File:** `supabase/functions/check-late-payments/index.ts`

- Runs daily at 06:00 UTC
- Fetches late fee config per organization
- Applies late fees after grace period
- Updates payment status to 'overdue'
- Sends notification emails
- Creates platform notification for admins

### 2.3 Autopay Processing
**File:** `supabase/functions/process-rent-autopay/index.ts`

- Runs daily at 08:00 UTC
- Processes payments due today with autopay enabled
- Integrates with Stripe for payment processing
- Handles failures gracefully with retry tracking
- Sends confirmation/failure emails

### 2.4 Insurance Expiration Alerts
**File:** `supabase/functions/check-insurance-expiry/index.ts`

- Runs daily
- Alerts renters 30, 14, and 7 days before expiry
- Notifies admins of expired insurance
- Can auto-deactivate renter if configured

### 2.5 Renter Commission Calculation
**File:** `supabase/functions/calculate-renter-commissions/index.ts`

- Runs monthly (end of month)
- Aggregates retail sales by booth renter
- Generates commission statements
- Creates PDF statements
- Uploads to storage and emails renters

---

## Phase 3: Booth Renter Management UI Components

### 3.1 Add Renter Dialog
**File:** `src/components/dashboard/booth-renters/AddRenterDialog.tsx`

Features:
- Create new user with booth_renter role
- Collect business info (name, license, EIN)
- Set billing contact details
- Trigger onboarding workflow

### 3.2 Renter Detail Sheet
**File:** `src/components/dashboard/booth-renters/RenterDetailSheet.tsx`

Tabs:
- **Profile**: Personal & business info, photo
- **Contract**: Active contract details, history
- **Payments**: Payment history, balance
- **Onboarding**: Task checklist progress
- **Commissions**: Retail sales and earnings
- **Insurance**: Coverage details and documents

### 3.3 Station Assignment Manager
**File:** `src/components/dashboard/booth-renters/StationAssignmentManager.tsx`

Features:
- Visual grid of stations by location
- Drag-and-drop assignment
- Availability calendar view
- Station availability status

### 3.4 Contract Issuance via PandaDoc
**File:** `src/components/dashboard/booth-renters/IssueContractDialog.tsx`

Features:
- Select PandaDoc template
- Pre-fill renter data
- Configure rent terms (amount, frequency, due day)
- Set retail commission rate
- Include/exclude utilities, WiFi, products
- Send for signature via PandaDoc API

### 3.5 Autopay Setup Dialog
**File:** `src/components/dashboard/booth-renters/AutoPaySetupDialog.tsx`

Features:
- Stripe Elements for card entry
- Bank account option via Plaid (future)
- Configure payment timing (on due date, days before)
- Show saved payment methods
- Update/remove payment methods

### 3.6 Commission Statement Generator
**File:** `src/components/dashboard/booth-renters/CommissionStatementDialog.tsx`

Features:
- Select date range
- Preview statement
- Generate PDF
- Email to renter
- Mark as paid

### 3.7 Late Fee Configuration
**File:** `src/components/dashboard/booth-renters/LateFeeConfigDialog.tsx`

Features:
- Set grace period days
- Choose fee type (flat, percentage, daily)
- Set amount/percentage
- Configure maximum fee cap

### 3.8 Rent Increase Scheduler
**File:** `src/components/dashboard/booth-renters/RentIncreaseDialog.tsx`

Features:
- Select contract
- Enter new rent amount
- Set effective date
- Auto-send notification option
- Add notes

---

## Phase 4: Renter Self-Service Portal

### 4.1 Portal Dashboard
**File:** `src/pages/dashboard/RenterPortal.tsx`

Sections:
- Welcome with next payment due
- Quick actions (Pay Rent, View Statement)
- Recent transactions
- Commission earnings summary

### 4.2 Rent Payment Page
**File:** `src/pages/dashboard/RenterPayRent.tsx`

Features:
- Outstanding balance display
- Pay with saved method or new card
- Payment history
- Download receipts

### 4.3 Payment Methods Management
**File:** `src/pages/dashboard/RenterPaymentMethods.tsx`

Features:
- Add/remove cards
- Set default payment method
- Enable/disable autopay
- Configure autopay timing

### 4.4 Commission Statements Page
**File:** `src/pages/dashboard/RenterCommissions.tsx`

Features:
- Monthly statement list
- View statement details
- Download PDF
- Year-to-date summary

### 4.5 1099 Tax Documents
**File:** `src/pages/dashboard/RenterTaxDocuments.tsx`

Features:
- Annual 1099-MISC summaries
- Download tax documents
- Payment history export

---

## Phase 5: Promotions & Checkout Enhancements

### 5.1 Promo Code in Checkout
**File:** Update `src/components/dashboard/schedule/CheckoutSummarySheet.tsx`

Add:
- Promo code input field
- Real-time validation
- Discount preview
- Client eligibility check
- Apply/remove promo

### 5.2 QR Code Vouchers
**File:** `src/components/dashboard/promotions/VoucherQRCode.tsx`

Features:
- Generate QR code for voucher
- Scannable at POS
- Print-friendly layout
- Bulk QR generation for campaigns

### 5.3 Referral Program Manager
**File:** `src/components/dashboard/promotions/ReferralProgramManager.tsx`

Features:
- Create referral campaigns
- Generate unique referral links/codes
- Configure rewards (both referrer and referee)
- Track conversion funnel
- Leaderboard of top referrers

### 5.4 Flash Sale Banner
**File:** `src/components/FlashSaleBanner.tsx`

Features:
- Countdown timer
- Links to booking
- Configurable display location
- Auto-hide when expired

### 5.5 Promotion A/B Testing
**File:** `src/components/dashboard/promotions/PromotionVariantManager.tsx`

Features:
- Create variants of a promotion
- Track performance by variant
- Statistical significance calculator
- Winner declaration

### 5.6 Sale Type Analytics Filter
**File:** Update `src/components/dashboard/analytics/SalesTabContent.tsx`

Add:
- Toggle: All / Standard / Promotional / Voucher / Loyalty
- Revenue breakdown by sale type
- Comparison charts

---

## Phase 6: Analytics & Reporting

### 6.1 Rent Revenue Analytics Tab
**File:** `src/components/dashboard/analytics/RentRevenueTab.tsx`

Metrics:
- MTD/YTD rent revenue
- Collection rate (%)
- Overdue amounts
- Revenue by renter
- Payment trend (12-month chart)
- Occupancy rate (if stations tracked)

### 6.2 Promotion ROI Dashboard
**File:** `src/components/dashboard/analytics/PromotionROIPanel.tsx`

Metrics:
- Revenue generated per promotion
- Discount given vs revenue lifted
- Cost per acquisition (new client promos)
- Redemption rate
- Best performing promotions

### 6.3 Loyalty Analytics Enhancement
**File:** Update `src/components/dashboard/promotions/PromoAnalyticsSummary.tsx`

Add:
- Points liability calculation
- Redemption velocity
- Member engagement by tier
- Referral conversion rate

### 6.4 Analytics Hub Integration
**File:** Update `src/pages/dashboard/admin/AnalyticsHub.tsx`

Changes:
- Add "Rent" tab (Super Admin only)
- Add "Promotions" sub-tab under Marketing
- Add sale type filter to Sales tab

---

## New Hooks Summary

| Hook | Purpose |
|------|---------|
| `useRentalStations` | Station CRUD and availability |
| `useStationAssignments` | Assign renters to stations |
| `useScheduledRentChanges` | Rent increase management |
| `useLateFeeConfig` | Organization late fee settings |
| `useRenterInsurance` | Insurance tracking and alerts |
| `useCommissionStatements` | Generate and manage statements |
| `useReferralProgram` | Referral links and conversions |
| `usePromotionVariants` | A/B testing management |
| `usePromoCodeValidation` | Real-time checkout validation |

---

## File Structure

```
src/
├── components/dashboard/booth-renters/
│   ├── AddRenterDialog.tsx
│   ├── RenterDetailSheet.tsx
│   ├── StationAssignmentManager.tsx
│   ├── IssueContractDialog.tsx
│   ├── AutoPaySetupDialog.tsx
│   ├── CommissionStatementDialog.tsx
│   ├── LateFeeConfigDialog.tsx
│   ├── RentIncreaseDialog.tsx
│   ├── InsuranceCard.tsx
│   └── OnboardingChecklist.tsx
├── components/dashboard/promotions/
│   ├── VoucherQRCode.tsx
│   ├── ReferralProgramManager.tsx
│   ├── PromotionVariantManager.tsx
│   └── FlashSaleConfig.tsx
├── components/dashboard/analytics/
│   ├── RentRevenueTab.tsx
│   ├── PromotionROIPanel.tsx
│   └── SaleTypeFilter.tsx
├── components/
│   └── FlashSaleBanner.tsx
├── pages/dashboard/
│   ├── RenterPortal.tsx
│   ├── RenterPayRent.tsx
│   ├── RenterPaymentMethods.tsx
│   ├── RenterCommissions.tsx
│   └── RenterTaxDocuments.tsx
├── hooks/
│   ├── useRentalStations.ts
│   ├── useStationAssignments.ts
│   ├── useScheduledRentChanges.ts
│   ├── useLateFeeConfig.ts
│   ├── useRenterInsurance.ts
│   ├── useCommissionStatements.ts
│   ├── useReferralProgram.ts
│   ├── usePromotionVariants.ts
│   └── usePromoCodeValidation.ts
└── supabase/functions/
    ├── generate-rent-invoices/
    ├── check-late-payments/
    ├── process-rent-autopay/
    ├── check-insurance-expiry/
    └── calculate-renter-commissions/
```

---

## Implementation Order

1. **Database Migration** - All schema extensions
2. **Core Hooks** - Data access layer
3. **Edge Functions** - Automation
4. **Booth Renter UI** - Management components
5. **Renter Portal** - Self-service pages
6. **Promotions Enhancements** - Promo code, QR, referrals
7. **Analytics Integration** - Dashboards and reports
8. **Testing & Polish** - End-to-end validation

---

## Technical Notes

- **RLS**: All new tables scoped by organization_id, booth_renter access to own records
- **Stripe**: Use existing platform Stripe account for rent collection
- **PandaDoc**: Extend webhook handler for booth renter contracts
- **PDF Generation**: Use jsPDF (already installed) for commission statements
- **QR Codes**: Use qrcode.react (already installed) for vouchers
- **Cron Jobs**: Register new edge functions in pg_cron after deployment

---

## Permissions Matrix

| Permission | Description |
|------------|-------------|
| `manage_booth_renters` | Full CRUD on renters |
| `view_booth_renters` | Read-only renter access |
| `manage_rent_payments` | Record and adjust payments |
| `view_rent_payments` | View payment history |
| `view_rent_analytics` | Access rent revenue analytics |
| `issue_renter_contracts` | Send PandaDoc contracts |
| `manage_referral_program` | Configure referral campaigns |
| `manage_promotion_variants` | A/B testing access |
