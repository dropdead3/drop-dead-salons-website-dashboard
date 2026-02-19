

## Premium Site Builder: Deep Gap Analysis and Enhancement Plan

After a thorough audit of every component in the website editor ecosystem, here are the remaining gaps between the current state and a premium-grade custom site builder.

---

### Critical Architecture Gap: Dual Data Source Still Active

The most fundamental issue remains: `Index.tsx` (the homepage) reads from `useWebsiteSections()` (the `website_sections` key), while `DynamicPage.tsx` reads from `useWebsitePages()` (the `website_pages` key). The `WebsiteSectionsHub` also operates exclusively on `website_sections`. These two systems store homepage sections independently and will drift.

**Fix**: Make `Index.tsx` read from `useWebsitePages()` for the home page (slug `""`). Convert `useWebsiteSections` into a thin adapter that reads/writes the home page's section array from `website_pages`. The hub should operate on the pages system.

---

### Gap 1: Multi-Page Editor UI Is Missing

`PageSettingsEditor.tsx` and `PageTemplatePicker.tsx` exist as components but are **never imported or rendered** in the hub or sidebar. The sidebar has no page selector, no "Add Page" button, no "Delete Page" control. The editor can only manage homepage sections.

**Fix**: Add to `WebsiteEditorSidebar`:
- A page selector dropdown at the top (Home, About, Contact, custom pages)
- "Add Page" and "Delete Page" buttons
- "Page Settings" as a clickable tab that opens `PageSettingsEditor`

Add to `WebsiteSectionsHub`:
- Page context state (`selectedPageId`)
- Import and route to `PageSettingsEditor` when `tab=page-settings`
- Import `PageTemplatePicker` accessible from a "Page Templates" action

---

### Gap 2: No Preview Auto-Refresh After Custom Section or Style Saves

`triggerPreviewRefresh()` is called by all 13 built-in editors after save, but `CustomSectionEditor` never calls it. Neither does `SectionStyleEditor`. Custom section content changes and style overrides don't appear in the live preview until manual refresh.

**Fix**: Add `triggerPreviewRefresh()` calls to:
- `CustomSectionEditor.saveMutation.onSuccess`
- `WebsiteSectionsHub.handleStyleOverrideChange` (after successful save)

---

### Gap 3: Style Override Saves Are Unbounced -- Every Slider Tick Hits Database

In `WebsiteSectionsHub`, `handleStyleOverrideChange` immediately calls `updateSections.mutateAsync()`. When a user drags the padding slider, this fires dozens of database writes per second. No debouncing exists.

**Fix**: Debounce `handleStyleOverrideChange` with a 500ms delay using `useDebounce` or a `setTimeout` pattern. Keep local state optimistic and only flush to DB after the debounce window.

---

### Gap 4: Built-in Section Editors Cannot Be Scoped to Non-Home Pages

The `EDITOR_COMPONENTS` map routes tab names to global editor components (e.g., `HeroEditor` reads from a global `site_settings` key). If a user adds a `hero` section to an About page, clicking it would open the global Hero editor, modifying the homepage hero -- not the About page's hero.

**Fix (medium-term)**: For non-home pages, route built-in section types through `CustomSectionEditor` instead, using page-scoped `site_settings` keys like `section_page_{pageId}_{sectionId}`.

---

### Gap 5: No Duplicate Button on Built-in Sections

`SectionNavItem` shows duplicate/delete buttons only when `deletable` is true. Built-in sections cannot be duplicated. Users may want to duplicate a built-in section as a starting point for a custom variant.

**Fix**: Show the duplicate button on all sections (built-in and custom). When duplicating a built-in section, create a custom section of the same type with `deletable: true` and copy the source config.

---

### Gap 6: Undo/Redo Uses React State -- Lost on Tab Switch

The `useUndoRedo` hook stores history in `useRef`. If the user navigates away from the Website Editor and comes back, all undo history is lost. The hook also re-initializes on every mount, so switching between dashboard pages clears the stack.

**Fix**: Store undo history in `sessionStorage` keyed by page ID so it persists within the browser session. Alternatively, accept the limitation and document that undo history is session-scoped (current behavior is functional but not premium).

---

### Gap 7: No Section Reordering Across Groups in Sidebar

The sidebar groups built-in sections into fixed categories ("Above the Fold", "Social Proof", etc.) using `SECTION_GROUPS`. DnD operates on the flat `localSections` array, but the visual grouping prevents a user from dragging a section between groups intuitively. The section order number changes but the visual position within groups stays fixed.

**Fix**: Either remove the visual grouping for built-in sections (render them as a flat list like custom sections), or implement inter-group drag with group boundaries as drop zones.

---

### Gap 8: No Mobile Editor Access

The sidebar is hidden on mobile (`!isMobile && showSidebar`). Mobile users see only the editor content panel with no way to navigate sections, add sections, or switch pages. The "Add Section" button is inside the hidden sidebar.

**Fix**: Add a mobile-friendly section picker:
- Collapsible sheet or drawer that opens from a floating button
- Section list with toggle/select capabilities
- "Add Section" accessible from mobile

---

### Gap 9: `OverviewTab` Is Disconnected from the Hub

`OverviewTab.tsx` imports `useWebsiteSections` independently and has its own save logic. It's a standalone section reordering UI, but it's not clear where it's used. It duplicates sidebar functionality and uses `framer-motion` Reorder (different DnD library than the sidebar's `@dnd-kit`).

**Fix**: Either remove `OverviewTab` entirely (the sidebar already provides reorder + toggle) or repurpose it as a quick-glance page overview within the multi-page system. Consolidate to one DnD library.

---

### Gap 10: No Section Visibility Indicator in Preview

When a section is toggled off in the sidebar, the preview correctly hides it. But there's no visual indication in the editor about which sections are hidden. Users may forget they disabled a section.

**Fix**: Add a subtle "X sections hidden" indicator in the editor header or sidebar footer (partially exists -- sidebar footer shows "X/Y sections visible" but could be more prominent with a clickable "show hidden" filter).

---

### Gap 11: `SectionStyleWrapper` Skips Rendering When No Overrides

`SectionStyleWrapper` returns bare `children` when `background_type === 'none'` and padding is 0. This means the `id` anchor (`section-{id}`) is on a child div, not a styled wrapper. This can cause inconsistent scroll-to behavior and the highlight animation won't have a visible background flash on unstyled sections.

**Fix**: Always render the outer wrapper div (even with no styles) to ensure consistent DOM structure. Only skip the style properties, not the wrapper itself.

---

### Gap 12: No Preview URL Routing for Dynamic Pages

`LivePreviewPanel` always loads `previewUrl` which points to `/org/{slug}?preview=true` (the homepage). When editing an About page's sections, the preview still shows the homepage. There's no mechanism to switch the preview iframe to the page being edited.

**Fix**: Update `LivePreviewPanel` to accept a `pageSlug` prop. When editing a non-home page, set the preview URL to `/org/{slug}/{pageSlug}?preview=true`. The hub should pass the current page's slug to the preview panel.

---

### Enhancement Opportunities

#### A. Section Copy/Paste Between Pages
Allow copying a section from one page and pasting it into another page's section list. Uses clipboard-style state in the hub.

#### B. Section Collapse in Sidebar
Allow collapsing section groups in the sidebar to reduce clutter when managing 15+ sections.

#### C. Drag-to-Reorder Custom Sections Between Positions
Currently custom sections are always appended at the end. Allow inserting at a specific position via drag target indicators.

#### D. Preview Breakpoint Persistence
The desktop/mobile toggle in `LivePreviewPanel` resets to desktop on every mount. Persist the last-used viewport in `localStorage`.

#### E. Section Search in Sidebar
The `WebsiteEditorSearch` exists but only searches section labels. Enhance to also search within section content (heading, body text) for larger sites.

#### F. Bulk Section Operations
Select multiple sections and bulk-enable, bulk-disable, or bulk-delete them. Useful for quickly toggling seasonal content.

---

### Recommended Implementation Priority

**Batch 1 -- Data Integrity (must-fix)**
1. Unify data source: `Index.tsx` reads from `useWebsitePages`
2. Add `triggerPreviewRefresh()` to custom section and style saves
3. Debounce style override saves

**Batch 2 -- Multi-Page Activation (core feature)**
4. Wire `PageSettingsEditor` and `PageTemplatePicker` into the hub
5. Add page selector, add/delete page controls to sidebar
6. Update `LivePreviewPanel` to route to the active page's URL
7. Scope built-in editors for non-home pages

**Batch 3 -- UX Polish**
8. Show duplicate button on built-in sections
9. Always render `SectionStyleWrapper` outer div
10. Add mobile editor navigation (floating drawer)
11. Remove or repurpose `OverviewTab`
12. Flatten section groups or implement inter-group drag

**Batch 4 -- Premium Features**
13. Section copy/paste between pages
14. Sidebar section group collapse
15. Preview breakpoint persistence
16. Section content search
17. Bulk section operations

---

### Technical Details -- Key File Changes

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Switch from `useWebsiteSections` to `useWebsitePages` for home page |
| `src/hooks/useWebsiteSections.ts` | Become adapter wrapping `useWebsitePages` home page |
| `src/components/dashboard/website-editor/CustomSectionEditor.tsx` | Add `triggerPreviewRefresh()` on save success |
| `src/pages/dashboard/admin/WebsiteSectionsHub.tsx` | Add page state, debounced style saves, import PageSettingsEditor/PageTemplatePicker, pass pageSlug to preview |
| `src/components/dashboard/website-editor/WebsiteEditorSidebar.tsx` | Add page selector dropdown, Add/Delete Page, mobile drawer, duplicate on built-in sections |
| `src/components/dashboard/website-editor/LivePreviewPanel.tsx` | Accept `pageSlug` prop, update preview URL |
| `src/components/home/SectionStyleWrapper.tsx` | Always render wrapper div |
| `src/components/dashboard/website-editor/SectionNavItem.tsx` | Show duplicate button regardless of `deletable` |
| `src/components/dashboard/website-editor/OverviewTab.tsx` | Remove or refactor to use pages system |

