

## Add Contract Term Information to Account Details

This plan will enhance the Account Details card on the AccountDetail page to display contract term dates (start/end), renewal status, and handle the scenario where a customer has decided not to renew.

---

### Current State

The Account Details card currently shows:
- Account Number
- Created Date
- Go-Live Date
- Activated Date
- Business Type
- Source Software
- Plan

**Missing**: Contract term dates and renewal status

---

### Data Available

The `organization_billing` table already has these fields:
- `contract_start_date` (DATE)
- `contract_end_date` (DATE)  
- `auto_renewal` (BOOLEAN, defaults to true)

**New Field Needed**: Track when an account is scheduled for non-renewal (closing at term end)
- `non_renewal_requested_at` (TIMESTAMPTZ) - When the non-renewal decision was made
- `non_renewal_reason` (TEXT) - Why they're not renewing

---

### Changes Summary

| Area | File | Action |
|------|------|--------|
| Database | Migration | Add `non_renewal_requested_at` and `non_renewal_reason` columns |
| TypeScript | `useOrganizationBilling.ts` | Update interface to include new fields |
| Account Detail | `AccountDetail.tsx` | Fetch billing data, display term info in Account Details card |

---

### Implementation Details

#### 1. Database Migration

Add new columns to track non-renewal requests:

```sql
ALTER TABLE public.organization_billing 
ADD COLUMN non_renewal_requested_at TIMESTAMPTZ,
ADD COLUMN non_renewal_reason TEXT;

-- Add a comment for clarity
COMMENT ON COLUMN public.organization_billing.non_renewal_requested_at 
IS 'Timestamp when the customer requested to not renew at term end';
```

#### 2. Update TypeScript Interface

In `useOrganizationBilling.ts`, add to `OrganizationBilling` interface:

```typescript
non_renewal_requested_at: string | null;
non_renewal_reason: string | null;
```

#### 3. Update Account Detail Page

Fetch billing data using `useOrganizationBilling` hook and add new rows to the Account Details card:

**New display items:**

| Icon | Label | Value | Condition |
|------|-------|-------|-----------|
| `CalendarRange` | Term Start | `Jan 1, 2026` | When `contract_start_date` exists |
| `CalendarCheck` | Term End | `Dec 31, 2026` | When `contract_end_date` exists |
| `RefreshCw` | Renewal | `Auto-Renews` (emerald) | When `auto_renewal = true` |
| `XCircle` | Renewal | `Closing at Term End` (red) | When `auto_renewal = false` |

**Visual Design:**

```text
Account Details
────────────────
🏢 Account #1234
📅 Created Jan 15, 2026
🎯 Go-Live Feb 28, 2026
✓  Activated Feb 28, 2026
📆 Term Start Feb 1, 2026
📆 Term End Jan 31, 2027
🔄 Auto-Renews  (emerald badge)
   — OR —
❌ Closing at Term End  (red text with badge)
   Reason: Customer relocating

🏢 Type: Salon
🌐 Source: phorest
📦 Plan: professional
```

**Logic for renewal status display:**

```typescript
// If auto_renewal is true
<div className="flex items-center gap-3">
  <RefreshCw className="h-4 w-4 text-emerald-400" />
  <span className="text-emerald-400">Auto-Renews</span>
</div>

// If auto_renewal is false
<div className="flex items-center gap-3">
  <XCircle className="h-4 w-4 text-red-400" />
  <div>
    <span className="text-red-400">Closing at Term End</span>
    {billing.non_renewal_reason && (
      <p className="text-xs text-slate-500 mt-0.5">
        Reason: {billing.non_renewal_reason}
      </p>
    )}
  </div>
</div>
```

---

### Files to Create/Modify

| File | Change |
|------|--------|
| Database Migration | **New** - Add `non_renewal_requested_at` and `non_renewal_reason` columns |
| `src/hooks/useOrganizationBilling.ts` | **Edit** - Add new fields to interfaces |
| `src/pages/dashboard/platform/AccountDetail.tsx` | **Edit** - Fetch billing, display term info |

---

### Technical Notes

1. **Conditional Display**: Term dates only show if billing record exists and has dates set
2. **Loading State**: Handle loading state while billing data is being fetched
3. **No Billing Record**: If no billing configuration exists yet, show "No contract terms configured"
4. **Semantic Icons**: Using `CalendarRange` for term start, `CalendarCheck` for term end
5. **Color Coding**: 
   - Emerald for active/renewing accounts
   - Red for accounts scheduled to close
   - Slate for neutral information

