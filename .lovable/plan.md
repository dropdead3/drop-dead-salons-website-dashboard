

## Add Go-Live Date Tracking for Organization Onboarding

This plan will add a `go_live_date` field to track when organizations are scheduled to begin using the software, providing visibility into the onboarding timeline and enabling better planning for the final data import.

---

### Problem Statement

Currently, the platform tracks:
- **`created_at`**: When the account was created
- **`activated_at`**: When the account status changed to "active" (set automatically)
- **`onboarding_stage`**: Current phase (new → importing → training → live)

What's missing is a **scheduled go-live date** - the planned date when:
1. The final data import will be completed
2. The organization will begin using the software to book and bill clients

This date is critical for:
- Planning and scheduling the migration team's work
- Communicating expectations with the client
- Tracking onboarding progress and timelines

---

### Solution Overview

Add a new `go_live_date` field that represents the **planned** go-live date, separate from `activated_at` which represents when it **actually** happened.

---

### Changes Summary

| Area | File(s) | Change |
|------|---------|--------|
| Database | Migration | Add `go_live_date DATE` column to `organizations` table |
| TypeScript Types | `useOrganizations.ts` | Add `go_live_date` to `Organization` interface |
| Edit Dialog | `EditOrganizationDialog.tsx` | Add date picker field in "Account Status" section |
| Account Detail | `AccountDetail.tsx` | Display scheduled go-live date in Account Details card |
| Accounts Table | `Accounts.tsx` | Add go-live date column with visual indicators |

---

### Implementation Details

#### 1. Database Migration

Add a new nullable `DATE` column for the scheduled go-live date:

```sql
ALTER TABLE public.organizations 
ADD COLUMN go_live_date DATE;

-- Index for filtering/sorting by go-live date
CREATE INDEX idx_organizations_go_live ON public.organizations(go_live_date);
```

#### 2. Update TypeScript Interface

In `useOrganizations.ts`, add to the `Organization` interface:

```typescript
go_live_date: string | null;
```

#### 3. Edit Organization Dialog

Add a date picker in the "Account Status" section of `EditOrganizationDialog.tsx`:

- Field Label: "Scheduled Go-Live Date"
- Component: Shadcn DatePicker (Popover + Calendar)
- Position: Below Onboarding Stage, next to Timezone
- Validation: Optional, must be a valid date if provided
- Helper text when date is in the past: "Date is in the past"

Form schema addition:
```typescript
go_live_date: z.string().optional().nullable(),
```

#### 4. Account Detail Page

In the "Account Details" card, display the go-live date with visual indicators:

```
📅 Go-Live: March 15, 2026          (future date - amber)
📅 Go-Live: January 28, 2026        (past/today - emerald if live, amber if not)
```

- Icon: `Target` (lucide-react) for scheduled go-live
- Color coding:
  - Emerald if stage is "live" and date is past (successfully went live)
  - Amber if date is approaching or past but stage is not yet "live"

#### 5. Accounts Table Enhancement

Add a "Go-Live" column to the accounts table:

| Scenario | Display |
|----------|---------|
| No date set | — |
| Future date (7+ days) | `Mar 15` (slate) |
| Approaching (within 7 days) | `Mar 15` (amber badge) |
| Past date, stage = live | `Feb 1` (emerald badge) |
| Past date, stage ≠ live | `Feb 1 🚨` (red badge - overdue) |

This provides at-a-glance visibility into which accounts are on track vs. overdue.

---

### Visual Design

**Edit Dialog Date Picker:**
```
┌─────────────────────────────────────────────┐
│ Account Status                              │
├─────────────────────────────────────────────┤
│ Status *            │ Onboarding Stage *    │
│ [Active        ▼]   │ [Training        ▼]   │
├─────────────────────────────────────────────┤
│ Subscription Plan   │ Timezone              │
│ [Standard      ▼]   │ [Central Time    ▼]   │
├─────────────────────────────────────────────┤
│ Scheduled Go-Live Date                      │
│ [📅 Pick a date                        ▼]   │
│ The date when final import completes and    │
│ the account begins live operations.         │
└─────────────────────────────────────────────┘
```

**Account Detail Display:**
```
Account Details
────────────────
🏢 Account #1234
📅 Created Jan 15, 2026
🎯 Go-Live Feb 28, 2026
✓  Activated Feb 28, 2026
```

---

### Technical Notes

- The `go_live_date` is a `DATE` type (not `TIMESTAMPTZ`) since we only need the calendar date, not a specific time
- This field is independent of the automatic `activated_at` timestamp - one is planned, the other is actual
- When `activated_at` is set, if no `go_live_date` was specified, optionally auto-populate it with the activation date
- The existing RLS policies for `organizations` will automatically apply to the new column

