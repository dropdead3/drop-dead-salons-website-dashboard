

## Move Save Button to Bottom Bar + Unsaved Changes Warning Toast

### What Changes

1. The "Save & Publish Changes" button will be removed from each individual editor's card header and placed in a fixed bottom bar at the right corner of the editor panel.

2. When you make any change without saving, a warning toast will appear reminding you to save.

### How It Works

The editors already dispatch a custom `editor-dirty-state` event to track unsaved changes. We will add a second custom event (`editor-save-request`) that flows in the opposite direction -- the hub tells the active editor to save.

```text
Editor dispatches:  editor-dirty-state  -->  Hub (tracks dirty, shows toast + button)
Hub dispatches:     editor-save-request -->  Editor (calls its own handleSave)
```

### Technical Details

**1. New hook: `src/hooks/useEditorSaveAction.ts`**

A small hook that editors will use to register their save function. When the hub dispatches `editor-save-request`, this hook calls the editor's save callback. It also dispatches `editor-saving-state` back to the hub so the button can show a loading spinner.

**2. Update `WebsiteSectionsHub.tsx`**

- Add a fixed bottom bar inside the editor panel (below the scrollable content area, above the panel boundary).
- The bar contains the "Save & Publish Changes" button, aligned to the right.
- The button is only enabled when `isDirtyRef.current` is true.
- Clicking the button dispatches `editor-save-request`.
- Listen for `editor-dirty-state` changes; when dirty becomes `true`, show a warning toast using sonner: "You have unsaved changes."
- Listen for `editor-saving-state` to show a spinner on the button while saving.

**3. Update all 12 editor components**

Remove the "Save & Publish Changes" button from each editor's CardHeader. Replace it with the `useEditorSaveAction` hook that registers the existing `handleSave` function.

Affected files:
- `HeroEditor.tsx` -- remove button from CardHeader, add hook
- `BrandStatementEditor.tsx` -- same
- `NewClientEditor.tsx` -- same
- `TestimonialsEditor.tsx` -- same
- `ExtensionsEditor.tsx` -- same
- `FAQEditor.tsx` -- same
- `BrandsManager.tsx` -- same
- `DrinksManager.tsx` -- same
- `FooterCTAEditor.tsx` -- same
- `FooterEditor.tsx` -- remove button from header div, add hook
- `AnnouncementBarContent.tsx` -- same
- `SectionDisplayEditor.tsx` -- same (generic editor used by ServicesPreview, PopularServices, Gallery, Stylists, Locations display editors)

**4. Bottom bar design**

```text
+----------------------------------------------------------+
| Editor content (scrollable)                              |
+----------------------------------------------------------+
|                          [!] You have unsaved changes    |
|                              [ Save & Publish Changes ]  |
+----------------------------------------------------------+
```

- Fixed to the bottom of the editor panel
- Background with border-top for visual separation
- Warning indicator visible when dirty
- Button disabled when no changes exist
- Spinner shown while saving

**5. Unsaved changes toast**

When any editor field changes (dirty state flips from false to true), a sonner toast will appear:
- Message: "You have unsaved changes"
- Duration: ~4 seconds
- Only fires once per dirty cycle (not on every keystroke)
