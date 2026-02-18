

# Enhance Website Editor Services Manager

## Problem

The Website Editor's Services tab (`ServicesContent.tsx`) is a lightweight, read-only view showing stats, search, and accordion categories. Meanwhile, the Settings hub (`ServicesManager.tsx`) has the full suite of editing capabilities. The user wants the Website Editor version to be the primary, full-featured services management interface.

## What Changes

The Website Editor's `ServicesContent.tsx` will be upgraded to include all the rich editing features currently only available in Settings, plus website-specific enhancements.

### Features Being Added

| Feature | Currently in Settings | Adding to Website Editor |
|---|---|---|
| Edit service dialog (name, description, level pricing) | Yes | Yes |
| Toggle popular (switch + badge) | Star icon only | Switch + badge |
| Category rename (inline edit) | Yes | Yes |
| Category drag-and-drop reorder | Yes | Yes |
| Category add/delete | Yes | Yes |
| Communication flow config button | Yes | Yes |
| Price range display (Starts at X -> Y) | Yes | Yes |
| Booking settings (same-day, lead time) | Yes | Yes |
| Website description field | No | Yes (new) |
| "About Service Pricing" info card | Yes | Yes |

### Website-Specific Additions

- **Website Description** field in the edit dialog -- separate from the operational description, used for marketing copy on the public site
- Link to Settings -> Services kept as a secondary reference
- `ServicesPreviewEditor` (homepage section config) remains separate and unchanged

## Technical Details

### Approach: Replace ServicesContent with Enhanced Version

Rather than maintaining two separate implementations, `ServicesContent.tsx` will be refactored to include the full feature set from `ServicesManager.tsx`, adapted for the Website Editor context (no `DashboardLayout` wrapper, embedded within the existing editor panel).

### Key imports to add:
- `Dialog`, `AlertDialog` components for edit/delete flows
- `Textarea`, `Label`, `Switch` for form fields
- `ServiceCommunicationFlowEditor` and `useAllServiceCommunicationFlows`
- Drag-and-drop state management (same pattern as Settings version)

### State additions:
- `editingService` -- tracks the service being edited in the dialog
- `editingCategoryIndex` / `editingCategoryName` -- inline category rename
- `draggedCategoryIndex` / `dragOverCategoryIndex` -- drag-and-drop reorder
- `isAddCategoryOpen` / `newCategoryName` -- add category dialog
- `configureFlowsServiceName` -- communication flow editor trigger

### Mutations to wire:
- `useToggleServicePopular` -- already wired
- `useUpdateServiceDescription` -- for website description saves
- `useUpsertServiceLevelPrices` -- for saving level price edits from the dialog
- Category rename/reorder/add/delete -- write to `service_category_colors` table

### What stays the same:
- The hook `useNativeServicesForWebsite` remains the data source
- Stats cards layout unchanged
- Search functionality unchanged
- Accordion-based category display unchanged

### Files modified:
1. **`src/components/dashboard/website-editor/ServicesContent.tsx`** -- Major enhancement with full CRUD capabilities, edit dialogs, category management, drag-and-drop, communication flows, and website description editing

### Files unchanged:
- `ServicesManager.tsx` (Settings version) -- remains as-is for now
- `useNativeServicesForWebsite.ts` -- no changes needed
- `ServicesPreviewEditor.tsx` -- homepage section config stays separate

