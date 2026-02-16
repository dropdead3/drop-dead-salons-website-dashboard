

# Unified Service Editor with Tabbed Navigation

## Overview

Combine the three separate service dialogs (Edit Service, Level Pricing, Stylist Overrides) into a single unified "Service Editor" dialog with tab navigation. The service row will have a single edit button (pencil icon) instead of three separate icons, and the dialog opens as a wizard-style editor with three tabs.

## UI Design

The unified dialog will have:
- A header showing the service name
- Three tabs using the existing `SubTabsList` / `SubTabsTrigger` (underline-style tabs): **Details** | **Level Pricing** | **Stylist Overrides**
- Each tab renders its respective content inline
- Footer with Cancel/Save that adapts per tab

## Changes

### 1. New File: `src/components/dashboard/settings/ServiceEditorDialog.tsx`

A wrapper dialog that:
- Accepts service data (for edit mode) or null (for create mode)
- Uses `Tabs` with `SubTabsList` / `SubTabsTrigger` for the three sections
- **Details tab**: Embeds the existing service form fields (name, category, duration, price, description, toggles) -- extracted inline, not importing `ServiceFormDialog`
- **Level Pricing tab**: Embeds the `LevelPricingDialog` content (level list with price inputs) directly, without wrapping it in its own Dialog
- **Stylist Overrides tab**: Embeds the `StylistPriceOverridesDialog` content (override list, search, add) directly
- In create mode, only the Details tab is visible (pricing tabs appear after first save)
- Footer: "Cancel" always visible; "Save" submits current tab's data

### 2. Refactor: `LevelPricingDialog.tsx` -> extract inner content

Extract the inner content (the level list + price inputs) into a `LevelPricingContent` component that can be rendered both standalone and inside the unified editor. The dialog wrapper remains for backward compatibility but delegates to the content component.

### 3. Refactor: `StylistPriceOverridesDialog.tsx` -> extract inner content

Same pattern: extract `StylistOverridesContent` from the dialog wrapper.

### 4. Modify: `ServicesSettingsContent.tsx`

- Remove the three separate icon buttons (Layers, UserPlus, Pencil) per service row
- Replace with a single Pencil (edit) icon button that opens the unified `ServiceEditorDialog`
- Remove the separate `LevelPricingDialog` and `StylistPriceOverridesDialog` instances
- Remove `levelPricingService` and `overrideService` state variables
- Keep the `ServiceFormDialog` for create mode only (or unify create into the new editor too)
- The "Add service" button still opens in create mode (Details tab only)

### 5. Remove: `ServiceFormDialog.tsx` usage for edit mode

Edit mode is now handled by `ServiceEditorDialog`. Create mode can either stay as `ServiceFormDialog` or be folded into the new editor (Details tab only, pricing tabs disabled).

## Technical Details

### ServiceEditorDialog structure

```
Dialog
  DialogContent (max-w-lg)
    DialogHeader
      DialogTitle: "Edit {serviceName}" or "Add Service"
    Tabs defaultValue="details"
      SubTabsList
        SubTabsTrigger value="details" -- "Details"
        SubTabsTrigger value="levels" disabled={isCreateMode} -- "Level Pricing"
        SubTabsTrigger value="overrides" disabled={isCreateMode} -- "Stylist Overrides"
      TabsContent value="details"
        [service form fields inline]
      TabsContent value="levels"
        LevelPricingContent serviceId={...} basePrice={...}
      TabsContent value="overrides"
        StylistOverridesContent serviceId={...} basePrice={...}
    DialogFooter (per-tab save buttons)
```

### Service row simplification

Before (4 icons): Layers | UserPlus | Pencil | Trash
After (2 icons): Pencil (opens unified editor) | Trash

## Build Order

1. Extract `LevelPricingContent` from `LevelPricingDialog.tsx`
2. Extract `StylistOverridesContent` from `StylistPriceOverridesDialog.tsx`
3. Create `ServiceEditorDialog.tsx` with tabbed layout
4. Update `ServicesSettingsContent.tsx` to use the unified dialog and simplify service row icons
