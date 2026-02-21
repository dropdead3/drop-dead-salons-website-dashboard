

## Undo Feature for Services Page

### Approach

Rather than a traditional Ctrl+Z undo (which gets complex with server-side mutations), this implements a **toast-based undo pattern** -- the same pattern used by Gmail, Slack, and Google Docs. After any destructive or significant action, a toast appears with an "Undo" button that reverses the operation within a few seconds.

### How It Works

1. When you archive a category or service, toggle active/inactive, reorder categories, or delete a service, a toast appears at the bottom of the screen
2. The toast shows what happened (e.g., "Archived 'Balayage'") with an **Undo** button
3. Clicking Undo reverses the action immediately
4. The toast auto-dismisses after 6 seconds -- after that, the action is final

### Actions That Support Undo

| Action | Undo Behavior |
|--------|--------------|
| Archive category | Restores category (and its services) |
| Archive service | Restores service |
| Toggle service active/inactive | Toggles back |
| Reorder categories | Reverts to previous order |
| Permanently delete (owner only) | No undo -- this remains a confirmed action with dialog |

### Technical Details

**New utility: `useUndoToast` hook**

A small custom hook that wraps the existing `sonner` toast with undo capability:

```
function useUndoToast() {
  return (message, undoFn) => {
    toast(message, {
      action: { label: 'Undo', onClick: undoFn },
      duration: 6000,
    });
  };
}
```

**File: `ServicesSettingsContent.tsx`**

Each handler gets an undo callback:

- **Archive category**: On success, show toast with undo that calls `restoreCategory.mutate()`
- **Archive service**: On success, show toast with undo that calls `restoreService.mutate()`
- **Toggle active**: On success, show toast with undo that toggles back
- **Reorder**: Capture previous order before drag, show toast with undo that calls `reorderCategories.mutate()` with the old order

No new files needed beyond the hook. No database changes.

### Files Changed

| File | Change |
|------|--------|
| `src/hooks/useUndoToast.ts` | New small hook wrapping sonner toast with undo action |
| `src/components/dashboard/settings/ServicesSettingsContent.tsx` | Wire undo toasts into archive, toggle, and reorder handlers |

