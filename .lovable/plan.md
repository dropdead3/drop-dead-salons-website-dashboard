

# "Let's Implement" -- AI Plan-to-Action Workflow

## Overview

Replace the **Share** button on AI recovery plans with a **"Let's Implement"** button that opens a multi-step workflow. Instead of just reading Zura's recommendations, leadership can immediately break them into structured steps, add context, assign owners, and distribute the plan -- all without leaving the dialog.

## User Flow

```text
[Recovery Plan Dialog]
  Save Plan | Remind Me | Let's Implement
                              |
                    Click "Let's Implement"
                              |
                 +---------------------------+
                 | STEP 1: Review Action Steps |
                 |                           |
                 | Zura auto-extracts steps  |
                 | from the AI content:      |
                 |                           |
                 | [ ] Power Fill Promotion   |
                 |     Owner: [Select staff]  |
                 |     Due: [+2 days]         |
                 |     Notes: [editable]      |
                 |                           |
                 | [ ] Retail Attachment Push  |
                 |     Owner: [Select staff]  |
                 |     Due: [+3 days]         |
                 |     Notes: [editable]      |
                 |                           |
                 | [+ Add Custom Step]        |
                 |                           |
                 | Owner can edit titles,     |
                 | reorder, remove, or add    |
                 | their own steps.           |
                 |                           |
                 | Leadership Notes:          |
                 | [textarea for context]     |
                 |                           |
                 |      [Next ->]             |
                 +---------------------------+
                              |
                 +---------------------------+
                 | STEP 2: Distribute & Act   |
                 |                           |
                 | Choose one or more:        |
                 |                           |
                 | [x] Create my task list    |
                 |     -> Saves all steps to  |
                 |        your Tasks with     |
                 |        owners & due dates  |
                 |                           |
                 | [x] Share with team via DM |
                 |     -> Pick recipients,    |
                 |        sends formatted     |
                 |        plan + assignments  |
                 |                           |
                 | [ ] Post to a channel      |
                 |     -> Pick a Team Chat    |
                 |        channel to announce |
                 |                           |
                 | [ ] Copy formatted plan    |
                 |     -> Clipboard with      |
                 |        assignments         |
                 |                           |
                 |    [Execute Plan ->]        |
                 +---------------------------+
                              |
                        Confirmation
                  "Plan activated. 4 tasks
                   created, shared with 2
                   team members."
```

## What Changes

### 1. New Component: `ImplementPlanDialog`
A two-step dialog that replaces the Share button's functionality:

**Step 1 -- Review & Customize Steps:**
- Auto-extracts action items from the AI markdown (reuses existing `extractActionItems` logic, enhanced to also grab the description text after the bold title)
- Each step is editable: title, owner (staff picker dropdown), due date (quick-pick: tomorrow / 3 days / 1 week), and notes
- Owner can reorder steps (drag or up/down arrows), delete steps, or add custom ones
- A "Leadership Notes" textarea at the bottom for adding context that gets included when sharing

**Step 2 -- Distribute:**
- Checkboxes for distribution channels (multi-select):
  - **Create Task List**: Inserts each step into the `tasks` table with owner, due date, priority, and `source: 'ai_recovery_plan'`
  - **Share via DM**: Opens inline recipient picker (reuses `useTeamMembers` + `useDMChannels`), sends a formatted message with the plan + step assignments
  - **Post to Channel**: Channel picker from existing Team Chat channels, posts as a formatted announcement
  - **Copy to Clipboard**: Copies a clean, formatted version with assignments
- "Execute Plan" button runs all selected actions simultaneously

### 2. Modify `RecoveryPlanActions`
- Replace the **Share** dropdown button with **"Let's Implement"** button (uses a rocket or play icon)
- Keep Save Plan and Remind Me as-is
- The new button opens the `ImplementPlanDialog`

### 3. Enhanced Action Item Extraction
- Upgrade `extractActionItems()` to return structured objects: `{ title, description, suggestedDueInDays }` instead of just title strings
- Parse the markdown more intelligently to capture the text after each bold heading

## Technical Details

### New Files
- `src/components/dashboard/sales/ImplementPlanDialog.tsx` -- The two-step dialog with step editor and distribution options
- `src/components/dashboard/sales/PlanStepEditor.tsx` -- Individual step row component (title, owner picker, due date, notes)

### Modified Files
- `src/components/dashboard/sales/RecoveryPlanActions.tsx` -- Replace Share button with "Let's Implement" button; enhance `extractActionItems` to return structured objects
- `src/components/dashboard/sales/ShareToDMDialog.tsx` -- Minor: accept optional `assignments` prop to include step assignments in the message format

### Database
- No new tables needed. Tasks go into the existing `tasks` table. The `description` field will include assignment context (e.g., "From recovery plan: Weekly Goal Recovery Plan -- Assigned to: Sarah")

### Reused Infrastructure
- `useTeamMembers` hook for the owner/staff picker
- `useDMChannels` + `createDM` for DM distribution
- `useChatChannels` for channel posting
- Existing `tasks` table schema (title, description, due_date, priority, source, user_id)

### UI Standards
- Same dialog styling as existing Zura dialogs: `backdrop-blur-sm bg-black/60` overlay, `max-w-lg`, branded header with ZuraAvatar
- Step indicators (1/2) in the dialog header
- Smooth transitions between steps using framer-motion or CSS transitions

