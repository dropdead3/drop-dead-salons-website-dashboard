

# Secondary Roles (Responsibilities) System

## Concept

Introduce a **Responsibilities** layer that sits on top of primary roles. These are configurable leadership or specialty designations -- like "Culture Leader", "Education Leader", or "Onboarding Trainer" -- that can be assigned to any team member regardless of their primary role. Each responsibility can include:

- A name, icon, and color (just like roles)
- A description of what it entails
- Optional helper assets (checklists, resource links, training materials)
- Assignment to one or more team members

This keeps the core role system (Stylist, Admin, etc.) clean for access control, while responsibilities handle organizational structure and leadership duties.

## Database Changes

### New table: `responsibilities`
Stores the configurable responsibility definitions.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| organization_id | uuid | FK to organizations |
| name | text | e.g. "culture_leader" |
| display_name | text | e.g. "Culture Leader" |
| description | text | What this responsibility involves |
| icon | text | Icon name (reuse role icon picker) |
| color | text | Color key (reuse role color picker) |
| sort_order | integer | For ordering |
| is_active | boolean | Soft delete |
| created_at / updated_at | timestamptz | Auto-managed |

### New table: `responsibility_assets`
Helper resources attached to a responsibility.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| responsibility_id | uuid | FK |
| title | text | e.g. "Culture Leader Checklist" |
| type | text | "checklist", "link", "document", "training" |
| content | jsonb | Flexible payload (checklist items, URL, file path, training video ID) |
| sort_order | integer | |
| created_at | timestamptz | |

### New table: `user_responsibilities`
Junction table assigning responsibilities to users.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK to auth.users |
| responsibility_id | uuid | FK |
| assigned_by | uuid | Who assigned it |
| assigned_at | timestamptz | |
| unique(user_id, responsibility_id) | | Prevent duplicates |

All three tables will have RLS enabled with policies allowing Super Admins, Admins, and Managers to manage them, and authenticated users to read their own assignments.

## Frontend Changes

### 1. Role Config tab -- new "Responsibilities" sub-tab
Add a fourth sub-tab alongside Roles, Templates, and Defaults in the Role Config section of the Roles and Controls Hub. This sub-tab will have:
- A list of defined responsibilities with drag-and-drop reordering
- Create/edit/archive/delete actions (mirroring the Role Editor UX)
- An expandable section per responsibility showing its helper assets

### 2. Responsibility Assets editor
Within each responsibility card, an expandable panel to manage helper assets:
- Add checklists (with checkable items)
- Add external links
- Link to training hub videos
- Attach documents

### 3. User Roles tab -- show responsibilities
On the User Roles tab, show assigned responsibilities as secondary badges next to each user's primary role(s). Allow assigning/removing responsibilities from the same interface.

### 4. Team profile display
Show responsibility badges on team directory cards and individual profiles so the whole team knows who leads what.

### 5. New hooks
- `useResponsibilities()` -- fetch all active responsibilities ordered by sort_order
- `useUserResponsibilities(userId)` -- fetch a user's assigned responsibilities
- `useAssignResponsibility()` / `useRemoveResponsibility()` -- mutations
- `useResponsibilityAssets(responsibilityId)` -- fetch helper assets

### 6. Default seed responsibilities
Pre-populate common salon leadership responsibilities that can be customized:
- Culture Leader
- Education Leader
- Social Media Leader
- Onboarding Trainer
- Stylist Assistants Leader
- Coach

## Technical Details

**Files to create:**
- `src/hooks/useResponsibilities.ts` -- all data hooks
- `src/components/access-hub/ResponsibilitiesSubTab.tsx` -- management UI
- `src/components/access-hub/ResponsibilityCard.tsx` -- individual card with assets
- `src/components/access-hub/ResponsibilityAssetsEditor.tsx` -- helper assets CRUD
- `src/components/access-hub/AssignResponsibilityDialog.tsx` -- assign to users

**Files to modify:**
- `src/components/access-hub/RoleConfigTab.tsx` -- add Responsibilities sub-tab
- `src/components/access-hub/UserRolesTab.tsx` -- show responsibility badges, allow assignment
- `src/components/dashboard/team/` -- display responsibility badges on profiles

