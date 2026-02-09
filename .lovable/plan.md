
# Improve PIN Management UI Intuitiveness

## Problem

The current Team PIN Management interface uses a small reset icon (`RotateCcw`) button that users have to guess at. This isn't intuitive - users don't immediately know what action will happen when they click it.

## Solution

Replace the icon-only button with a clearer, action-oriented design that adapts based on the user's current PIN state:

1. **For users without a PIN**: Show a "Set PIN" button
2. **For users with a PIN**: Show a "Manage" button with a dropdown menu containing:
   - "Change PIN" option
   - "Clear PIN" option

This provides clear, explicit actions instead of a mysterious reset icon.

## File to Modify

### `src/components/access-hub/TeamPinManagementTab.tsx`

**Change 1: Add new imports**

Add `DropdownMenu` components and additional icons:
```typescript
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
```

**Change 2: Add action mode state**

Track whether we're setting or clearing a PIN:
```typescript
const [actionMode, setActionMode] = useState<'set' | 'clear'>('set');
```

**Change 3: Update dialog opener to accept action mode**

```typescript
const handleOpenResetDialog = (member: typeof teamMembers[0], mode: 'set' | 'clear' = 'set') => {
  setSelectedMember(member);
  setNewPin('');
  setReason('');
  setActionMode(mode);
  setResetDialogOpen(true);
};
```

**Change 4: Replace the button in the member row**

Replace the icon-only button with clear action buttons:

```typescript
{canReset && (
  <>
    {!member.has_pin ? (
      // No PIN - show "Set PIN" button
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleOpenResetDialog(member, 'set')}
        className="gap-1.5"
      >
        <Plus className="w-3.5 h-3.5" />
        Set PIN
      </Button>
    ) : (
      // Has PIN - show dropdown with options
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            Manage
            <MoreHorizontal className="w-3.5 h-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleOpenResetDialog(member, 'set')}>
            <Pencil className="w-4 h-4 mr-2" />
            Change PIN
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleOpenResetDialog(member, 'clear')}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear PIN
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )}
  </>
)}
```

**Change 5: Update Dialog title and description based on action mode**

```typescript
<DialogHeader>
  <DialogTitle className="flex items-center gap-2">
    {actionMode === 'clear' ? (
      <>
        <Trash2 className="w-5 h-5" />
        Clear PIN for {selectedMember?.name}
      </>
    ) : selectedMember?.has_pin ? (
      <>
        <Pencil className="w-5 h-5" />
        Change PIN for {selectedMember?.name}
      </>
    ) : (
      <>
        <Plus className="w-5 h-5" />
        Set PIN for {selectedMember?.name}
      </>
    )}
  </DialogTitle>
  <DialogDescription>
    {actionMode === 'clear' 
      ? 'This will remove the PIN and disable quick login for this user.'
      : selectedMember?.has_pin 
        ? 'Enter a new 4-digit PIN to replace the existing one.'
        : 'Create a 4-digit PIN to enable quick login for this user.'}
  </DialogDescription>
</DialogHeader>
```

**Change 6: Adjust the input section for clear mode**

```typescript
{actionMode !== 'clear' && (
  <div className="space-y-2">
    <Label htmlFor="reset-pin">New PIN</Label>
    {/* existing input code */}
  </div>
)}

{actionMode === 'clear' && (
  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
    <p className="text-sm text-destructive">
      This user will no longer be able to use quick PIN login until a new PIN is set.
    </p>
  </div>
)}
```

**Change 7: Update confirm button text**

```typescript
<Button 
  onClick={handleResetPin}
  disabled={(actionMode !== 'clear' && newPin.length > 0 && newPin.length < 4) || adminSetPin.isPending}
  variant={actionMode === 'clear' ? 'destructive' : 'default'}
>
  {adminSetPin.isPending 
    ? 'Saving...' 
    : actionMode === 'clear' 
      ? 'Clear PIN' 
      : selectedMember?.has_pin 
        ? 'Update PIN' 
        : 'Set PIN'}
</Button>
```

## Visual Result

**Before:**
- Icon-only button that's hard to interpret
- Same dialog for all actions

**After:**
- "Set PIN" button for users without a PIN
- "Manage" dropdown for users with a PIN (Change/Clear options)
- Contextual dialog titles and descriptions
- Clear destructive styling for "Clear PIN" action

## Benefits

1. **Self-explanatory actions** - Users immediately understand what each button does
2. **Contextual UI** - Different states show different, appropriate options
3. **Safer destructive actions** - Clearing a PIN is visually distinct and requires explicit selection
4. **Better UX patterns** - Follows common UI conventions for manage/edit flows
