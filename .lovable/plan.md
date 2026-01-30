

# PandaDoc Integration for Account Signup Agreements

## Summary

Integrate PandaDoc to manage account signup agreements, automatically populate billing terms from signed documents, and provide platform admins with full control over contract adjustments including term extensions, complimentary months, and manual overrides.

---

## Current State Analysis

**Existing Infrastructure:**
- Robust `organization_billing` table with fields for contract dates, promo periods, trial days, and notes
- `billing_changes` table for audit trail of all billing modifications
- `BillingConfigurationPanel` with comprehensive forms for all billing parameters
- Edge function patterns for webhook handling (e.g., `capture-external-lead`)
- Existing secrets management for API keys (PHOREST, RESEND, etc.)

**What's Needed:**
- PandaDoc API key storage and webhook secret
- Edge function to receive PandaDoc webhooks when documents are completed
- Field mapping from PandaDoc document fields to billing configuration
- UI for viewing/linking PandaDoc documents to accounts
- Contract adjustment tools (extend terms, comp months, etc.)

---

## PandaDoc Integration Architecture

```text
┌─────────────────────────────────────────────────────────────────────┐
│                         PandaDoc Workflow                            │
│                                                                      │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────────┐ │
│  │ PandaDoc     │     │ Document     │     │ Webhook Triggered    │ │
│  │ Template     │────▶│ Sent to      │────▶│ on Completion        │ │
│  │ Created      │     │ Client       │     │                      │ │
│  └──────────────┘     └──────────────┘     └──────────┬───────────┘ │
│                                                        │             │
│                                            ┌───────────▼───────────┐ │
│                                            │ Edge Function         │ │
│                                            │ pandadoc-webhook      │ │
│                                            └───────────┬───────────┘ │
│                                                        │             │
│  ┌─────────────────────────────────────────────────────▼───────────┐│
│  │                     Field Mapping                                ││
│  │  PandaDoc Field          →        organization_billing Column    ││
│  │  ─────────────────────────────────────────────────────────────   ││
│  │  term_start_date         →        contract_start_date            ││
│  │  term_end_date           →        contract_end_date              ││
│  │  subscription_plan       →        plan_id (lookup by name)       ││
│  │  monthly_rate            →        custom_price                   ││
│  │  promo_months            →        promo_months                   ││
│  │  promo_rate              →        promo_price                    ││
│  │  setup_fee               →        setup_fee                      ││
│  │  special_notes           →        notes                          ││
│  └──────────────────────────────────────────────────────────────────┘│
│                                                        │             │
│                                            ┌───────────▼───────────┐ │
│                                            │ organization_billing  │ │
│                                            │ Updated + Audit Log   │ │
│                                            └───────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema Changes

### New Table: `pandadoc_documents`

Track PandaDoc documents linked to organizations:

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| organization_id | uuid | FK to organizations |
| pandadoc_document_id | text | PandaDoc's document ID |
| document_name | text | Document title |
| status | text | draft, sent, viewed, completed, voided |
| sent_at | timestamptz | When document was sent |
| completed_at | timestamptz | When document was signed |
| signed_by_name | text | Signer's name |
| signed_by_email | text | Signer's email |
| extracted_fields | jsonb | Raw field data from PandaDoc |
| applied_to_billing | boolean | Whether fields were applied |
| applied_at | timestamptz | When applied to billing |
| document_url | text | Link to view in PandaDoc |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### New Table: `contract_adjustments`

Track all manual contract adjustments for audit purposes:

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| organization_id | uuid | FK to organizations |
| adjustment_type | text | term_extension, comp_months, date_change, custom |
| description | text | Human-readable description |
| previous_end_date | date | Contract end date before adjustment |
| new_end_date | date | Contract end date after adjustment |
| months_added | int | Number of months added (if applicable) |
| comp_value | numeric | Dollar value of comp'd months |
| reason | text | Why adjustment was made |
| approved_by | uuid | Platform user who made adjustment |
| created_at | timestamptz | |

### Add to billing_changes.change_type

Extend the existing enum to include:
- `term_extension` - Months added to contract
- `comp_applied` - Complimentary months applied
- `pandadoc_import` - Fields imported from PandaDoc

---

## Edge Function: `pandadoc-webhook`

Receives webhooks from PandaDoc when document status changes:

```text
POST /functions/v1/pandadoc-webhook

Headers:
  X-PandaDoc-Signature: {hmac_signature}

Payload:
{
  "event": "document_state_changed",
  "data": {
    "id": "document_id",
    "name": "Signup Agreement - Drop Dead Salons",
    "status": "document.completed",
    "date_completed": "2026-01-30T10:00:00Z",
    "metadata": {
      "organization_id": "uuid"  // Set when creating document
    },
    "fields": {
      "term_start_date": { "value": "2026-02-01" },
      "term_end_date": { "value": "2027-01-31" },
      "subscription_plan": { "value": "Professional" },
      "monthly_rate": { "value": "299.00" },
      "promo_months": { "value": "3" },
      "promo_rate": { "value": "199.00" },
      "setup_fee": { "value": "500.00" },
      "special_notes": { "value": "Waived setup due to referral" }
    },
    "recipients": [{
      "role": "Client",
      "email": "owner@dropdead.com",
      "first_name": "Jane",
      "last_name": "Doe",
      "completed": true
    }]
  }
}
```

**Processing Flow:**
1. Verify webhook signature using PANDADOC_WEBHOOK_SECRET
2. Parse document fields
3. Look up organization via metadata.organization_id or match by document name
4. Insert/update `pandadoc_documents` record
5. If status is "completed":
   - Map fields to billing configuration
   - Update `organization_billing` table
   - Log change to `billing_changes` with type `pandadoc_import`
6. Send notification to platform team (optional)

---

## UI Components

### 1. PandaDoc Documents Card (Account Detail > Billing Tab)

Display linked documents with status and quick actions:

```text
┌──────────────────────────────────────────────────────────────────┐
│  PandaDoc Agreements                            [+ Link Document] │
├──────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 📄 Service Agreement - 2026                    ✅ Completed │  │
│  │    Signed by: Jane Doe (owner@dropdead.com)                │  │
│  │    Signed: Jan 30, 2026                                     │  │
│  │    [View Document] [Re-apply Fields]                        │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 📄 Amendment - Extended Terms                  📧 Sent      │  │
│  │    Sent to: Jane Doe                                        │  │
│  │    Sent: Jan 28, 2026                                       │  │
│  │    [View Document] [Resend]                                 │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### 2. Contract Adjustments Panel

New section in Billing tab for manual adjustments:

```text
┌──────────────────────────────────────────────────────────────────┐
│  Contract Adjustments                                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Current Contract: Feb 1, 2026 → Jan 31, 2027 (12 months)        │
│                                                                   │
│  ┌─────────────────────┐  ┌─────────────────────┐                │
│  │ 📅 Extend Term      │  │ 🎁 Comp Free Months │                │
│  │ Add months to end   │  │ Credit at $0 rate   │                │
│  └─────────────────────┘  └─────────────────────┘                │
│                                                                   │
│  ┌─────────────────────┐  ┌─────────────────────┐                │
│  │ 📆 Change Dates     │  │ 📝 Custom Adjustment│                │
│  │ Edit start/end      │  │ Freeform change     │                │
│  └─────────────────────┘  └─────────────────────┘                │
│                                                                   │
├──────────────────────────────────────────────────────────────────┤
│  Recent Adjustments                                               │
│  • Jan 15: +3 months extended (reason: loyalty bonus)            │
│  • Dec 1: 1 month comp'd ($299 value) for service issue          │
└──────────────────────────────────────────────────────────────────┘
```

### 3. Extend Term Dialog

```text
┌─────────────────────────────────────────────────────────┐
│  Extend Contract Term                              [X]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Current End Date: Jan 31, 2027                         │
│                                                         │
│  Months to Add:    [_3_] months                         │
│                                                         │
│  New End Date:     Apr 30, 2027                         │
│                                                         │
│  Reason:                                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Loyalty bonus for 3-year client                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ⚠️ This will be logged in the billing audit trail     │
│                                                         │
│                           [Cancel]  [Extend Contract]   │
└─────────────────────────────────────────────────────────┘
```

### 4. Comp Free Months Dialog

```text
┌─────────────────────────────────────────────────────────┐
│  Comp Free Months                                  [X]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Months to Comp:   [_1_] month(s)                       │
│                                                         │
│  Apply To:         ( ) Next billing cycle               │
│                    (•) Specific month: [Feb 2026 ▼]     │
│                                                         │
│  Credit Value:     $299.00                              │
│  (Based on current monthly rate)                        │
│                                                         │
│  Reason:                                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Service outage compensation - Ticket #4521      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ⚠️ This creates a $299 credit on the account          │
│                                                         │
│                           [Cancel]  [Apply Credit]      │
└─────────────────────────────────────────────────────────┘
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/pandadoc-webhook/index.ts` | Webhook handler for PandaDoc events |
| `src/hooks/usePandaDocDocuments.ts` | CRUD for pandadoc_documents table |
| `src/hooks/useContractAdjustments.ts` | CRUD for contract_adjustments + helpers |
| `src/components/platform/billing/PandaDocDocumentsCard.tsx` | Display linked documents |
| `src/components/platform/billing/ContractAdjustmentsPanel.tsx` | Adjustment actions grid |
| `src/components/platform/billing/ExtendTermDialog.tsx` | Extend contract dialog |
| `src/components/platform/billing/CompMonthsDialog.tsx` | Comp free months dialog |
| `src/components/platform/billing/ChangeDatesDialog.tsx` | Manual date adjustment dialog |
| `src/components/platform/billing/LinkPandaDocDialog.tsx` | Manually link existing document |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/platform/billing/BillingConfigurationPanel.tsx` | Add PandaDoc card and Adjustments panel |
| `src/hooks/useBillingHistory.ts` | Add new change types for adjustments |
| Database migration | Create pandadoc_documents, contract_adjustments tables |
| `supabase/config.toml` | Add pandadoc-webhook function config |

---

## Secrets Required

| Secret | Purpose |
|--------|---------|
| `PANDADOC_API_KEY` | API key for PandaDoc REST API (creating documents, fetching status) |
| `PANDADOC_WEBHOOK_SECRET` | Shared secret for verifying webhook signatures |

---

## PandaDoc Field Mapping Configuration

Store field mappings in `site_settings` for flexibility:

```json
{
  "id": "pandadoc_field_mapping",
  "value": {
    "term_start_date": "contract_start_date",
    "term_end_date": "contract_end_date",
    "subscription_plan": "plan_name_lookup",
    "monthly_rate": "custom_price",
    "promo_months": "promo_months",
    "promo_rate": "promo_price",
    "setup_fee": "setup_fee",
    "special_notes": "notes"
  }
}
```

This allows platform admins to adjust mappings without code changes.

---

## Security & Permissions

- **Webhook Verification**: HMAC signature validation using PANDADOC_WEBHOOK_SECRET
- **RLS Policies**: Platform users can view/modify documents and adjustments
- **Audit Trail**: All adjustments logged to `contract_adjustments` and `billing_changes`
- **Role Restrictions**: Only platform_admin and platform_owner can make contract adjustments

---

## Implementation Phases

### Phase 1: Database & Secrets Setup
1. Create `pandadoc_documents` table with RLS
2. Create `contract_adjustments` table with RLS
3. Add new change types to billing_changes
4. Add secrets: PANDADOC_API_KEY, PANDADOC_WEBHOOK_SECRET

### Phase 2: Webhook Edge Function
1. Create `pandadoc-webhook` edge function
2. Implement signature verification
3. Implement field extraction and mapping
4. Update organization_billing from document fields
5. Log changes to billing_changes

### Phase 3: Document Tracking UI
1. Create `usePandaDocDocuments` hook
2. Build `PandaDocDocumentsCard` component
3. Add `LinkPandaDocDialog` for manual linking
4. Integrate into BillingConfigurationPanel

### Phase 4: Contract Adjustments
1. Create `useContractAdjustments` hook
2. Build `ContractAdjustmentsPanel` with action grid
3. Build `ExtendTermDialog` with date calculation
4. Build `CompMonthsDialog` with credit calculation
5. Build `ChangeDatesDialog` for manual overrides
6. Integrate into BillingConfigurationPanel

### Phase 5: Testing & Documentation
1. Test webhook with PandaDoc sandbox
2. Test field mapping with various document templates
3. Document PandaDoc template requirements
4. Document adjustment audit trail

---

## PandaDoc Template Requirements

For the integration to work, PandaDoc templates should include these field tokens:

| Field Name | Type | Format | Example |
|------------|------|--------|---------|
| term_start_date | Date | YYYY-MM-DD | 2026-02-01 |
| term_end_date | Date | YYYY-MM-DD | 2027-01-31 |
| subscription_plan | Text | Plan name | Professional |
| monthly_rate | Number | Decimal | 299.00 |
| promo_months | Number | Integer | 3 |
| promo_rate | Number | Decimal | 199.00 |
| setup_fee | Number | Decimal | 500.00 |
| special_notes | Text | Freeform | Waived setup fee |

Additionally, document metadata should include `organization_id` when creating documents via API to enable automatic linking.

