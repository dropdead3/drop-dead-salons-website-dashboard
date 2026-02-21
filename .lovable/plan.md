

# Wire Duplicate Detection into New Client Dialog

## What Changes

The "Add New Client" dialog will check for existing clients with matching email or phone **before** creating. If duplicates are found, the `DuplicateDetectionModal` intercepts with options to open the existing profile, start a merge, or proceed anyway.

## How It Works

1. As the user types email or phone, the `useDuplicateDetection` hook runs a debounced query against normalized email/phone in the `clients` table
2. When "Create Client" is clicked, if duplicates exist, the `DuplicateDetectionModal` opens instead of submitting
3. From the modal, the user can:
   - **Open Existing** -- closes dialog, navigates to that client
   - **Merge** -- closes dialog, navigates to merge wizard with that client pre-selected
   - **Create Anyway** -- proceeds with the original creation

## File Modified

**`src/components/dashboard/schedule/NewClientDialog.tsx`**

- Import `useDuplicateDetection` and `DuplicateDetectionModal`
- Import `useNavigate` from react-router-dom
- Import `useOrganizationContext` (required by the hook)
- Add state: `showDuplicateModal` (boolean)
- Call `useDuplicateDetection(email, phone)` with the current form values
- Modify `handleSubmit`: if duplicates exist and modal hasn't been dismissed, show modal instead of submitting
- Add `DuplicateDetectionModal` to the render tree with handlers for open/merge/create-anyway
- "Create Anyway" handler sets a bypass flag and calls the original mutation

No new files. No database changes. The DB function `find_duplicate_clients` and the `DuplicateDetectionModal` component already exist.

