

# Make Service Row Clickable for Edit

## Overview

Make the entire service line item row clickable to open the Service Editor dialog, instead of requiring users to find and click the small pencil icon.

## Changes

### File: `src/components/dashboard/settings/ServicesSettingsContent.tsx`

**Service row (lines 387-406)**:
- Add `cursor-pointer` to the row div and attach an `onClick` handler that opens the editor dialog
- The delete button (Trash icon) needs `e.stopPropagation()` to prevent the row click from firing when deleting
- Remove the separate pencil edit button since the whole row now serves that purpose
- Keep the delete icon visible on hover as the only action icon

**Before**: Row is passive, edit requires clicking the small pencil icon
**After**: Clicking anywhere on the row (except the delete icon) opens the Service Editor

## Technical Detail

- The row `div` gets `onClick={() => { setEditorService(svc); setEditorDialogOpen(true); }}`
- Add `cursor-pointer` to the row class
- Trash button gets `onClick={(e) => { e.stopPropagation(); deleteService.mutate(svc.id); }}`
- Remove the Pencil `Button` entirely since the row itself is the click target

