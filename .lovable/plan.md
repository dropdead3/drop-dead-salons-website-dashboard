

# Make New Client Dialog Responsive with Scroll

## Problem
The "Add New Client" dialog extends beyond the viewport on smaller screens, cutting off content and the action buttons.

## Solution
Add a maximum height constraint to the `DialogContent` and make the form body scrollable while keeping the header and footer buttons always visible.

## Technical Details

**File:** `src/components/dashboard/schedule/NewClientDialog.tsx`

1. **DialogContent (line 192)**: Add `max-h-[85vh] flex flex-col` to constrain the dialog height to 85% of the viewport and enable flex column layout
2. **Form element (line 203)**: Add `overflow-y-auto flex-1 min-h-0` so the form fields scroll independently while the header stays pinned above and the footer stays pinned below
3. **DialogFooter**: Move the Cancel/Create Client buttons outside the scrollable form area (after the closing `</form>` tag) so they remain always visible at the bottom -- or wrap footer in a non-scrolling section

This keeps the dialog title and action buttons always accessible regardless of viewport height, with smooth scrolling for the form fields in between.

