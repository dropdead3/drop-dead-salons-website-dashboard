

# Stripe Payments Health Dashboard

## Why This Makes Sense

**Yes, this feature is highly valuable** for several reasons:

1. **Two-Tier Stripe Integration**: Your system tracks Stripe at both levels:
   - **Organization Level**: Platform subscriptions (`subscription_status`: active, past_due, cancelled)
   - **Location Level**: Connect accounts for client payments (`stripe_status`: not_connected, pending, active, issues, suspended)

2. **Real-Time Visibility**: The `stripe-webhook` edge function already captures payment failures - this page surfaces that data proactively

3. **Granular Drill-Down**: Platform admins can identify exactly which location at which organization is having issues, enabling targeted support

4. **Operational Efficiency**: Instead of discovering payment issues reactively through support tickets, you see problems as they occur

---

## Feature Overview

| Component | Purpose |
|-----------|---------|
| Stripe Health Dashboard | `/dashboard/platform/stripe-health` - Central monitoring hub |
| Organization Subscription Health | Track platform billing status across all orgs |
| Location Payment Status | Track Stripe Connect health per location |
| Real-Time Event Feed | Recent payment failures, successes, and issues |
| Filtering & Drill-Down | Filter by org, location, status, date range |

---

## Visual Design

```text
+--------------------------------------------------------------------+
| Stripe Payments Health                              [Refresh] ●    |
| Monitor payment processing across all organizations                |
+--------------------------------------------------------------------+

+----------------------------+  +----------------------------+
| PLATFORM SUBSCRIPTIONS     |  | LOCATION PAYMENTS          |
| ● 24 Active                |  | ● 45 Active                |
| ⚠ 2 Past Due               |  | ⚠ 3 Issues                 |
| ○ 1 Trialing               |  | ◐ 8 Pending                |
|                            |  | ○ 12 Not Connected         |
+----------------------------+  +----------------------------+

+--------------------------------------------------------------------+
| ORGANIZATIONS WITH ISSUES                          [View All]      |
+--------------------------------------------------------------------+
| ORG NAME         | STATUS      | AMOUNT DUE | LAST ATTEMPT        |
| ────────────────────────────────────────────────────────────────── |
| ⚠ Salon ABC      | Past Due    | $299.00    | 2 hours ago    [→] |
| ⚠ Beauty Co      | Past Due    | $149.00    | 5 hours ago    [→] |
+--------------------------------------------------------------------+

+--------------------------------------------------------------------+
| LOCATIONS WITH PAYMENT ISSUES                      [View All]      |
+--------------------------------------------------------------------+
| LOCATION         | ORG          | STATUS     | ISSUE              |
| ────────────────────────────────────────────────────────────────── |
| ⚠ Downtown       | Salon ABC    | Issues     | Verification needed|
| ⚠ Westside       | Beauty Co    | Suspended  | Fraud review       |
+--------------------------------------------------------------------+

+--------------------------------------------------------------------+
| RECENT PAYMENT EVENTS                              [Last 24h ▼]    |
+--------------------------------------------------------------------+
| TIME       | TYPE            | ORG/LOCATION      | DETAILS         |
| ────────────────────────────────────────────────────────────────── |
| 12:45 PM   | ● Payment OK    | Salon XYZ         | $299 processed  |
| 11:30 AM   | ⚠ Payment Failed| Salon ABC         | Card declined   |
| 10:15 AM   | ● Payout Sent   | Beauty Co         | $1,245.00       |
| 09:00 AM   | ⚠ Connect Issue | Downtown Location | Needs verify    |
+--------------------------------------------------------------------+
```

---

## Detailed View - Organization Drill-Down

When clicking an organization with issues:

```text
+--------------------------------------------------------------------+
| Stripe Health: Salon ABC                    [Back to Health] [→]   |
+--------------------------------------------------------------------+
| SUBSCRIPTION STATUS                                                |
| Status: ⚠ Past Due                                                 |
| Amount Owed: $299.00                                               |
| Last Attempt: Jan 31, 2026 at 2:45 PM                              |
| Next Retry: Feb 3, 2026                                            |
| Decline Reason: Card declined (insufficient funds)                 |
|                                                                    |
| [Update Payment Method]  [Retry Now]  [Contact Customer]           |
+--------------------------------------------------------------------+

| LOCATION PAYMENT STATUS                                            |
+--------------------------------------------------------------------+
| LOCATION         | STRIPE STATUS | PAYMENTS ENABLED | LAST PAYOUT |
| ────────────────────────────────────────────────────────────────── |
| ● Main Street    | Active        | ✓ Yes            | Yesterday   |
| ⚠ Downtown       | Issues        | ✗ No             | —           |
| ○ Westside       | Not Connected | ✗ No             | —           |
+--------------------------------------------------------------------+
```

---

## Data Architecture

### New Hook: useStripePaymentsHealth

```typescript
interface StripePaymentsHealth {
  subscriptions: {
    active: number;
    pastDue: number;
    trialing: number;
    cancelled: number;
    total: number;
  };
  locations: {
    active: number;
    pending: number;
    issues: number;
    suspended: number;
    notConnected: number;
    total: number;
  };
  atRiskOrganizations: Array<{
    id: string;
    name: string;
    slug: string;
    subscription_status: string;
    billing_email: string | null;
    lastInvoice?: {
      amount: number;
      status: string;
      created_at: string;
    };
  }>;
  locationsWithIssues: Array<{
    id: string;
    name: string;
    organization_name: string;
    organization_slug: string;
    stripe_status: string;
    stripe_account_id: string | null;
  }>;
  recentEvents: Array<{
    id: string;
    type: 'payment_failed' | 'payment_succeeded' | 'payout' | 'connect_issue';
    organization_name: string;
    location_name?: string;
    amount?: number;
    message: string;
    created_at: string;
  }>;
}
```

### Data Sources

1. **Organization Subscriptions**: Query `organizations` table for `subscription_status`
2. **Location Payment Status**: Query `locations` table for `stripe_status`
3. **Recent Events**: Query `platform_notifications` where type IN ('payment_failed', 'payment_recovered')
4. **Invoice History**: Query `subscription_invoices` for failed/pending invoices

---

## Real-Time Updates

Enable real-time subscriptions for immediate visibility:

```typescript
// Subscribe to platform_notifications for payment events
const channel = supabase
  .channel('stripe-health')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'platform_notifications',
      filter: 'type=in.(payment_failed,payment_recovered)',
    },
    (payload) => {
      // Refetch health data
      queryClient.invalidateQueries(['stripe-payments-health']);
    }
  )
  .subscribe();
```

---

## Implementation Plan

### Files to Create

| File | Purpose |
|------|---------|
| `src/pages/dashboard/platform/StripeHealth.tsx` | Main health dashboard page |
| `src/hooks/useStripePaymentsHealth.ts` | Data fetching hook with aggregations |
| `src/components/platform/stripe/StripeHealthSummary.tsx` | Summary cards component |
| `src/components/platform/stripe/AtRiskOrgTable.tsx` | Organizations with billing issues |
| `src/components/platform/stripe/LocationIssuesTable.tsx` | Locations with Connect issues |
| `src/components/platform/stripe/PaymentEventFeed.tsx` | Recent payment events timeline |

### Files to Edit

| File | Change |
|------|--------|
| `src/components/platform/layout/PlatformSidebar.tsx` | Add nav link with CreditCard icon |
| `src/App.tsx` | Add route for `/dashboard/platform/stripe-health` |

---

## Database Requirements

**No schema changes required** - all data exists:

- `organizations.subscription_status` - Platform billing health
- `locations.stripe_status` - Connect account health
- `platform_notifications` - Payment event stream
- `subscription_invoices` - Invoice history

---

## Sidebar Navigation

Add to `PlatformSidebar.tsx`:

```typescript
{ 
  href: '/dashboard/platform/stripe-health', 
  label: 'Payments Health', 
  icon: CreditCard,
  platformRoles: ['platform_owner', 'platform_admin', 'platform_support']
}
```

Position: Between "System Health" and "Notifications" for logical grouping of monitoring tools.

---

## Key Metrics Displayed

### Subscription Health (Organization Level)
- Active subscriptions count
- Past due count (critical alert if > 0)
- Trialing count
- Cancelled count
- Total revenue at risk (sum of past_due amounts)

### Location Payments Health
- Active Connect accounts
- Pending verification
- Accounts with issues
- Suspended accounts
- Not connected locations

### Event Timeline
- Payment failures (with decline reasons)
- Payment recoveries (when retries succeed)
- Payout events (optional, if tracked)
- Connect status changes

---

## Filter Options

```typescript
interface StripeHealthFilters {
  subscriptionStatus?: ('active' | 'past_due' | 'trialing' | 'cancelled')[];
  locationStatus?: ('active' | 'pending' | 'issues' | 'suspended' | 'not_connected')[];
  organizationId?: string;
  dateRange?: 'today' | '7d' | '30d' | 'all';
  showOnlyIssues?: boolean;
}
```

---

## Estimated Scope

| Component | Complexity | Lines |
|-----------|------------|-------|
| StripeHealth.tsx (main page) | Medium | ~300 |
| useStripePaymentsHealth.ts | Medium | ~200 |
| StripeHealthSummary.tsx | Low | ~100 |
| AtRiskOrgTable.tsx | Low | ~120 |
| LocationIssuesTable.tsx | Low | ~120 |
| PaymentEventFeed.tsx | Low | ~100 |
| Sidebar + routing updates | Low | ~20 |
| **Total** | | **~960 lines** |

---

## Benefits

1. **Proactive Issue Detection**: See payment problems before customers complain
2. **Revenue Protection**: Quickly identify and resolve billing issues
3. **Granular Visibility**: Drill down from organization to specific location
4. **Real-Time Awareness**: Live updates when payment events occur
5. **Operational Efficiency**: One central view for all payment health metrics
6. **Reduced Support Load**: Platform team can proactively reach out to customers

This feature complements the existing System Health dashboard by providing specialized, deep visibility into the payment processing layer of your multi-tenant platform.

