

# Make the Hiring Bridge Flow Provider-Agnostic (Gusto + QuickBooks)

## Problem

The New Hire Wizard currently hardcodes "Gusto" throughout the UI and edge function. Organizations using QuickBooks for payroll and HR see a "Gusto: Not Connected" toggle that is irrelevant to them. There is no way to trigger QuickBooks onboarding from the hiring flow.

## Solution

Generalize the wizard's "Legal and Docs" step to detect whichever payroll provider is connected (Gusto, QuickBooks, or none) and adapt the labels, descriptions, and backend triggers accordingly. The architecture already supports this -- `usePayrollConnection` returns `connection.provider` and `isConnected`.

---

## Changes

### 1. New Hire Wizard UI (`src/pages/dashboard/admin/NewHireWizard.tsx`)

**Current behavior**: Hardcoded "Gusto Payroll" toggle with Gusto-specific copy.

**New behavior**:
- Read `provider` and `isConnected` from `usePayrollConnection()` (already imported)
- Replace the Gusto-specific section with a generic "Payroll Provider" section that dynamically shows the connected provider name
- Display provider-specific descriptions:
  - **Gusto**: "Offer letter, W-4, I-9, and direct deposit will be handled via Gusto"
  - **QuickBooks**: "Employee setup, tax forms, and direct deposit will be handled via QuickBooks Payroll"
  - **None connected**: "Connect a payroll provider in the Payroll Hub to automate tax documents and onboarding"
- Rename form field `triggerGusto` to `triggerPayrollProvider` for clarity
- PandaDoc toggle logic stays the same: disabled when payroll provider handles offer letters (Gusto does; QuickBooks does not, so PandaDoc remains available when QuickBooks is connected)
- Success dialog: replace "gustoStatus" / "gustoMessage" with generic "payrollStatus" / "payrollMessage"

### 2. Edge Function (`supabase/functions/hire-employee/index.ts`)

**Current behavior**: Accepts `triggerGusto` boolean and returns Gusto-specific status.

**New behavior**:
- Accept `triggerPayrollProvider` (boolean) and `payrollProvider` (string: 'gusto' | 'quickbooks' | null)
- When triggered, return provider-specific status messages:
  - Gusto connected: "Employee will be onboarded via Gusto for tax documents, offer letter, and direct deposit"
  - QuickBooks connected: "Employee will be added to QuickBooks Payroll for tax forms and direct deposit"
  - Not connected: "Payroll provider is not yet configured. Tax documents will need to be handled manually."
- Response fields renamed from `gustoStatus`/`gustoMessage` to `payrollStatus`/`payrollMessage`
- Backward-compatible: still accepts `triggerGusto` as a fallback alias

### 3. Hook (`src/hooks/useHireEmployee.ts`)

- Update the `HireData` interface: add `triggerPayrollProvider` and `payrollProvider` fields
- Keep `triggerGusto` as optional for backward compatibility
- Update `HireResult` interface: rename `gustoStatus`/`gustoMessage` to `payrollStatus`/`payrollMessage`

---

## Provider-Specific Behavior Matrix

```text
Provider     | Offer Letter      | Tax Docs (W-4, I-9) | Direct Deposit
-------------|--------------------|-----------------------|---------------
Gusto        | Via Gusto          | Via Gusto             | Via Gusto
QuickBooks   | Via PandaDoc/Manual| Via QuickBooks        | Via QuickBooks
None         | Via PandaDoc/Manual| Manual (Doc Tracker)  | Manual
```

Key difference: QuickBooks Payroll does not generate offer letters, so PandaDoc remains enabled when QuickBooks is the active provider. Gusto handles offer letters natively, so PandaDoc is disabled when Gusto is toggled on.

---

## Files to Modify

1. **`src/pages/dashboard/admin/NewHireWizard.tsx`** -- Generalize Legal and Docs step UI
2. **`supabase/functions/hire-employee/index.ts`** -- Accept provider-agnostic parameters
3. **`src/hooks/useHireEmployee.ts`** -- Update interfaces for generic payroll provider fields

## Files Unchanged

- `src/hooks/usePayrollConnection.ts` -- Already returns `provider` and `isConnected` for any provider
- `src/components/dashboard/payroll/providers/providerConfig.ts` -- No changes needed
- Routing and Management Hub -- No changes needed

