
# Category 7: Technical Debt Resolution - Implementation Plan

## Executive Summary

This plan addresses three key technical debt areas discovered in the codebase:
1. **Hardcoded Organization IDs** - Replace `drop-dead-salons` references with dynamic organization context
2. **Incomplete Email Notifications** - Implement missing email notifications using existing Resend infrastructure
3. **Phorest Coupling Concerns** - Create abstraction layer for future multi-POS support

---

## Current State Analysis

### Issue 1: Hardcoded Organization IDs

| File | Line | Issue |
|------|------|-------|
| `src/pages/dashboard/admin/BoothRenters.tsx` | 10 | `const DEFAULT_ORG_ID = 'drop-dead-salons'` |
| `src/components/dashboard/analytics/RentRevenueAnalytics.tsx` | 8 | `const DEFAULT_ORG_ID = 'drop-dead-salons'` |
| `src/pages/dashboard/TeamChat.tsx` | 17 | Fallback to `drop-dead-salons` org for platform users |
| `src/components/dashboard/help-fab/ChatLeadershipTab.tsx` | 104 | Same pattern as TeamChat |

**Root Cause**: These components need organization context but were built before the `OrganizationContext` was fully implemented.

### Issue 2: Incomplete Email Notifications

| Edge Function | TODO Location | Purpose |
|---------------|---------------|---------|
| `generate-rent-invoices` | Line 135 | Notify renters of new invoices |
| `check-insurance-expiry` | Line 105 | Remind renters of expiring insurance |
| `process-scheduled-reports` | Line 137 | Email report results to recipients |
| `RentIncreaseDialog.tsx` | Line 51 | Notify renters of rent changes |

**Existing Infrastructure**: 27 edge functions already use Resend for emails. Email templates exist in `email_templates` table with template keys for various notification types.

### Issue 3: Phorest Coupling

The codebase has 113 files with direct references to `phorest_*` tables. Key concerns:
- No abstraction layer for POS data
- Hard to add alternative POS systems (Square, Boulevard, Zenoti, etc.)
- Tightly coupled queries throughout the codebase

**Assessment**: Creating a full abstraction layer is a major undertaking. This plan focuses on establishing the foundation for future multi-POS support without breaking existing functionality.

---

## Feature 1: Remove Hardcoded Organization IDs

### Solution Approach

Replace static org IDs with dynamic resolution using:
1. `useOrganizationContext()` for authenticated users
2. Proper fallback logic when organization is not available

### File Changes

**1. BoothRenters.tsx**
```typescript
// Before
const DEFAULT_ORG_ID = 'drop-dead-salons';
// After
import { useOrganizationContext } from '@/contexts/OrganizationContext';

export default function BoothRenters() {
  const { effectiveOrganization } = useOrganizationContext();
  const organizationId = effectiveOrganization?.id;

  // Show loading/error if no org
  if (!organizationId) {
    return <NoOrganizationMessage />;
  }

  // Pass dynamic ID to child components
  return (
    <RentersTabContent organizationId={organizationId} />
  );
}
```

**2. RentRevenueAnalytics.tsx**
```typescript
// Before
const DEFAULT_ORG_ID = 'drop-dead-salons';
// After
interface RentRevenueAnalyticsProps {
  organizationId: string;
}

export function RentRevenueAnalytics({ organizationId }: RentRevenueAnalyticsProps) {
  const { data: metrics } = useRentRevenueAnalytics(organizationId);
  // ... rest of component
}
```

**3. TeamChat.tsx & ChatLeadershipTab.tsx**
```typescript
// Before
const defaultOrg = organizations.find(o => o.slug === 'drop-dead-salons') || organizations[0];
// After
const defaultOrg = organizations[0]; // Simply use first available org
```

### Components to Update

| Component | Change Required |
|-----------|-----------------|
| `BoothRenters.tsx` | Use OrganizationContext, remove hardcoded ID |
| `RentRevenueAnalytics.tsx` | Accept organizationId as prop |
| `TeamChat.tsx` | Remove drop-dead-salons reference |
| `ChatLeadershipTab.tsx` | Remove drop-dead-salons reference |
| `RentersTabContent.tsx` | Verify it accepts dynamic organizationId |
| `PaymentsTabContent.tsx` | Verify it accepts dynamic organizationId |

---

## Feature 2: Complete Email Notifications

### Solution: Create Reusable Email Utility

Since 27 edge functions already use Resend directly, create a shared utility for consistent email sending.

### New Shared Utility

```typescript
// supabase/functions/_shared/email-sender.ts

export interface EmailPayload {
  to: string[];
  subject: string;
  html: string;
  templateKey?: string;
  templateVariables?: Record<string, string>;
  from?: string;
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.log("RESEND_API_KEY not configured - email skipped");
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: payload.from || "Drop Dead Gorgeous <noreply@dropdeadsalons.com>",
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    }),
  });

  if (!response.ok) {
    console.error("Email send failed:", await response.text());
    return false;
  }

  return true;
}
```

### Email Template Creation

| Template Key | Subject | Purpose |
|--------------|---------|---------|
| `rent_invoice_created` | New Rent Invoice: {{month}} | Notify renter of new invoice |
| `insurance_expiry_reminder` | Insurance Expiring: {{days_until}} days | Remind renter to renew |
| `rent_increase_notice` | Upcoming Rent Change on {{effective_date}} | Notify of scheduled increase |
| `scheduled_report_ready` | Your Report is Ready: {{report_name}} | Deliver scheduled report |

### Edge Function Updates

**1. generate-rent-invoices/index.ts**
```typescript
// Add after line 133:
const renterProfile = contract.booth_renter_profiles;
const renterEmail = renterProfile?.billing_email;

if (renterEmail) {
  await sendEmail({
    to: [renterEmail],
    subject: `New Rent Invoice: ${format(periodStart, 'MMMM yyyy')}`,
    html: `
      <h2>Rent Invoice Created</h2>
      <p>A new rent invoice has been created for your booth rental:</p>
      <ul>
        <li><strong>Amount:</strong> $${rentAmount.toFixed(2)}</li>
        <li><strong>Period:</strong> ${format(periodStart, 'MMM d')} - ${format(periodEnd, 'MMM d, yyyy')}</li>
        <li><strong>Due Date:</strong> ${format(dueDate, 'MMMM d, yyyy')}</li>
      </ul>
      <p>Please log in to your dashboard to view and pay this invoice.</p>
    `,
  });
}
```

**2. check-insurance-expiry/index.ts**
```typescript
// Replace TODO at line 105:
if (renterEmail) {
  const expiryDate = new Date(renter.insurance_expiry_date);
  await sendEmail({
    to: [renterEmail],
    subject: `Insurance Expiring in ${daysAhead} Days`,
    html: `
      <h2>Insurance Renewal Reminder</h2>
      <p>Hi ${renterName},</p>
      <p>Your liability insurance is set to expire on <strong>${format(expiryDate, 'MMMM d, yyyy')}</strong>.</p>
      <p>Please renew your insurance and upload proof of coverage to maintain your active renter status.</p>
      ${daysAhead <= 7 ? '<p style="color: red;"><strong>URGENT:</strong> Your insurance expires in less than a week!</p>' : ''}
    `,
  });
}
```

**3. process-scheduled-reports/index.ts**
```typescript
// Replace TODO at line 137:
if (report.recipients && report.recipients.length > 0) {
  const recipientEmails = report.recipients.map((r: any) => r.email).filter(Boolean);
  if (recipientEmails.length > 0) {
    await sendEmail({
      to: recipientEmails,
      subject: `Report Ready: ${report.name}`,
      html: `
        <h2>Your Scheduled Report is Ready</h2>
        <p>The following report has been generated:</p>
        <ul>
          <li><strong>Report:</strong> ${report.name}</li>
          <li><strong>Generated:</strong> ${new Date().toLocaleDateString()}</li>
        </ul>
        <p>Log in to your dashboard to view the full report.</p>
      `,
    });
  }
}
```

**4. RentIncreaseDialog.tsx (Frontend)**
```typescript
// Call edge function for email instead of inline
const handleSubmit = async () => {
  await createRentChange.mutateAsync({
    contract_id: contractId,
    current_rent_amount: currentRent,
    new_rent_amount: newRent,
    effective_date: format(effectiveDate, 'yyyy-MM-dd'),
    reason,
    notes,
    send_notification: sendNotification, // Pass to backend
  });
  
  onOpenChange(false);
};
```

Create new edge function to handle rent change notifications:

```typescript
// supabase/functions/notify-rent-change/index.ts
// Called by the rent change mutation when send_notification is true
```

---

## Feature 3: POS Abstraction Foundation

### Strategy: Adapter Pattern Preparation

Rather than a full rewrite, create the foundation for multi-POS support:

1. **Define POS Interface Types** - Standard interfaces for appointments, clients, sales
2. **Create Phorest Adapter** - Wrap existing Phorest queries as the first adapter
3. **Add POS Config Table** - Track which POS each organization uses
4. **Update Organization Context** - Include active POS type

### Database Changes

```sql
-- Track POS system per organization
CREATE TABLE organization_pos_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  pos_type TEXT NOT NULL DEFAULT 'phorest', -- 'phorest', 'square', 'boulevard', 'zenoti', 'manual'
  credentials_encrypted TEXT, -- Encrypted connection credentials
  sync_enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE organization_pos_config ENABLE ROW LEVEL SECURITY;

-- Platform admins can manage POS config
CREATE POLICY "Platform admins manage POS config" ON organization_pos_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM platform_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('platform_owner', 'platform_admin')
    )
  );
```

### Interface Definitions

```typescript
// src/types/pos.ts

export type POSType = 'phorest' | 'square' | 'boulevard' | 'zenoti' | 'manual';

export interface POSAppointment {
  id: string;
  externalId: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  stylistUserId?: string;
  date: string;
  startTime: string;
  endTime: string;
  serviceName: string;
  serviceCategory?: string;
  status: AppointmentStatus;
  totalPrice?: number;
  notes?: string;
}

export interface POSClient {
  id: string;
  externalId: string;
  name: string;
  email?: string;
  phone?: string;
  preferredStylistId?: string;
  isNew: boolean;
  lastVisit?: string;
}

export interface POSSalesSummary {
  date: string;
  totalRevenue: number;
  serviceRevenue: number;
  productRevenue: number;
  transactionCount: number;
  appointmentCount: number;
}

export interface POSAdapter {
  type: POSType;
  getAppointments(dateFrom: string, dateTo: string): Promise<POSAppointment[]>;
  getClients(search?: string): Promise<POSClient[]>;
  getSalesSummary(dateFrom: string, dateTo: string): Promise<POSSalesSummary[]>;
  syncData(syncType: string): Promise<{ success: boolean; count: number }>;
}
```

### Phorest Adapter

```typescript
// src/adapters/phorest-adapter.ts

import { supabase } from '@/integrations/supabase/client';
import type { POSAdapter, POSAppointment, POSClient, POSSalesSummary } from '@/types/pos';

export const phorestAdapter: POSAdapter = {
  type: 'phorest',
  
  async getAppointments(dateFrom, dateTo) {
    const { data, error } = await supabase
      .from('phorest_appointments')
      .select('*')
      .gte('appointment_date', dateFrom)
      .lte('appointment_date', dateTo);
    
    if (error) throw error;
    
    // Transform to standard format
    return data.map(apt => ({
      id: apt.id,
      externalId: apt.phorest_id,
      clientName: apt.client_name,
      clientPhone: apt.client_phone,
      stylistUserId: apt.stylist_user_id,
      date: apt.appointment_date,
      startTime: apt.start_time,
      endTime: apt.end_time,
      serviceName: apt.service_name,
      serviceCategory: apt.service_category,
      status: apt.status,
      totalPrice: apt.total_price,
      notes: apt.notes,
    }));
  },
  
  async getClients(search) {
    let query = supabase.from('phorest_clients').select('*');
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    const { data, error } = await query;
    if (error) throw error;
    
    return data.map(client => ({
      id: client.id,
      externalId: client.phorest_client_id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      preferredStylistId: client.preferred_stylist_id,
      isNew: client.is_new,
      lastVisit: client.last_visit_date,
    }));
  },
  
  async getSalesSummary(dateFrom, dateTo) {
    const { data, error } = await supabase
      .from('phorest_daily_sales_summary')
      .select('*')
      .gte('summary_date', dateFrom)
      .lte('summary_date', dateTo);
    
    if (error) throw error;
    
    return data.map(summary => ({
      date: summary.summary_date,
      totalRevenue: summary.total_revenue,
      serviceRevenue: summary.service_revenue,
      productRevenue: summary.product_revenue,
      transactionCount: summary.total_transactions,
      appointmentCount: summary.total_services,
    }));
  },
  
  async syncData(syncType) {
    const { data, error } = await supabase.functions.invoke('sync-phorest-data', {
      body: { sync_type: syncType },
    });
    if (error) throw error;
    return { success: true, count: data?.synced || 0 };
  },
};
```

### Hook for POS Access

```typescript
// src/hooks/usePOSData.ts

import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { phorestAdapter } from '@/adapters/phorest-adapter';
import type { POSAdapter, POSType } from '@/types/pos';

const adapters: Record<POSType, POSAdapter> = {
  phorest: phorestAdapter,
  square: phorestAdapter, // Fallback until implemented
  boulevard: phorestAdapter,
  zenoti: phorestAdapter,
  manual: phorestAdapter,
};

export function usePOSAdapter(): POSAdapter {
  const { effectiveOrganization } = useOrganizationContext();
  // TODO: Fetch actual POS type from organization_pos_config
  const posType: POSType = 'phorest';
  
  return adapters[posType];
}
```

---

## Implementation Phases

### Phase 1: Remove Hardcoded IDs (Day 1)
1. Update `BoothRenters.tsx` to use OrganizationContext
2. Update `RentRevenueAnalytics.tsx` to accept dynamic prop
3. Remove `drop-dead-salons` fallback from TeamChat components
4. Test all affected pages

### Phase 2: Email Notifications (Days 2-3)
1. Create shared email-sender utility
2. Add email templates to database
3. Update `generate-rent-invoices` edge function
4. Update `check-insurance-expiry` edge function
5. Update `process-scheduled-reports` edge function
6. Create `notify-rent-change` edge function
7. Update `RentIncreaseDialog.tsx` to use notification

### Phase 3: POS Foundation (Days 4-5)
1. Create `organization_pos_config` table
2. Define POS interface types
3. Create Phorest adapter
4. Create `usePOSAdapter` hook
5. Document architecture for future adapters
6. No changes to existing Phorest queries (backward compatible)

---

## Files Summary

| Category | New Files | Modified Files |
|----------|-----------|----------------|
| Hardcoded IDs | - | 4 frontend files |
| Email Notifications | 2 new (utility, edge function) | 4 edge functions |
| POS Foundation | 3 new (types, adapter, hook), 1 migration | - |

### New Files

```text
supabase/functions/_shared/email-sender.ts
supabase/functions/notify-rent-change/index.ts
supabase/migrations/XXXX_organization_pos_config.sql
src/types/pos.ts
src/adapters/phorest-adapter.ts
src/hooks/usePOSData.ts
```

### Modified Files

```text
src/pages/dashboard/admin/BoothRenters.tsx
src/components/dashboard/analytics/RentRevenueAnalytics.tsx
src/pages/dashboard/TeamChat.tsx
src/components/dashboard/help-fab/ChatLeadershipTab.tsx
src/components/dashboard/booth-renters/RentIncreaseDialog.tsx
supabase/functions/generate-rent-invoices/index.ts
supabase/functions/check-insurance-expiry/index.ts
supabase/functions/process-scheduled-reports/index.ts
```

---

## Success Metrics

| Issue | Before | After |
|-------|--------|-------|
| Hardcoded org IDs | 4 files with hardcoded values | 0 hardcoded values |
| TODO comments for email | 4 incomplete TODOs | 0 TODOs, all emails functional |
| POS flexibility | Single Phorest integration | Adapter pattern ready for multi-POS |

---

## Risk Mitigation

1. **Hardcoded ID Removal**: Test each page thoroughly after changes to ensure organization resolution works
2. **Email Notifications**: Use existing Resend patterns; test with sandbox emails first
3. **POS Abstraction**: Keep backward compatible - existing Phorest queries continue working unchanged
