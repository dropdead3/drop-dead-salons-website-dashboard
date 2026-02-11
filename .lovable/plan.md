

# Simplify "Let's Implement" to an Approve & Route Flow

## What Changes

The current two-step wizard with editable task forms gets replaced by a **single-screen approval flow**. The mental model shifts from "edit a plan" to "approve Zura's plan and decide where to send it."

## New Layout (Single Screen)

```text
+----------------------------------+
| [Zura] Let's Implement           |
| "Approve Zura's plan and route   |
|  it to your team"                |
+----------------------------------+
|                                  |
| Plan: Weekly Goal Recovery       |
|                                  |
| Action Steps (read-only):        |
|  1. Power Fill Promotion         |
|     Schedule targeted promos...  |
|  2. Retail Attachment Push       |
|     Train staff on add-on...     |
|  3. Rebooking Blitz              |
|     Call last week's clients...  |
|                                  |
| + Add leadership note (toggle)   |
|   [textarea if expanded]         |
|                                  |
| --- Route This Plan ---          |
|                                  |
| [x] Add to my tasks             |
| [ ] Share with team via DM       |
| [ ] Copy formatted plan          |
|                                  |
|         [Activate Plan ->]       |
+----------------------------------+
```

## Key Design Decisions

1. **Read-only steps**: Steps extracted from AI content display as a clean numbered list with title + description. No inputs, no owner pickers, no due date selectors. The leader is approving, not editing.

2. **Single screen**: No Step 1 / Step 2 wizard. Everything visible at once -- scan the plan, pick routing options, click activate.

3. **Leadership note collapsed**: Hidden behind a "+ Add leadership note" toggle to save space. Only shown when the leader has something to add.

4. **Same distribution options**: Create tasks, Share via DM, Copy to clipboard -- but presented more compactly.

5. **Success state**: After clicking "Activate Plan", the dialog shows a brief confirmation and auto-closes after 2 seconds.

## Technical Changes

### `ImplementPlanDialog.tsx` -- Major refactor
- Remove the `currentStep` state machine (no more Step 1 / Step 2)
- Remove all step editing logic (`updateStep`, `removeStep`, `moveStep`, `addStep`)
- Display extracted steps as read-only list items (simple divs, not `PlanStepEditor` components)
- Move distribution checkboxes onto the same screen below the steps
- Collapse leadership notes behind a toggle
- Auto-close dialog 2 seconds after successful activation
- Remove step indicator dots from header

### `PlanStepEditor.tsx` -- Delete or keep unused
- No longer imported by `ImplementPlanDialog`
- Can be kept in codebase for potential future use, but removed from the dialog import

### `RecoveryPlanActions.tsx` -- No changes needed
- Already has the correct "Let's Implement" button wiring

### Task creation logic stays the same
- Steps still get inserted into `tasks` table with `source: 'ai_recovery_plan'` and `priority: 'high'`
- Due dates auto-assigned based on step position (first 2 steps: +2 days, next 2: +5 days, rest: +7 days) -- no user input needed

