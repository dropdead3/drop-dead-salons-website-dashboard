

# Refine and Complete the Campaigns System

## Overview
This plan covers all the gaps identified in the approved refinement plan, plus adding creation date badges across all campaign surfaces.

## Changes

### 1. New CRUD Hooks (`src/hooks/useActionCampaigns.ts`)
Add four new mutations:
- **useDeleteCampaign** -- Deletes a campaign by ID (cascade handles tasks)
- **useUpdateCampaign** -- Updates name, description, and leadership_note
- **useAddCampaignTask** -- Inserts a new task into an existing campaign
- **useDeleteCampaignTask** -- Removes a single task

All invalidate relevant query keys on success.

### 2. Campaign Detail Page (`src/pages/dashboard/CampaignDetail.tsx`)
- **Delete**: Add a delete button with AlertDialog confirmation. On delete, navigate back to `/dashboard/campaigns`.
- **Reactivate**: When status is `completed` or `archived`, show a "Reactivate" button that sets status back to `active`.
- **Inline Edit**: Make campaign name editable (click-to-edit Input). Make leadership note editable with an edit toggle.
- **Add Task**: An inline "Add task" input row at the bottom of the task list for quick task creation.
- **Remove Task**: A trash icon on each task row.
- **Creation Date Badge**: Already shows "Created MMM d, yyyy" -- will convert to a styled Badge component for visual consistency.

### 3. Campaigns List Page (`src/pages/dashboard/Campaigns.tsx`)
- **Creation Date Badges**: Add a small Badge on each campaign card showing the creation date (e.g., "Feb 12").
- **Next Due Date**: Fetch earliest incomplete task due date per campaign and display "Next due: Feb 14" on each card.

### 4. Active Campaigns Dashboard Card (`src/components/dashboard/ActiveCampaignsCard.tsx`)
- **Clickable Cards**: Wrap each campaign in a `Link` to its detail page.
- **"View All" Link**: Add a link to `/dashboard/campaigns` in the header.
- **Empty State**: Instead of returning `null`, show a subtle "No active campaigns" message.
- **Creation Date Badge**: Add a small date badge on each campaign row.

### 5. Analytics Tab (`src/components/dashboard/analytics/CampaignsTabContent.tsx`)
- **Creation Date Badge**: The date already appears as text -- will convert to a styled Badge for consistency across all surfaces.

### 6. Implement Dialog Channel Sharing (`src/components/dashboard/sales/ImplementPlanDialog.tsx`)
- Add a "Post to a channel" checkbox in the distribution options (alongside DM and clipboard).
- After campaign creation, if checked, open the `ShareToChannelDialog`.

### 7. No Database Changes
The existing schema supports all of these features. No migrations needed.

---

## Technical Details

### New Hooks (useActionCampaigns.ts)

```text
useDeleteCampaign()
  DELETE FROM action_campaigns WHERE id = $id
  onSuccess: invalidate ['action-campaigns'], navigate back

useUpdateCampaign()
  UPDATE action_campaigns SET name, description, leadership_note WHERE id = $id
  onSuccess: invalidate ['action-campaigns', 'action-campaign']

useAddCampaignTask()
  INSERT INTO action_campaign_tasks (campaign_id, title, priority, sort_order)
  onSuccess: invalidate ['action-campaign']

useDeleteCampaignTask()
  DELETE FROM action_campaign_tasks WHERE id = $id
  onSuccess: invalidate ['action-campaign']
```

### Creation Date Badge Component Pattern
All surfaces will use a consistent pattern:

```text
<Badge variant="outline" className="text-[10px] gap-1">
  <Calendar className="w-2.5 h-2.5" />
  {format(new Date(campaign.created_at), 'MMM d')}
</Badge>
```

### CampaignDetail.tsx -- Delete Flow
Uses AlertDialog from Radix for confirmation before deletion. On confirm, calls useDeleteCampaign and navigates to campaigns list.

### CampaignDetail.tsx -- Inline Edit Pattern
Campaign name uses a controlled Input that appears on click, saves on blur or Enter. Leadership note uses a similar toggle pattern with a Textarea.

### CampaignDetail.tsx -- Add Task Row
A simple Input at the bottom of the task list. On Enter, creates a task with default priority "medium" and appends it to the campaign.

### File Change Summary

| File | Changes |
|------|---------|
| `src/hooks/useActionCampaigns.ts` | Add 4 new mutation hooks |
| `src/pages/dashboard/CampaignDetail.tsx` | Delete, reactivate, inline edit, add/remove tasks, creation date badge |
| `src/pages/dashboard/Campaigns.tsx` | Creation date badges, next due date display |
| `src/components/dashboard/ActiveCampaignsCard.tsx` | Clickable cards, View All link, empty state, creation date badge |
| `src/components/dashboard/analytics/CampaignsTabContent.tsx` | Creation date badge styling |
| `src/components/dashboard/sales/ImplementPlanDialog.tsx` | Channel sharing checkbox + dialog trigger |

