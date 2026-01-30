
# Flexible Subscription Billing System

## Summary

Build a comprehensive subscription management system that allows platform admins to configure custom billing terms for each organization, including promotional discounts, negotiated rates, trial periods, and flexible billing cycles. Billing only begins when an account is activated.

---

## Current State Analysis

The system currently has:
- **subscription_plans** table with base pricing (Starter $99, Standard $199, Professional $349, Enterprise custom)
- **organizations** table with basic billing fields (stripe_customer_id, subscription_status, trial_ends_at, etc.)
- Plan selection in Create/Edit Organization dialogs (static dropdown, no pricing customization)

What's missing:
- Custom pricing overrides per organization
- Promotional/discount configuration
- Billing term flexibility (monthly vs annual, 6-month vs 12-month)
- Trial period management
- Billing start date tied to activation

---

## Key SaaS Billing Features to Implement

### 1. Custom Pricing Overrides
- Override base plan price for specific accounts
- Track reason for discount (negotiation, promotion, partner, etc.)
- Store discount percentage or fixed amount

### 2. Promotional Periods
- First X months at discounted rate
- Introductory pricing that reverts to full rate
- Time-limited promotional codes

### 3. Billing Term Flexibility
- Monthly, Quarterly, Semi-Annual, Annual billing cycles
- Different pricing per billing frequency
- Custom contract lengths (6mo, 12mo, 24mo, etc.)

### 4. Trial & Grace Periods
- Free trial (14, 30, 60 days configurable)
- Billing starts on activation, not signup
- Grace period before suspension for failed payments

### 5. Additional SaaS Model Suggestions
- **Setup Fees**: One-time onboarding/migration fees
- **Per-Location Pricing**: Base + $X per additional location
- **Overage Charges**: Extra fees when exceeding plan limits (users, locations)
- **Annual Prepay Discounts**: Save 20% when paying annually
- **Pause Subscriptions**: Seasonal businesses can pause billing
- **Credits/Refunds**: Issue account credits for issues or referrals
- **Upgrade/Downgrade Proration**: Calculate mid-cycle plan changes

---

## Database Schema

### New Table: `organization_billing`

Stores custom billing configuration per organization:

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| organization_id | uuid | FK to organizations (unique) |
| plan_id | uuid | FK to subscription_plans |
| billing_cycle | text | monthly, quarterly, semi_annual, annual |
| contract_length_months | int | 1, 6, 12, 24, etc. |
| contract_start_date | date | When contract begins |
| contract_end_date | date | Calculated from start + length |
| base_price | numeric | Standard plan price |
| custom_price | numeric | Override price (null = use base) |
| discount_type | text | percentage, fixed_amount, promotional |
| discount_value | numeric | Discount % or $ amount |
| discount_reason | text | Reason for discount |
| promo_months | int | First X months at promo rate |
| promo_price | numeric | Price during promo period |
| promo_ends_at | timestamptz | When promo pricing ends |
| trial_days | int | Free trial duration |
| trial_ends_at | timestamptz | Trial end date |
| billing_starts_at | timestamptz | When billing begins (activation) |
| setup_fee | numeric | One-time setup/migration fee |
| setup_fee_paid | boolean | Whether setup fee was paid |
| per_location_fee | numeric | Additional per-location charge |
| notes | text | Internal billing notes |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### Update `organizations` Table

Add columns to track billing state:
- `billing_status`: draft, trialing, active, past_due, paused, cancelled
- `next_invoice_date`: When next charge will occur
- `paused_at`: If subscription is paused
- `pause_ends_at`: When pause period ends

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                   Account Detail Page                        │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐ │
│  │  Overview   │  │  Locations  │  │      BILLING         │ │
│  │    Tab      │  │    Tab      │  │       Tab            │ │
│  └─────────────┘  └─────────────┘  └──────────────────────┘ │
│                                              │               │
│                                              ▼               │
│                          ┌──────────────────────────────┐   │
│                          │  BillingConfigurationPanel   │   │
│                          │                              │   │
│                          │  • Plan Selection            │   │
│                          │  • Custom Pricing            │   │
│                          │  • Promotional Rates         │   │
│                          │  • Billing Cycle             │   │
│                          │  • Contract Terms            │   │
│                          │  • Trial Period              │   │
│                          │  • Setup Fees                │   │
│                          │  • Invoice Preview           │   │
│                          └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## UI Components

### 1. Billing Tab in Account Detail Page

A new tab showing the complete billing configuration with sections:

**Current Status Card**
- Billing status badge (trialing/active/past_due)
- Current monthly cost
- Next invoice date and amount
- Days remaining in trial/promo

**Plan & Pricing Section**
- Plan selector with base prices
- Custom price override toggle
- Discount configuration (type, value, reason)

**Contract Terms Section**
- Billing cycle (monthly/quarterly/annual)
- Contract length
- Contract start/end dates
- Auto-renewal toggle

**Promotional Pricing Section**
- Promo duration (first X months)
- Promo price
- Visual timeline showing promo → regular rate

**Trial & Onboarding Section**
- Trial days configuration
- Billing start date (tied to activation)
- Setup fee with paid status

**Invoice Preview**
- Show calculated amounts based on configuration
- First invoice breakdown
- Ongoing invoice preview

### 2. Quick Billing Setup in Create Account Dialog

Add expandable "Billing Configuration" section:
- Plan selection with prices shown
- Quick promo options (First month free, 3 months 50% off)
- Standard contract length selector

### 3. Billing History Section

- List of invoices with status
- Payment method on file
- Credits/adjustments

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/platform/billing/BillingConfigurationPanel.tsx` | Main billing config UI |
| `src/components/platform/billing/PlanSelector.tsx` | Plan selection with pricing |
| `src/components/platform/billing/CustomPricingForm.tsx` | Override pricing form |
| `src/components/platform/billing/PromoConfigForm.tsx` | Promotional period setup |
| `src/components/platform/billing/ContractTermsForm.tsx` | Contract/term settings |
| `src/components/platform/billing/InvoicePreview.tsx` | Real-time invoice calculation |
| `src/components/platform/billing/BillingStatusCard.tsx` | Current billing status |
| `src/hooks/useOrganizationBilling.ts` | CRUD for billing config |
| `src/hooks/useBillingCalculations.ts` | Invoice calculation logic |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/dashboard/platform/AccountDetail.tsx` | Add Billing tab |
| `src/components/platform/CreateOrganizationDialog.tsx` | Add billing quick setup |
| `src/components/platform/EditOrganizationDialog.tsx` | Link to billing config |
| Database migration | Add organization_billing table, update organizations |

---

## Implementation Phases

### Phase 1: Database & Core Logic
1. Create `organization_billing` table with all fields
2. Add billing status columns to `organizations`
3. Create `useOrganizationBilling` hook for CRUD
4. Create `useBillingCalculations` hook for invoice math

### Phase 2: Billing Tab UI
1. Add Billing tab to Account Detail page
2. Build BillingStatusCard component
3. Build PlanSelector with base prices
4. Build CustomPricingForm

### Phase 3: Advanced Configuration
1. Build PromoConfigForm
2. Build ContractTermsForm
3. Build InvoicePreview with calculations
4. Integrate all into BillingConfigurationPanel

### Phase 4: Quick Setup Integration
1. Add billing section to CreateOrganizationDialog
2. Add "Configure Billing" button to EditOrganizationDialog
3. Add billing status to Accounts list view

---

## Invoice Calculation Logic

```text
calculateMonthlyAmount(billing):
  1. Start with base_price from plan
  2. If custom_price set, use that instead
  3. If in promo period (now < promo_ends_at):
     - Use promo_price
  4. Apply discount if set:
     - percentage: price * (1 - discount_value/100)
     - fixed_amount: price - discount_value
  5. Add per_location_fee * (location_count - included_locations)
  6. Return final amount

calculateFirstInvoice(billing):
  1. Get monthly amount
  2. If billing_cycle = annual: amount * 12 * 0.8 (20% discount)
  3. If billing_cycle = semi_annual: amount * 6 * 0.9 (10% discount)
  4. Add setup_fee if not paid
  5. Return total
```

---

## Security & RLS

- `organization_billing`: Platform users can view/edit all, org admins can view own
- Billing modifications logged to `platform_audit_log`
- Only platform_owner and platform_admin can modify billing terms

---

## Stripe Integration Notes (Future)

When Stripe is enabled, the billing configuration will:
1. Create Stripe Customer for organization
2. Create Subscription with custom pricing via Price overrides
3. Handle trial periods via Stripe's trial_end parameter
4. Use Stripe Coupons for promotional discounts
5. Webhook updates billing status in real-time

For now, the system tracks billing intent and configuration. Stripe integration adds payment processing.
