

# Show "No service providers in system yet" when dropdown is empty

## What Changes

In the **New Client Dialog** (`NewClientDialog.tsx`), when the Preferred Stylist dropdown has no service providers (because none exist in the system yet), show a descriptive disabled message instead of only "None."

## Technical Details

**File:** `src/components/dashboard/schedule/NewClientDialog.tsx`

### Preferred Stylist Select (lines 383-390)

Add a conditional empty-state item inside `SelectContent`:

- When `teamMembers` is empty or undefined, show a disabled `SelectItem` with text: **"No service providers in system yet"**
- Keep the existing "None" option so users can still explicitly choose no preference
- The empty-state item will be styled with `text-muted-foreground` and disabled so it's informational only

```
<SelectContent>
  <SelectItem value="none">None</SelectItem>
  {(!teamMembers || teamMembers.length === 0) && (
    <div className="px-3 py-2 text-sm text-muted-foreground text-center">
      No service providers in system yet
    </div>
  )}
  {teamMembers?.map(member => (
    <SelectItem key={member.user_id} value={member.user_id}>
      {member.display_name || member.full_name}
    </SelectItem>
  ))}
</SelectContent>
```

This follows the advisory-first copy tone -- informational, not shame-based -- and aligns with existing empty-state patterns used elsewhere in the platform (e.g., WalkInDialog, LeadAssignmentDialog).

