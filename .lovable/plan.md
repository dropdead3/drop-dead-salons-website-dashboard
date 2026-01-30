
# Platform Account Notes System with Team Tagging

## Summary

Build a collaborative notes system for platform accounts that allows team members to leave notes, tag specific colleagues using @mentions (by role or individual), and receive notifications when tagged or when new comments are added. This enables cross-functional communication between admin and support teams on customer accounts.

---

## Current State Analysis

**What We Have:**
- `client_notes` table and `ClientNotesSection` component for client-level notes
- `notifications` table with real-time subscriptions for user alerts
- `platform_roles` table tracking platform team members with roles (owner, admin, support, developer)
- `usePlatformTeam` hook to fetch platform team members with profiles
- Platform-themed UI components (PlatformCard, PlatformButton, etc.)

**What's Missing:**
- No notes table for organization-level (account) notes
- No mention/tagging system for platform team members
- No notification triggers for account note mentions
- No UI for account notes in AccountDetail page

---

## Key Features to Implement

### 1. Account Notes
Store notes on organization accounts visible to platform team:
- Rich text notes with timestamps
- Author attribution with avatar
- Option for internal-only vs visible to org admins (future)

### 2. Team Tagging/Mentions
Support @mentions in notes:
- Tag by role: `@admin`, `@support`, `@developer`
- Tag by individual: `@Eric Day`
- Autocomplete dropdown while typing

### 3. Notifications
Alert tagged users when mentioned:
- Parse @mentions from note content
- Create notifications for tagged users
- Link to account detail page

### 4. Activity Feed
Show notes alongside key account events:
- Display in a new "Notes" or "Activity" tab
- Threaded replies (future enhancement)

---

## Database Schema

### New Table: `account_notes`

Stores notes on organization accounts:

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| organization_id | uuid | FK to organizations |
| author_id | uuid | FK to auth.users (platform team member) |
| content | text | Note content with @mentions |
| mentions | jsonb | Extracted mentions: `{users: [...], roles: [...]}` |
| is_internal | boolean | Whether note is internal-only (default true) |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### New Table: `account_note_mentions`

Junction table for tracking mentions (enables efficient querying):

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| note_id | uuid | FK to account_notes |
| mentioned_user_id | uuid | FK to auth.users (if individual mention) |
| mentioned_role | text | Role name (if role mention) |
| notified_at | timestamptz | When notification was sent |
| created_at | timestamptz | |

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                    Account Detail Page                           │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Tabs: Overview | Locations | Users | Imports | Billing    │ │
│  │        | Notes (NEW) | Settings                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Notes Tab (NEW)                          │ │
│  │  ┌────────────────────────────────────────────────────────┐│ │
│  │  │  Add Note Form                                          ││ │
│  │  │  ┌────────────────────────────────────────────────────┐││ │
│  │  │  │  Leave a note about this account...                │││ │
│  │  │  │  Type @ to mention team members                    │││ │
│  │  │  │                                                    │││ │
│  │  │  │  ┌─────────────────────────────┐                   │││ │
│  │  │  │  │ @admin - Notify all admins  │ (dropdown)        │││ │
│  │  │  │  │ @support - Notify support   │                   │││ │
│  │  │  │  │ @Eric Day                   │                   │││ │
│  │  │  │  │ @John Smith                 │                   │││ │
│  │  │  │  └─────────────────────────────┘                   │││ │
│  │  │  └────────────────────────────────────────────────────┘││ │
│  │  │                                       [Add Note]        ││ │
│  │  └────────────────────────────────────────────────────────┘│ │
│  │                                                             │ │
│  │  ┌────────────────────────────────────────────────────────┐│ │
│  │  │  Notes List                                             ││ │
│  │  │  ┌──────────────────────────────────────────────────┐  ││ │
│  │  │  │ [Avatar] Eric Day              Jan 30, 2026      │  ││ │
│  │  │  │ Client requested discount. Tagging @support for  │  ││ │
│  │  │  │ follow-up on their billing concerns.             │  ││ │
│  │  │  │                                        [Delete]  │  ││ │
│  │  │  └──────────────────────────────────────────────────┘  ││ │
│  │  │  ┌──────────────────────────────────────────────────┐  ││ │
│  │  │  │ [Avatar] Jane Support          Jan 29, 2026      │  ││ │
│  │  │  │ Resolved billing issue. Account now current.     │  ││ │
│  │  │  └──────────────────────────────────────────────────┘  ││ │
│  │  └────────────────────────────────────────────────────────┘│ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## UI Components to Create

### 1. AccountNotesSection
Main container component for the notes tab:
- Fetches and displays notes for the organization
- Handles add note form with mention support
- Follows platform UI theme (dark slate/violet)

### 2. AccountNoteCard
Individual note display:
- Author avatar and name
- Timestamp
- Content with highlighted @mentions
- Delete button for note author

### 3. MentionInput (or extend Textarea)
Rich input with @mention autocomplete:
- Detect @ character while typing
- Show dropdown with platform team members and roles
- Insert mention tag on selection
- Highlight mentions in display

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useAccountNotes.ts` | CRUD operations for account notes, mention parsing |
| `src/components/platform/notes/AccountNotesSection.tsx` | Main notes section component |
| `src/components/platform/notes/AccountNoteCard.tsx` | Individual note display |
| `src/components/platform/notes/MentionInput.tsx` | Textarea with @mention autocomplete |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/dashboard/platform/AccountDetail.tsx` | Add "Notes" tab with AccountNotesSection |
| Database migration | Create account_notes and account_note_mentions tables |

---

## Mention System Logic

### Mention Detection
Parse note content for @mentions using regex:
- `@admin`, `@support`, `@developer`, `@owner` - role mentions
- `@FirstName LastName` - individual mentions

### Autocomplete Data
Fetch from platform team:
- Role options: Admin, Support, Developer, Owner
- Individual options: All platform team members with names

### Notification Creation
When saving a note:
1. Parse mentions from content
2. Resolve role mentions to user IDs (all users with that role)
3. Insert notifications for each mentioned user
4. Store mention records in junction table

```text
createAccountNote(content, orgId):
  1. Parse mentions from content
  2. Insert account_note record
  3. For each mention:
     - If role mention: get all users with that role
     - If user mention: use that user ID
  4. Insert notifications for each unique user:
     - Type: 'account_mention'
     - Title: 'You were mentioned in an account note'
     - Message: 'Author mentioned you on Organization Name'
     - Link: '/dashboard/platform/accounts/{orgId}'
  5. Insert account_note_mentions records
```

---

## Security & RLS

### account_notes
- **SELECT**: Platform users can view all notes
- **INSERT**: Platform users can create notes
- **DELETE**: Only note author can delete their own notes

### account_note_mentions
- **SELECT**: Platform users can view all
- **INSERT**: System inserts via note creation

RLS Policies:
```sql
-- Platform users can view all account notes
CREATE POLICY "Platform users can view account notes"
ON account_notes FOR SELECT
TO authenticated
USING (public.is_platform_user(auth.uid()));

-- Platform users can create notes
CREATE POLICY "Platform users can create account notes"
ON account_notes FOR INSERT
TO authenticated
WITH CHECK (public.is_platform_user(auth.uid()) AND auth.uid() = author_id);

-- Authors can delete their own notes
CREATE POLICY "Authors can delete own notes"
ON account_notes FOR DELETE
TO authenticated
USING (auth.uid() = author_id);
```

---

## Implementation Phases

### Phase 1: Database & Core Hook
1. Create `account_notes` table with RLS policies
2. Create `account_note_mentions` table with RLS policies
3. Build `useAccountNotes` hook with CRUD operations
4. Implement mention parsing utility

### Phase 2: Notes UI
1. Create `AccountNoteCard` component (platform themed)
2. Create `AccountNotesSection` with note list
3. Add basic note form (without mention autocomplete)
4. Integrate into AccountDetail page as new tab

### Phase 3: Mention System
1. Build `MentionInput` component with autocomplete
2. Add platform team/roles fetching for suggestions
3. Highlight @mentions in displayed notes
4. Integrate MentionInput into notes form

### Phase 4: Notifications
1. Add notification creation to note submission
2. Parse mentions and create notifications for tagged users
3. Link notifications to account detail page
4. Test real-time notification delivery

---

## Visual Design

**Note Card Styling (Platform Theme)**
- Background: `slate-800/50` with `slate-700/50` border
- Author avatar with initials fallback
- Mention highlights: `violet-500/20` background with `violet-400` text
- Timestamp: `slate-500` text
- Delete button: Ghost style, visible on hover

**Mention Dropdown**
- Position below cursor in textarea
- Dark background (`slate-800`) with `slate-700` border
- Role mentions at top (with icons): Crown, Shield, Headphones, Code
- Divider line
- Individual team members below with avatars
- Keyboard navigation support

---

## Notification Format

When a user is mentioned:
```json
{
  "user_id": "mentioned-user-uuid",
  "type": "account_mention",
  "title": "Mentioned in account note",
  "message": "Eric Day mentioned you on Drop Dead Salons",
  "link": "/dashboard/platform/accounts/fa23cd95-...",
  "metadata": {
    "note_id": "note-uuid",
    "organization_id": "org-uuid",
    "author_id": "author-uuid",
    "mention_type": "individual" // or "role"
  }
}
```
