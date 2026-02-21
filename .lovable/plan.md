

# Merge Client Utility -- Full Scope Build Plan

## Overview

A comprehensive client merge system that consolidates duplicate profiles safely, enforces identity requirements on client creation, introduces placeholder client state, and provides full audit trail with 7-day undo capability.

## Architecture Summary

```text
Database Layer
  |-- clients table enhancements (status, merge fields, normalized identity, placeholder flag)
  |-- client_merge_log (audit trail + undo snapshots)
  |-- client_merge_reparenting_log (per-table move counts)
  |-- New permission: client_merge
  |-- DB function: merge_clients() -- atomic reparenting in a single transaction

Edge Function
  |-- merge-clients: executes the merge atomically server-side (too many tables for client-side)
  |-- undo-merge: reverses merge within 7-day window

UI Layer
  |-- MergeClientsPage (/dashboard/admin/merge-clients)
  |-- MergeWizard component (select, compare, resolve, confirm)
  |-- DuplicateDetectionModal (on client create)
  |-- Placeholder client badge + restrictions
  |-- Merged profile redirect + banner
  |-- Entry points: Management Hub card, Client Directory row/bulk actions
```

---

## Phase 1: Database Schema Changes

### 1A. Enhance `clients` table

Add columns to the existing `clients` table:

| Column | Type | Purpose |
|--------|------|---------|
| `status` | TEXT | 'active', 'archived', 'merged' (default 'active') |
| `merged_into_client_id` | UUID (FK self) | Points to primary after merge |
| `merged_at` | TIMESTAMPTZ | When merge occurred |
| `merged_by` | UUID | Who performed merge |
| `is_placeholder` | BOOLEAN | true = no email/phone, restricted |
| `email_normalized` | TEXT | lowercase trimmed email for dedup |
| `phone_normalized` | TEXT | E.164 normalized phone for dedup |

Indexes on `email_normalized` and `phone_normalized` for fast duplicate lookups.

### 1B. Create `client_merge_log` table

Stores full audit trail for each merge operation:

| Column | Type |
|--------|------|
| `id` | UUID PK |
| `organization_id` | UUID FK |
| `primary_client_id` | UUID FK clients |
| `secondary_client_ids` | UUID[] |
| `performed_by` | UUID |
| `performed_at` | TIMESTAMPTZ |
| `field_resolutions` | JSONB (which value was chosen per field) |
| `before_snapshots` | JSONB (identity fields before merge) |
| `reparenting_counts` | JSONB ({appointments: X, invoices: Y, ...}) |
| `is_undone` | BOOLEAN default false |
| `undone_at` | TIMESTAMPTZ |
| `undone_by` | UUID |
| `undo_expires_at` | TIMESTAMPTZ (performed_at + 7 days) |

RLS: org-scoped, admin/manager read, client_merge permission for write.

### 1C. Add `client_merge` permission

Insert into `permissions` table so it can be assigned to roles via the Access Hub.

### 1D. Migrate `phorest_clients` data

Since you chose "migrate to clients table first":
- Create a migration that inserts all `phorest_clients` records not yet in `clients` (matching on `external_id = phorest_client_id`)
- Map FK references: add `phorest_client_id` as `external_id` on `clients` for cross-reference
- Add `client_id` UUID column to tables currently using `phorest_client_id` text references (e.g., `phorest_appointments`) and backfill via lookup
- This migration is data-only and non-destructive -- `phorest_clients` remains but becomes read-only legacy

**Important**: This migration step is large. It will be a dedicated SQL migration with careful backfill logic.

---

## Phase 2: Edge Function -- `merge-clients`

Server-side function that performs the merge atomically:

**Input**: `{ primaryClientId, secondaryClientIds[], fieldResolutions, organizationId }`

**Process**:
1. Validate caller has `client_merge` permission
2. Snapshot identity fields of all clients (before state)
3. Apply field resolutions to primary client record
4. Re-parent all child records across 19 tables:
   - `appointments` (client_id)
   - `archived_appointments` (client_id)
   - `phorest_appointments` (phorest_client_id -- via external_id mapping)
   - `client_notes` (client_id) -- append with attribution
   - `client_balances` (client_id) -- merge balances additively
   - `balance_transactions` (client_id)
   - `client_loyalty_points` (client_id) -- merge points additively
   - `points_transactions` (client_id)
   - `client_email_preferences` (client_id) -- never override opt-out
   - `client_feedback_responses` (client_id)
   - `client_form_signatures` (client_id)
   - `client_portal_tokens` (client_id)
   - `client_automation_log` (client_id)
   - `email_send_log` (client_id)
   - `reengagement_outreach` (client_id)
   - `refund_records` (client_id)
   - `promotion_redemptions` (client_id)
   - `kiosk_analytics` (client_id)
   - `service_email_queue` (client_id)
   - Vouchers: `issued_to_client_id`, `redeemed_by_client_id`
5. Mark secondary clients: `status = 'merged'`, `merged_into_client_id = primary`, `merged_at`, `merged_by`
6. Log to `client_merge_log` with all counts and snapshots
7. Set `undo_expires_at = now() + interval '7 days'`

**Output**: `{ success, mergeLogId, reparentingCounts }`

---

## Phase 3: Edge Function -- `undo-merge`

**Input**: `{ mergeLogId }`

**Process**:
1. Validate merge is within 7-day undo window
2. Validate caller has `client_merge` permission
3. Restore secondary client records from `before_snapshots`
4. Re-parent child records back using the stored log (reverse the UPDATE SET client_id queries)
5. Restore secondary client `status = 'active'`, clear merge fields
6. Mark merge log `is_undone = true`

**Constraint**: If the primary client has received NEW data since the merge (new appointments, new notes), those stay with the primary. Only the originally-reparented records move back.

---

## Phase 4: Client Creation Enhancements

### 4A. Duplicate Detection Hook (`useDuplicateDetection`)

When creating a Full Client (has email or phone):
- Query `clients` for matching `email_normalized` or `phone_normalized`
- Return potential duplicates with name, last visit, total spend

### 4B. Duplicate Detection Modal

Shown before saving a new Full Client if duplicates found:
- Lists matching clients with key info
- Actions: "Open Existing" / "Start Merge" / "Create Anyway" (permission-gated)

### 4C. Placeholder Client State

- `is_placeholder = true` when client has first_name + last_name but no email/phone
- Visual badge in Client Directory and ClientDetailSheet
- Restrictions enforced in hooks:
  - Block automated messaging, review requests, receipts
  - Prompt "Add phone or email to complete profile" when restricted action triggered
  - Post-checkout prompt to add contact info (dismissible, logged)

### 4D. Normalization on Save

- `email_normalized`: `email.trim().toLowerCase()`
- `phone_normalized`: strip non-digits, prepend country code (org default)
- Computed via DB trigger on INSERT/UPDATE to `clients`

---

## Phase 5: Merge UI

### 5A. Merge Wizard Page (`/dashboard/admin/merge-clients`)

Four-step wizard:

**Step 1 -- Select Clients**: Search and select 2+ client profiles. Show name, email, phone, last visit, total spend for quick identification.

**Step 2 -- Choose Primary**: Select which client survives. Show record counts per client (appointments, notes, balances) to inform the decision.

**Step 3 -- Resolve Conflicts**: Side-by-side field comparison:
- First name, last name
- Email(s) with primary selection
- Phone(s) with primary selection
- Address, birthday
- Preferred stylist, preferred location
- Tags, notes (append with attribution by default)
- Communication consent (never auto-override opt-out; explicit selection required)

Each field shows both values with radio selection for which to keep.

**Step 4 -- Confirm**: Summary showing:
- Primary client identity
- What will move (X appointments, Y notes, Z balance amount, etc.)
- Typed confirmation: user must type "MERGE" to proceed

### 5B. Entry Points

1. **Management Hub** -- new card under "Client Experience" or new "Utilities" section:
   - Icon: `Merge` or `GitMerge`
   - Title: "Merge Clients"
   - Route: `/dashboard/admin/merge-clients`

2. **Client Directory**:
   - Row action (three-dot menu): "Merge" -- pre-selects that client, opens wizard
   - Bulk action: "Merge Selected" (shown when 2+ clients checked)
   - Filter toggle: "Show merged profiles" (off by default)

3. **Client Detail Sheet**: "Merge" button in actions area

### 5C. Merged Profile Redirect

When opening a client with `status = 'merged'`:
- Redirect to the primary client profile
- Show banner: "This profile was merged into [Primary Name] on [date] by [user]. View audit log."
- Link to audit log entry

### 5D. Merge Request (Non-Permitted Roles)

If user lacks `client_merge` permission:
- "Merge" action becomes "Request Merge"
- Creates a task assigned to managers with client IDs and requester info
- Uses existing tasks system

---

## Phase 6: Undo UI

- In the merge audit log (accessible from Management Hub or merged profile banner), show "Undo Merge" button if within 7-day window
- Confirmation dialog explaining what will be reversed
- After undo, both profiles return to active state

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/merge-clients/index.ts` | Merge execution edge function |
| `supabase/functions/undo-merge/index.ts` | Undo merge edge function |
| `src/hooks/useClientMerge.ts` | Merge execution + undo mutations |
| `src/hooks/useDuplicateDetection.ts` | Duplicate check on client create |
| `src/hooks/useMergeAuditLog.ts` | Fetch merge history |
| `src/pages/dashboard/admin/MergeClients.tsx` | Merge wizard page |
| `src/components/dashboard/clients/merge/MergeWizard.tsx` | Multi-step wizard |
| `src/components/dashboard/clients/merge/ClientSelector.tsx` | Step 1 |
| `src/components/dashboard/clients/merge/PrimarySelector.tsx` | Step 2 |
| `src/components/dashboard/clients/merge/ConflictResolver.tsx` | Step 3 |
| `src/components/dashboard/clients/merge/MergeConfirmation.tsx` | Step 4 |
| `src/components/dashboard/clients/merge/MergedProfileBanner.tsx` | Redirect banner |
| `src/components/dashboard/clients/DuplicateDetectionModal.tsx` | Pre-create dupe check |
| `src/components/dashboard/clients/PlaceholderBadge.tsx` | Visual placeholder flag |

## Files to Edit

| File | Change |
|------|--------|
| `src/pages/dashboard/admin/ManagementHub.tsx` | Add Merge Clients card |
| `src/pages/dashboard/ClientDirectory.tsx` | Add merge row/bulk actions, merged filter toggle |
| `src/components/dashboard/ClientDetailSheet.tsx` | Add merge button, merged redirect banner |
| `src/hooks/useClientsData.ts` | Filter out merged clients by default, add placeholder computed field |
| `src/App.tsx` | Add route for `/dashboard/admin/merge-clients` |
| `src/config/dashboardNav.ts` | Add nav entry (if needed) |

## Database Migrations (6 total)

1. Add columns to `clients` table (status, merge fields, placeholder, normalized fields)
2. Create `client_merge_log` table with RLS
3. Insert `client_merge` permission
4. Create normalization trigger on `clients`
5. Create duplicate-check DB function
6. Backfill `phorest_clients` into `clients` (data migration)

---

## Technical Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| phorest_appointments uses text `phorest_client_id` not UUID FK | Re-parent via `external_id` mapping in edge function; don't break existing POS sync |
| Additive balance merge could double-count | Edge function sums balances explicitly, marks secondary balance record inactive |
| Undo after new data arrives on primary | Only reverse originally-reparented records (tracked in log); new data stays |
| Large merge across 19 tables | Edge function uses DB transaction; all-or-nothing |
| Concurrent merges on same client | DB-level advisory lock on client IDs during merge |

---

## Prompt Feedback

This was an exceptionally well-structured prompt. The field-by-field conflict resolution spec, the explicit listing of re-parenting targets, the permission model, and the undo requirements gave clear engineering boundaries. Two suggestions for future prompts of this scale:

1. **Call out the dual-table situation explicitly** -- you have `phorest_clients` and `clients` tables. Mentioning which one is canonical up front would have saved exploration time.
2. **Sequence dependencies** -- for features this large, indicating which pieces are blockers vs. can be parallelized helps prioritize (e.g., "merge flow is the MVP; placeholder restrictions can follow").

