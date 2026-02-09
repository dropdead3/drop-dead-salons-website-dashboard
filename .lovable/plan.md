

# Fix Kiosk Settings Save Button and Add Success Toast

## Problem

The "Save Changes" button in the Kiosk Settings dialog is not working properly. When clicked:
1. Nothing appears to happen (no feedback)
2. No "Changes saved successfully" toast notification appears
3. The dialog doesn't close after saving

## Root Cause Analysis

Looking at the current `handleSave` function:

```typescript
const handleSave = async () => {
  if (!organizationId) return;  // Silent failure if no organizationId
  
  await updateSettings.mutateAsync({
    organizationId,
    locationId: locationId || null,
    settings: localSettings,
  });
  // Missing: close dialog after success
  // Missing: explicit error handling
};
```

Issues identified:
1. **Silent early return**: If `organizationId` is null, the function returns silently with no user feedback
2. **No dialog close**: After successful save, the dialog stays open
3. **No error handling**: If the mutation fails, there's no explicit error feedback (though the hook's `onError` handler should show a toast)
4. **Toast exists but may not be prominent**: The hook already calls `toast.success('Kiosk settings saved')` but user wants "Changes saved successfully"

## Solution

Update the `handleSave` function to:
1. Show an error toast if `organizationId` is missing
2. Close the dialog after successful save
3. Add try/catch for explicit error handling
4. Update the toast message to "Changes saved successfully"

### Technical Changes

**File: `src/components/kiosk/KioskSettingsDialog.tsx`**

Update the `handleSave` function:

```typescript
const handleSave = async () => {
  if (!organizationId) {
    toast.error('Unable to save: Organization not found');
    return;
  }
  
  try {
    await updateSettings.mutateAsync({
      organizationId,
      locationId: locationId || null,
      settings: localSettings,
    });
    // Close dialog on success (toast shown by hook)
    handleClose();
  } catch (error) {
    // Error toast already shown by hook's onError
    console.error('Failed to save kiosk settings:', error);
  }
};
```

Add the toast import at the top of the file:

```typescript
import { toast } from 'sonner';
```

**File: `src/hooks/useKioskSettings.ts`**

Update the success toast message in `onSuccess`:

```typescript
onSuccess: (_, variables) => {
  // ... existing cache invalidation code ...
  
  toast.success('Changes saved successfully');  // Updated message
},
```

## Summary

| Change | Location | Purpose |
|--------|----------|---------|
| Add `toast` import | KioskSettingsDialog.tsx (imports) | Enable showing error toasts |
| Add error handling for null organizationId | handleSave function | User feedback when org is missing |
| Add try/catch | handleSave function | Explicit error handling |
| Call handleClose() on success | handleSave function | Close dialog after save |
| Update toast message | useKioskSettings.ts onSuccess | "Changes saved successfully" |

## Expected Outcome

After these changes:
- Clicking "Save Changes" will save the settings and close the dialog
- A "Changes saved successfully" toast notification will appear
- If organization is not found, an error toast will explain why save failed
- If the database operation fails, an error toast will appear

