

# Stripe Payment Error Alerting System

This plan implements **real-time alerting** for Stripe payment processing errors across all organizations, ensuring platform administrators are notified immediately when payments fail.

---

## Feature Overview

| Component | Purpose |
|-----------|---------|
| Stripe Webhook Handler | Receives real-time events from Stripe |
| Payment Error Notifications | Creates instant platform alerts |
| Email Alerts | Sends critical errors to platform admins |
| Payment Issues Dashboard | View and manage payment failures |
| Notification Type Expansion | Adds `payment_failed` to notification system |

---

## Architecture

```text
+------------------+     Webhook      +----------------------+
|     Stripe       | ───────────────> | stripe-webhook       |
|  (payment fails) |                  | Edge Function        |
+------------------+                  +----------------------+
                                              │
                     ┌────────────────────────┼────────────────────────┐
                     │                        │                        │
                     ▼                        ▼                        ▼
          +------------------+    +------------------+    +------------------+
          | Update org       |    | Create platform  |    | Send email via   |
          | subscription     |    | notification     |    | Resend           |
          | status           |    |                  |    |                  |
          +------------------+    +------------------+    +------------------+
                                          │
                                          ▼
                                +------------------+
                                | Bell notification|
                                | + Notifications  |
                                | page             |
                                +------------------+
```

---

## Component 1: Stripe Webhook Edge Function

### What Gets Built
A secure webhook handler that listens for Stripe payment events and triggers immediate alerts.

### Events to Handle
| Stripe Event | Action |
|--------------|--------|
| `invoice.payment_failed` | Alert + Update org status to `past_due` |
| `invoice.payment_succeeded` | Clear alerts + Update org status to `active` |
| `charge.failed` | Alert with decline reason |
| `customer.subscription.deleted` | Alert + Update org status to `cancelled` |
| `customer.subscription.updated` | Update org subscription details |

### Edge Function Structure
```typescript
// supabase/functions/stripe-webhook/index.ts

Deno.serve(async (req) => {
  // 1. Verify Stripe signature using STRIPE_WEBHOOK_SECRET
  const signature = req.headers.get('stripe-signature');
  const payload = await req.text();
  
  // Verify using Web Crypto API
  const isValid = await verifyStripeSignature(payload, signature, webhookSecret);
  
  // 2. Parse event and route to handler
  const event = JSON.parse(payload);
  
  switch (event.type) {
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;
    case 'charge.failed':
      await handleChargeFailed(event.data.object);
      break;
    // ... more handlers
  }
  
  return new Response(JSON.stringify({ received: true }));
});
```

### Payment Failed Handler Logic
```typescript
async function handlePaymentFailed(invoice) {
  const customerId = invoice.customer;
  
  // 1. Find organization by stripe_customer_id
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug, billing_email')
    .eq('stripe_customer_id', customerId)
    .single();
  
  // 2. Update organization subscription status
  await supabase
    .from('organizations')
    .update({ subscription_status: 'past_due' })
    .eq('id', org.id);
  
  // 3. Create platform notification (critical severity)
  await supabase.from('platform_notifications').insert({
    type: 'payment_failed',
    severity: 'critical',
    title: `Payment Failed: ${org.name}`,
    message: `Invoice ${invoice.id} for $${invoice.amount_due / 100} failed. Reason: ${invoice.last_payment_error?.message || 'Unknown'}`,
    link: `/dashboard/platform/accounts/${org.slug}`,
    metadata: {
      organization_id: org.id,
      stripe_invoice_id: invoice.id,
      amount: invoice.amount_due,
      attempt_count: invoice.attempt_count,
      next_attempt: invoice.next_payment_attempt,
    }
  });
  
  // 4. Send email to platform admins
  await sendPaymentFailedEmail(org, invoice);
  
  // 5. Log to subscription_invoices table
  await supabase.from('subscription_invoices').upsert({
    organization_id: org.id,
    stripe_invoice_id: invoice.id,
    amount: invoice.amount_due / 100,
    status: 'unpaid',
    description: `Payment failed: ${invoice.last_payment_error?.message}`,
  });
}
```

### Signature Verification Pattern
```typescript
async function verifyStripeSignature(
  payload: string, 
  signature: string, 
  secret: string
): Promise<boolean> {
  // Stripe signatures are: t=timestamp,v1=signature
  const elements = signature.split(',');
  const timestamp = elements.find(e => e.startsWith('t='))?.slice(2);
  const sig = elements.find(e => e.startsWith('v1='))?.slice(3);
  
  // Construct signed payload (timestamp + payload)
  const signedPayload = `${timestamp}.${payload}`;
  
  // Compute expected signature using HMAC-SHA256
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const expectedSig = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(signedPayload)
  );
  
  const expectedHex = Array.from(new Uint8Array(expectedSig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return expectedHex === sig;
}
```

---

## Component 2: Notification System Enhancement

### Add Payment Failed Notification Type
Update `usePlatformNotifications.ts`:

```typescript
export const NOTIFICATION_TYPES = {
  // ... existing types
  payment_failed: {
    label: 'Payment Failures',
    description: 'When subscription payments fail',
    defaultChannels: ['in_app', 'email'],
  },
  payment_recovered: {
    label: 'Payment Recovery',
    description: 'When failed payments are recovered',
    defaultChannels: ['in_app'],
  },
};
```

### Add Icon Mappings
```typescript
const TYPE_ICONS = {
  // ... existing
  payment_failed: CreditCard,
  payment_recovered: CheckCircle,
};
```

---

## Component 3: Payment Alert Email

### Email Template Design
```text
+------------------------------------------------------------+
| 🚨 URGENT: Payment Failed                                   |
+------------------------------------------------------------+
|                                                             |
| Hi Platform Team,                                           |
|                                                             |
| A subscription payment has failed and requires attention:   |
|                                                             |
| ┌─────────────────────────────────────────────────────────┐|
| │ Organization: Salon ABC                                  │|
| │ Amount: $299.00                                          │|
| │ Failed At: January 31, 2026, 2:45 PM MST                │|
| │ Reason: Card declined (insufficient funds)              │|
| │ Attempt: 1 of 4                                          │|
| │ Next Retry: February 3, 2026                             │|
| └─────────────────────────────────────────────────────────┘|
|                                                             |
| [View Account]  [View in Stripe]                            |
|                                                             |
+------------------------------------------------------------+
```

---

## Component 4: Secrets Required

The following secrets need to be configured:

| Secret Name | Purpose |
|-------------|---------|
| `STRIPE_SECRET_KEY` | API access for lookups |
| `STRIPE_WEBHOOK_SECRET` | Verify webhook signatures |

---

## Component 5: Payment Issues Quick View

### Add to System Health Dashboard
Extend `SystemHealthCard.tsx` to show:
- Count of organizations with `past_due` status
- Recent payment failures in last 24h
- Link to filtered account list

### Add to Notifications Page
Add a "Payment Alerts" quick filter tab showing only `payment_failed` and `payment_recovered` notifications.

---

## Implementation Details

### File Changes Summary

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/stripe-webhook/index.ts` | **Create** | Webhook handler |
| `src/hooks/usePlatformNotifications.ts` | **Edit** | Add payment_failed type |
| `src/pages/dashboard/platform/Notifications.tsx` | **Edit** | Add payment icon |
| `src/components/platform/layout/PlatformNotificationBell.tsx` | **Edit** | Add payment icon |
| `src/components/platform/overview/SystemHealthCard.tsx` | **Edit** | Show payment issues |
| `supabase/config.toml` | **Edit** | Add webhook function config |

---

## Database Changes

No schema changes required. The existing tables support this:

- `organizations.subscription_status` - Already has `past_due` value
- `platform_notifications` - Supports new `payment_failed` type
- `subscription_invoices` - Logs individual invoice events

---

## Edge Function: stripe-webhook

### Full Implementation
```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Stripe signature verification
async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  if (!secret) {
    console.warn("STRIPE_WEBHOOK_SECRET not configured");
    return false;
  }

  const elements = signature.split(',');
  const timestamp = elements.find(e => e.startsWith('t='))?.slice(2);
  const sig = elements.find(e => e.startsWith('v1='))?.slice(3);

  if (!timestamp || !sig) return false;

  // Check timestamp freshness (within 5 minutes)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) {
    console.error("Webhook timestamp too old");
    return false;
  }

  const signedPayload = `${timestamp}.${payload}`;
  const encoder = new TextEncoder();
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const expected = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(signedPayload)
  );

  const expectedHex = Array.from(new Uint8Array(expected))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return expectedHex === sig;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    // Get raw body and signature
    const payload = await req.text();
    const signature = req.headers.get("stripe-signature") || "";

    // Verify signature
    if (!await verifyStripeSignature(payload, signature, webhookSecret)) {
      console.error("Invalid Stripe webhook signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const event = JSON.parse(payload);
    console.log(`Stripe webhook: ${event.type}`, event.id);

    // Route to appropriate handler
    switch (event.type) {
      case "invoice.payment_failed":
        await handlePaymentFailed(supabase, resend, event.data.object);
        break;
        
      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(supabase, event.data.object);
        break;
        
      case "charge.failed":
        await handleChargeFailed(supabase, event.data.object);
        break;
        
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(supabase, resend, event.data.object);
        break;
        
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(supabase, event.data.object);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Handler implementations would follow...
```

---

## Stripe Dashboard Configuration

After deploying, configure the webhook in Stripe:

1. **Endpoint URL**: `https://vciqmwzgfjxtzagaxgnh.supabase.co/functions/v1/stripe-webhook`

2. **Events to subscribe**:
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`
   - `charge.failed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`

3. **Copy Webhook Secret** to secrets as `STRIPE_WEBHOOK_SECRET`

---

## Testing Strategy

### Manual Testing
1. Use Stripe Test Mode with test cards
2. `4000000000000341` - Attaching card fails
3. `4000000000009995` - Insufficient funds decline
4. Verify notification appears in bell within seconds
5. Verify email received

### Edge Cases
- Organization not found for customer_id (log warning, don't fail)
- Duplicate webhook calls (idempotent using invoice_id)
- Signature verification failure (return 401)

---

## Security Considerations

1. **Signature Verification**: All webhooks verified via HMAC-SHA256
2. **Timestamp Tolerance**: Max 5-minute age for webhook events
3. **Service Role Key**: Used for database updates (not exposed)
4. **RLS Bypass**: Service role bypasses RLS for notification inserts
5. **Audit Trail**: All payment events logged to `subscription_invoices`

---

## Estimated Scope

| Component | Complexity | Lines |
|-----------|------------|-------|
| stripe-webhook edge function | Medium | ~300 |
| Notification type additions | Low | ~30 |
| Icon updates | Low | ~10 |
| System health enhancement | Low | ~50 |
| **Total** | | **~390 lines** |

This implementation provides immediate visibility into payment issues across all organizations, enabling rapid response to revenue-impacting events.

