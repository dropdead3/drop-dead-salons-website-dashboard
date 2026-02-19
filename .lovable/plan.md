

## Premium Site Builder: Remaining Gaps and Enhancements

After auditing every component, hook, and page in the website editor ecosystem, here are the concrete issues that still need to be addressed.

---

### CRITICAL: Dual Data Source Is Still Active (P0)

The single most important gap: **`Index.tsx` still reads from `useWebsiteSections()` (the `website_sections` key)**, while `DynamicPage.tsx` reads from `useWebsitePages()` (the `website_pages` key). The entire editor hub and sidebar also operate exclusively on `website_sections`.

This means homepage data lives in TWO places that will drift apart. Every edit made in the Website Editor saves to `website_sections`, but the pages system has its own copy of homepage sections in `website_pages`.

**Files affected:**
- `Index.tsx` (line 7) -- reads `useWebsiteSections()` instead of `useWebsitePages()`
- `WebsiteSectionsHub.tsx` (line 215) -- operates on `useWebsiteSections()`
- `WebsiteEditorSidebar.tsx` (line 136) -- reads `useWebsiteSections()`
- `OverviewTab.tsx` (line 19) -- reads `useWebsiteSections()` independently

**Fix:** Make `useWebsitePages` the single source of truth. Refactor `useWebsiteSections` into a thin adapter that reads/writes the home page's sections from `website_pages`. Update all 4 consumers.

---

### Gap 1: Non-Home Page Sections Cannot Be Edited (P0)

The sidebar renders non-home page sections as plain `ContentNavItem` components (lines 471-486 of sidebar). Clicking them sets `activeTab` to `custom-{id}`, but `renderEditor()` in the hub (line 515) looks up the section from `sectionsConfig?.homepage` -- not from the selected page's sections. This means clicking a section on the About page finds nothing and shows the "Select a section" placeholder.

**Fix:** `renderEditor()` must look up sections from the currently selected page's section array, not just `homepage`.

---

### Gap 2: Non-Home Page Sections Have No DnD, Toggle, Delete, or Duplicate (P1)

Non-home page sections use `ContentNavItem` (a simple label+icon button) instead of `SectionNavItem` (which has drag handle, toggle switch, duplicate, and delete). Users cannot reorder, enable/disable, duplicate, or delete sections on About/Contact/custom pages.

**Fix:** Use `SectionNavItem` with a `DndContext` for non-home pages, same as for the homepage. Wire up toggle, delete, and duplicate handlers that operate on the selected page's sections within `website_pages`.

---

### Gap 3: "Add Section" Button Only Appears on Home Page (P1)

The "Add Section" button (sidebar line 490) is wrapped in `{isHomePage && (...)}`. Users cannot add sections to non-home pages at all from the sidebar.

**Fix:** Show the "Add Section" button for all pages. Wire the handler to insert into the correct page's sections array.

---

### Gap 4: OverviewTab Is Redundant and Uses a Different DnD Library (P2)

`OverviewTab.tsx` duplicates sidebar functionality (section reorder + toggle) using `framer-motion Reorder` while the sidebar uses `@dnd-kit`. It reads from `useWebsiteSections()` independently. It has its own save logic. It's unclear where it's rendered (it's not in the current hub `EDITOR_COMPONENTS` map).

**Fix:** Remove `OverviewTab.tsx` entirely. The sidebar already provides all its functionality with the preferred DnD library.

---

### Gap 5: Style Override Debounce Doesn't Update Local State Optimistically (P1)

In `WebsiteSectionsHub.tsx` (line 348-366), `handleStyleOverrideChange` creates a `newSections` array but never updates local/optimistic state. The user sees no change until the debounced DB write completes and the query refetches. The `SectionStyleEditor` slider will feel laggy because the parent doesn't reflect changes until after the 500ms debounce + network round-trip.

**Fix:** Apply `newSections` to the query cache optimistically via `queryClient.setQueryData` immediately, then debounce only the persist call.

---

### Gap 6: "Open Site" Button Always Opens Root (P2)

The hub header (line 669) has `window.open('/', '_blank')` which always opens the root URL regardless of the selected page. When editing the About page, it should open `/org/{slug}/about`.

**Fix:** Use `previewUrl` (already computed correctly per page) but strip the `?preview=true` param for the external link.

---

### Gap 7: No Section Add/Delete/Reorder Operations on Non-Home Pages in the Hub (P0)

The hub has handlers for `handleAddPage`, `handleDeletePage`, `handleUpdatePageSettings`, and `handleApplyPageTemplate` -- but no handlers for adding, deleting, reordering, or toggling individual sections within a non-home page. The sidebar only has these operations wired for the homepage via `useWebsiteSections()`.

**Fix:** Add section CRUD handlers in the hub (or sidebar) that operate on `website_pages.pages[selectedPageId].sections` and call `updatePages.mutateAsync()`.

---

### Gap 8: Header Mobile Menu Doesn't Include Dynamic Pages (P1)

The Header's mobile menu (lines 440+) renders `NAV_LINKS` and `ABOUT_LINKS` but does not include `dynamicNavPages`. The desktop nav includes them, but mobile visitors cannot reach custom pages.

**Fix:** Append dynamic page links to the mobile menu section, below the hardcoded links.

---

### Gap 9: No Section Label Editing (P2)

When a section is created (custom or duplicated), the user cannot rename its label. The sidebar shows the label but provides no inline edit. For custom sections, the label is set at creation and never changeable.

**Fix:** Add an inline rename capability -- either a pencil icon on `SectionNavItem` that makes the label editable, or a "Section Label" field at the top of `CustomSectionEditor`.

---

### Gap 10: Template Picker Has No Visual Previews (P2)

Both `TemplatePicker` and `PageTemplatePicker` show only text descriptions. No thumbnails, no mini-previews. Users cannot visually compare templates.

**Fix:** Add styled preview cards or placeholder thumbnails for each template. Even colored blocks showing the template's layout pattern would help.

---

### Gap 11: No Confirmation Before Applying Page Template (P1)

`handleApplyPageTemplate` (hub line 441) replaces all sections on the selected page immediately with no warning dialog. Existing content is destroyed silently.

**Fix:** Add a confirmation dialog: "This will replace all sections on '{page.title}'. This cannot be undone."

---

### Gap 12: `SectionStyleWrapper` Border Radius Hides Anchor Highlights (P2)

When `border_radius > 0`, the wrapper sets `overflow: hidden` (SectionStyleWrapper line 65). This clips the `preview-highlight` animation if it extends beyond the rounded corners. Minor visual issue.

**Fix:** Use `overflow: clip` instead of `overflow: hidden` or apply the highlight inside the wrapper.

---

## Implementation Plan

### Batch 1: Data Unification (Critical Foundation)

| Step | File | Change |
|------|------|--------|
| 1a | `useWebsiteSections.ts` | Refactor to read/write the home page's sections from `website_pages` via `useWebsitePages`. Keep the same external API (`useWebsiteSections()` returns `{ homepage: SectionConfig[] }`) for backward compatibility |
| 1b | `Index.tsx` | No change needed after 1a (it already uses `useWebsiteSections` which will now read from pages) |
| 1c | `WebsiteSectionsHub.tsx` | Update `renderEditor()` to look up sections from the selected page, not just `homepage` |
| 1d | `OverviewTab.tsx` | Delete this file -- sidebar already provides its functionality |

### Batch 2: Non-Home Page Editing (Core Multi-Page)

| Step | File | Change |
|------|------|--------|
| 2a | `WebsiteEditorSidebar.tsx` | Replace `ContentNavItem` for non-home sections with `SectionNavItem` wrapped in DnD. Add section CRUD handlers that operate on `website_pages` |
| 2b | `WebsiteEditorSidebar.tsx` | Show "Add Section" button for all pages, not just home |
| 2c | `WebsiteSectionsHub.tsx` | Add section-level CRUD handlers for non-home pages (add, delete, reorder, toggle, duplicate) using `updatePages.mutateAsync()` |
| 2d | `WebsiteSectionsHub.tsx` | Fix `renderEditor()` to find custom sections from the selected page's section array |

### Batch 3: UX Polish

| Step | File | Change |
|------|------|--------|
| 3a | `WebsiteSectionsHub.tsx` | Apply optimistic cache update in `handleStyleOverrideChange` before debounced persist |
| 3b | `WebsiteSectionsHub.tsx` | Fix "Open Site" button to use page-aware URL (strip `?preview=true` from `previewUrl`) |
| 3c | `Header.tsx` | Add dynamic pages to mobile menu |
| 3d | `WebsiteSectionsHub.tsx` | Add confirmation dialog before applying page template |
| 3e | `SectionNavItem.tsx` or `CustomSectionEditor.tsx` | Add section label rename capability |

### Batch 4: Visual Enhancements

| Step | File | Change |
|------|------|--------|
| 4a | `TemplatePicker.tsx` + `PageTemplatePicker.tsx` | Add visual preview cards with layout indicators |
| 4b | `SectionStyleWrapper.tsx` | Switch `overflow: hidden` to `overflow: clip` for border-radius |

---

### Estimated Scope

- **Files to delete:** 1 (`OverviewTab.tsx`)
- **Files to modify:** 7 (`useWebsiteSections.ts`, `WebsiteSectionsHub.tsx`, `WebsiteEditorSidebar.tsx`, `Header.tsx`, `SectionNavItem.tsx`, `TemplatePicker.tsx`, `SectionStyleWrapper.tsx`)
- **New files:** 0

