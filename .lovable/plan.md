

# Client Contact Editing, Archiving, and Marketing Preferences

## Overview

Three capabilities being added to the Client Directory:

1. **Edit client contact info** -- inline editing of name, email, phone, birthday, and client_since from the detail sheet
2. **Archive clients** (super_admin only) -- soft-archive instead of delete, which stops all marketing and hides from default views
3. **Marketing subscription visibility and admin controls** -- show email/SMS opt-in status, let admins toggle marketing on or off per client

---

## Database Changes

### 1. Add columns to `phorest_clients`

| Column | Type | Default | Purpose |
|---|---|---|---|
| `is_archived` | boolean | false | Soft-archive flag (no deletion) |
| `archived_at` | timestamptz | NULL | When archived |
| `archived_by` | uuid | NULL | Who archived |
| `sms_opt_out` | boolean | false | SMS marketing opt-out flag |

### 2. Add `sms_opt_out` column to `client_email_preferences`

The existing table tracks `marketing_opt_out` (email). We add `sms_opt_out` to track SMS separately at the org level, but for simplicity we'll also put `sms_opt_out` directly on `phorest_clients` since clients aren't scoped to org in that table.

Actually, since `client_email_preferences` already exists and is org-scoped, we'll add `sms_opt_out` there. But for the detail sheet (which queries `phorest_clients`), we'll query `client_email_preferences` separately. That keeps existing email compliance flows intact.

**Final approach:** Add `is_archived`, `archived_at`, `archived_by` to `phorest_clients`. Use existing `client_email_preferences` for email opt-out and add `sms_opt_out` boolean there.

---

## UI Changes

### 1. Client Detail Sheet -- Edit Mode

- Add an "Edit" button (pencil icon) in the contact info card header
- Toggles fields to editable inputs: name, email, phone, birthday, client_since
- Save/Cancel buttons appear in edit mode
- Mutation updates `phorest_clients` directly
- Available to admin, manager, super_admin, receptionist roles

### 2. Client Detail Sheet -- Archive Button

- Replace the "Ban Client" area with a section that includes both Ban and Archive
- Archive button: only visible to super_admin
- Shows confirmation dialog: "Archiving stops all marketing and hides this client from default views. They can be restored later."
- Archived clients get a visual indicator (muted/grayed) and an "Archived" badge
- Archived clients are hidden from default directory views but visible via a new "Archived" filter tab

### 3. Marketing Status Display

- In the Contact Information card, show subscription badges:
  - Email: green "Subscribed" or red "Unsubscribed" badge
  - SMS: green "Subscribed" or red "Unsubscribed" badge
- Admin/super_admin can toggle these via switches next to each badge
- Toggling email updates `client_email_preferences.marketing_opt_out`
- Toggling SMS updates `client_email_preferences.sms_opt_out`

### 4. Client Directory -- Archived Tab

- Add "Archived" tab alongside Banned tab (only visible when archived clients exist)
- Archived clients hidden from All/VIP/At Risk/New tabs by default
- Stats exclude archived clients

---

## Files Modified

1. **New migration SQL** -- Add `is_archived`, `archived_at`, `archived_by` to `phorest_clients`; add `sms_opt_out` to `client_email_preferences`
2. **`src/components/dashboard/ClientDetailSheet.tsx`** -- Add edit mode for contact fields, marketing status display with toggles, archive button for super_admin
3. **`src/pages/dashboard/ClientDirectory.tsx`** -- Filter out archived clients by default, add Archived tab, update stats
4. **`src/components/dashboard/clients/BanClientToggle.tsx`** -- No changes needed (ban stays separate from archive)
5. **New: `src/components/dashboard/clients/ArchiveClientToggle.tsx`** -- Archive/restore dialog, super_admin only
6. **New: `src/components/dashboard/clients/ClientMarketingStatus.tsx`** -- Marketing subscription display and admin toggle controls

## Technical Notes

- Editing contact info is a direct update to `phorest_clients` -- this does NOT sync back to Phorest (local-only edit). A note in the UI will clarify this.
- Archive is a soft operation: `is_archived = true`. No data is deleted. Archived clients are excluded from marketing email/SMS processing.
- The `client_email_preferences` table is org-scoped; we'll need to query it with the organization context when displaying/toggling preferences in the detail sheet.
- The existing email compliance flow in `email-sender.ts` already checks `marketing_opt_out`. The SMS flow (Twilio) will need a similar check against `sms_opt_out` in a future update.

