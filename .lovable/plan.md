

# Add Step Selection to "Let's Implement" Dialog

## What's Missing

The action steps are currently read-only with no way to select which ones matter. You need to be able to scan the plan overview and check/uncheck individual steps before deciding how to route them.

## Change

Add a checkbox to each action step row. All steps start selected. The user deselects any they don't want to implement. Only selected steps get created as tasks, included in DMs, or copied to clipboard.

## Layout After Change

```text
Action Steps
  [x] 1. Power Fill Promotion
         Schedule targeted promos...    Due Feb 13
  [x] 2. Retail Attachment Push
         Train staff on add-on...       Due Feb 13
  [ ] 3. Rebooking Blitz
         Call last week's clients...    Due Feb 16

Route This Plan
  [x] Add to my tasks
  [ ] Share with team via DM
  [ ] Copy formatted plan

              Cancel    [Activate Plan]
```

## Technical Changes

### `ImplementPlanDialog.tsx`

1. **Add selection state**: New `selectedSteps` state as a `Set<number>` of indices, initialized with all steps selected when dialog opens.

2. **Checkbox on each step row**: Add a `Checkbox` to the left of each step's number. Clicking toggles that index in the set.

3. **Filter on activation**: `handleActivate`, `formatPlanForClipboard`, and `formatPlanForDM` all filter `steps` to only include indices in `selectedSteps`.

4. **Update validation**: `hasValidSteps` checks that at least one step is selected (not just that steps exist).

5. **Select All / Deselect All**: A small toggle link above the steps list ("Select all" / "Deselect all") for quick bulk control.

No new files. No database changes. Single file edit.
