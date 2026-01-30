

# Platform Payments and Revenue Dashboard

## Summary

Build a subscription billing system where organizations pay platform fees based on their plan (Starter, Standard, Professional, Enterprise), plus a Revenue Dashboard exclusively for approved platform admins to track Monthly Recurring Revenue (MRR), payment history, and subscription health.

---

## Architecture Overview

```text
+------------------+       +-------------------+       +------------------+
|   Organizations  | ----> |   Stripe Billing  | ----> |  Revenue Dashboard |
+------------------+       +-------------------+       +------------------+
       |                          |                          |
  subscription_tier          Subscriptions              Platform Admins
  stripe_customer_id         Invoices                   (platform_admin role)
                             Webhooks
```

---

## Database Schema

### New Tables

| Table | Purpose |
|-------|---------|
| `subscription_plans` | Define plan tiers with pricing |
| `organization_subscriptions` | Track active subscriptions per org |
| `subscription_invoices` | Record payment history |

### Schema Details

**subscription_plans**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| tier | text | starter, standard, professional, enterprise |
| name | text | Display name (e.g., "Professional Plan") |
| price_monthly | numeric | Monthly price in dollars |
| price_annually | numeric | Annual price (discounted) |
| stripe_price_id_monthly | text | Stripe Price ID for monthly |
| stripe_price_id_annual | text | Stripe Price ID for annual |
| max_locations | int | Location limit per plan |
| max_users | int | User limit per plan |
| features | jsonb | Feature flags |
| is_active | boolean | Available for new signups |

**organization_subscriptions** (modify organizations table)
| Column | Type | Description |
|--------|------|-------------|
| stripe_customer_id | text | Stripe Customer ID |
| stripe_subscription_id | text | Active subscription ID |
| subscription_status | text | active, past_due, cancelled, trialing |
| current_period_start | timestamptz | Billing period start |
| current_period_end | timestamptz | Billing period end |
| billing_email | text | Billing contact email |

**subscription_invoices**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| organization_id | uuid | FK to organizations |
| stripe_invoice_id | text | Stripe Invoice ID |
| amount | numeric | Invoice amount |
| status | text | paid, unpaid, void |
| period_start | timestamptz | Invoice period start |
| period_end | timestamptz | Invoice period end |
| paid_at | timestamptz | Payment timestamp |
| invoice_url | text | Hosted invoice URL |

---

## Stripe Integration

### Edge Function: `stripe-webhook`

Handles Stripe webhook events:
- `customer.subscription.created` - New subscription
- `customer.subscription.updated` - Plan changes
- `customer.subscription.deleted` - Cancellation
- `invoice.paid` - Successful payment
- `invoice.payment_failed` - Failed payment

### Edge Function: `create-checkout-session`

Creates Stripe Checkout session for:
- New subscription signup
- Plan upgrades/downgrades
- Payment method updates

### Edge Function: `customer-portal`

Generates Stripe Customer Portal link for self-service:
- Update payment method
- View invoices
- Cancel subscription

---

## Revenue Dashboard

### Access Control

Protected by `requirePlatformRole="platform_admin"` - only `platform_owner` and `platform_admin` can access.

### Route

`/dashboard/platform/revenue`

### Key Metrics

| Metric | Description |
|--------|-------------|
| MRR | Monthly Recurring Revenue |
| ARR | Annual Recurring Revenue |
| Active Subscriptions | Count by plan |
| Churn Rate | Cancellations this month |
| Revenue by Plan | Breakdown by tier |
| Payment Success Rate | Successful vs failed |

### Dashboard Sections

1. **KPI Cards**
   - Total MRR with trend
   - Active subscriptions
   - Average revenue per account
   - Churn this month

2. **Revenue Chart**
   - Monthly revenue over time
   - Stacked by plan tier

3. **Subscription Breakdown**
   - Table of accounts by plan
   - Status indicators (active, past_due, trialing)

4. **Recent Invoices**
   - Latest 10 invoices
   - Status, amount, organization

5. **At-Risk Accounts**
   - Past due subscriptions
   - Failed payments
   - Action buttons

---

## Implementation Files

### New Files

| File | Purpose |
|------|---------|
| `supabase/functions/stripe-webhook/index.ts` | Webhook handler |
| `supabase/functions/create-checkout-session/index.ts` | Checkout creation |
| `supabase/functions/customer-portal/index.ts` | Portal link generation |
| `src/pages/dashboard/platform/Revenue.tsx` | Revenue dashboard page |
| `src/hooks/usePlatformRevenue.ts` | Revenue metrics hook |
| `src/hooks/useSubscriptionManagement.ts` | Subscription actions hook |
| `src/components/platform/RevenueChart.tsx` | Revenue visualization |
| `src/components/platform/SubscriptionTable.tsx` | Subscription list |

### Modified Files

| File | Changes |
|------|---------|
| `src/App.tsx` | Add Revenue route with platform_admin protection |
| `src/components/dashboard/DashboardLayout.tsx` | Add Revenue nav item |
| Database migration | Add new tables and columns |

---

## Plan Pricing (Configurable)

| Tier | Monthly | Annual (Save 20%) |
|------|---------|-------------------|
| Starter | $99 | $948 |
| Standard | $199 | $1,908 |
| Professional | $349 | $3,348 |
| Enterprise | Custom | Custom |

---

## Security

### RLS Policies

- `subscription_plans`: Anyone can read (public pricing)
- `organization_subscriptions`: Platform users can view all, org admins view own
- `subscription_invoices`: Platform users can view all, org admins view own

### Webhook Security

- Verify Stripe signature using `STRIPE_WEBHOOK_SECRET`
- Log all webhook events to `platform_audit_log`

### Dashboard Access

- Protected by `ProtectedRoute` with `requirePlatformRole="platform_admin"`
- Only `platform_owner` and `platform_admin` roles can access

---

## Required Secrets

| Secret | Purpose |
|--------|---------|
| `STRIPE_SECRET_KEY` | Server-side Stripe API |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification |

---

## Implementation Phases

### Phase 1: Database + Stripe Setup
1. Create database tables and RLS policies
2. Set up Stripe products and prices
3. Add Stripe secrets

### Phase 2: Edge Functions
1. Build `stripe-webhook` handler
2. Build `create-checkout-session`
3. Build `customer-portal`

### Phase 3: Revenue Dashboard
1. Create revenue data hooks
2. Build dashboard page with charts
3. Add navigation and route protection

### Phase 4: Account Integration
1. Add billing tab to Account Detail page
2. Show subscription status
3. Enable plan management actions

---

## Technical Notes

- Uses Stripe Checkout for secure, hosted payment pages
- Stripe Customer Portal for self-service management
- Webhook-driven updates for real-time sync
- Recharts for revenue visualization (already installed)
- Platform theme styling consistent with existing pages

