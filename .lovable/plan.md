
## Advanced Website Editor: Custom Sections, Delete, Undo/Redo

This plan transforms the website editor from a fixed 13-section system into a flexible site builder where users can create new section types, delete sections they don't need, and undo/redo all layout changes.

---

### Current Limitations

- The `HomepageSections` interface is a fixed TypeScript type with 13 hardcoded keys
- Section labels, descriptions, components, and tab mappings are all static `Record` objects spread across 5+ files
- No undo/redo exists in the editor (the `useUndoRedo` hook exists but is unused)
- Sections can only be toggled on/off -- never deleted
- No way to add new section types

---

### Architecture Change: Dynamic Section Model

The core change is moving from a **typed record** (`HomepageSections` with fixed keys) to a **dynamic array** model.

```text
BEFORE (fixed):
  homepage: { hero: {enabled, order}, brand_statement: {enabled, order}, ... }

AFTER (dynamic):
  homepage: [
    { id: "hero", type: "hero", label: "Hero Section", description: "...", enabled: true, order: 1, deletable: false },
    { id: "brand_statement", type: "brand_statement", ... },
    { id: "custom_abc123", type: "rich_text", label: "About Our Team", ..., deletable: true },
  ]
```

Built-in sections (hero, testimonials, etc.) are marked `deletable: false` and retain their dedicated editor components. Custom sections use a generic editor.

---

### Implementation Plan

#### 1. New Data Model (`useWebsiteSections.ts`)

Replace the `HomepageSections` interface with a dynamic array-based structure:

- **`SectionConfig`** gains: `id: string`, `type: SectionType`, `label: string`, `description: string`, `deletable: boolean`
- **`SectionType`** union: all 13 built-in types plus `"rich_text"`, `"image_text"`, `"video"`, `"custom_cta"`, `"spacer"`
- **`WebsiteSectionsConfig.homepage`** becomes `SectionConfig[]` (array, not record)
- Migration helper: `migrateFromRecord()` converts old record format to new array format on first load, preserving existing data
- Update `getOrderedSections()` and `getEnabledSections()` for the new array shape

#### 2. Custom Section Types (New Component Templates)

Create 5 generic section types users can add:

| Type | Description | Editor Fields |
|------|-------------|---------------|
| `rich_text` | Markdown/text block | Heading, body text, alignment, background style |
| `image_text` | Image + text side-by-side | Image URL, heading, body, layout (image left/right), CTA button |
| `video` | Embedded video section | Video URL (YouTube/Vimeo), heading, autoplay toggle |
| `custom_cta` | Call-to-action banner | Heading, description, button text, button URL, style variant |
| `spacer` | Visual divider/spacing | Height (px), show divider line toggle |

Each gets a generic `CustomSectionEditor` component with field configs driven by the `type`.

#### 3. New File: `CustomSectionEditor.tsx`

A dynamic editor component that renders appropriate fields based on section type. It uses the existing `SectionDisplayEditor` pattern with field configs per type. Saves to `site_settings` with key `section_custom_{id}`.

#### 4. New File: `CustomSectionRenderer.tsx`

A frontend renderer for `Index.tsx` that reads the custom section's config from `site_settings` and renders the appropriate layout (rich text, image+text, video embed, CTA, or spacer).

#### 5. "Add Section" Dialog in Sidebar

Add an "Add Section" button at the bottom of the Homepage Layout area in `WebsiteEditorSidebar.tsx`:

- Opens a dialog with the 5 custom section types as cards
- User picks a type, enters a label (e.g., "About Our Philosophy")
- Creates a new entry in the sections array with a generated ID (`custom_{nanoid}`)
- Appended to the end of the section order

#### 6. Delete Section Capability

Add a delete button (trash icon) to each section row in the sidebar:

- Built-in sections: delete button is hidden (they use the existing toggle instead)
- Custom sections: shows a confirmation dialog, then removes from the array and deletes the associated `site_settings` row
- Update `WebsiteEditorSidebar.tsx` and `SectionNavItem.tsx` to accept an `onDelete` prop

#### 7. Undo/Redo for Section Layout

Integrate the existing `useUndoRedo` hook into the section management flow:

- **Scope**: Undo/redo covers the sections array (order, visibility, additions, deletions) -- not individual section content edits
- **Location**: Add Undo/Redo buttons to the Website Editor header bar in `WebsiteSectionsHub.tsx`
- **Keyboard shortcuts**: Cmd/Ctrl+Z for undo, Cmd/Ctrl+Shift+Z for redo
- **Flow**: Every section toggle, reorder, add, or delete pushes a snapshot to the undo stack. Undo restores the previous snapshot and saves to database.
- Wire into `WebsiteEditorSidebar.tsx` by lifting section state management to the parent hub and passing down handlers

#### 8. Update `Index.tsx` (Frontend Rendering)

- Change from `Record<keyof HomepageSections, ReactNode>` to a lookup function
- Built-in types resolve to their existing components
- Custom types resolve to `<CustomSectionRenderer id={section.id} type={section.type} />`
- Handle unknown types gracefully (skip rendering)

#### 9. Update All Consumers of the Old Model

Files that reference `HomepageSections` as a record type need updates:

- `useWebsiteSections.ts` -- core data model change
- `WebsiteEditorSidebar.tsx` -- dynamic sections, add/delete buttons
- `SectionNavItem.tsx` -- add delete prop
- `WebsiteSectionsHub.tsx` -- undo/redo buttons, dynamic editor routing
- `OverviewTab.tsx` -- adapt to array model
- `Index.tsx` -- dynamic rendering

---

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/dashboard/website-editor/CustomSectionEditor.tsx` | Generic editor for custom section types |
| `src/components/dashboard/website-editor/AddSectionDialog.tsx` | Dialog for choosing and adding a new section type |
| `src/components/home/CustomSectionRenderer.tsx` | Frontend renderer for custom sections |

### Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useWebsiteSections.ts` | Array-based model, migration helper, custom section types |
| `src/components/dashboard/website-editor/WebsiteEditorSidebar.tsx` | Add/delete buttons, dynamic section list |
| `src/components/dashboard/website-editor/SectionNavItem.tsx` | Delete button prop |
| `src/pages/dashboard/admin/WebsiteSectionsHub.tsx` | Undo/redo buttons + keyboard shortcuts, dynamic editor routing |
| `src/components/dashboard/website-editor/OverviewTab.tsx` | Adapt to array model |
| `src/pages/Index.tsx` | Dynamic section rendering with custom section support |

---

### Migration Strategy

When the app loads the `website_sections` setting:
1. Check if `homepage` is an object (old format) or array (new format)
2. If object, run `migrateFromRecord()` to convert to array format
3. Save the migrated format back to the database
4. All subsequent operations use the array format

This ensures zero data loss for existing configurations.

---

### What This Does NOT Include

- **Per-section style overrides** (background colors, padding, fonts) -- separate effort
- **Media/image upload** within custom sections -- would reference URLs for now
- **Multi-page support** (About, Contact pages) -- requires page-level routing architecture
- **Template library** (pre-built section designs) -- future enhancement
