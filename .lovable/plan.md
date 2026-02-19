

## Full Custom Site Builder: Gap Analysis and Enhancement Plan

After thorough analysis of every file in the website editor system, here are the gaps and improvements needed to make this a production-grade site builder.

---

### Critical Gaps (P0)

#### 1. Header Navigation is Hardcoded -- Pages System is Disconnected
The `Header.tsx` uses a static `NAV_LINKS` / `allNavItems` array with hardcoded routes (`/services`, `/about`, `/extensions`, etc.). The multi-page system (`useWebsitePages`) already stores `show_in_nav` and `nav_order` per page, but the Header never reads it. Dynamic pages are invisible to site visitors unless manually linked.

**Fix**: Header reads `useWebsitePages()` + `getNavPages()` and merges dynamic page links into the nav. Hardcoded routes remain as fallbacks but dynamic pages appear alongside them.

#### 2. Style Overrides Only Work on Custom Sections
`SectionStyleEditor` is only rendered inside `CustomSectionEditor`. The 13 built-in editors (Hero, FAQ, Testimonials, etc.) have no access to per-section styling. The `handleStyleOverrideChange` callback in `WebsiteSectionsHub` is only passed to custom section editors.

**Fix**: Pass `styleOverrides` and `onStyleChange` to every built-in editor component and render `SectionStyleEditor` at the bottom of each one (or create a wrapper that adds it automatically).

#### 3. ImageUploadInput Not Used Anywhere
The `ImageUploadInput` component exists but is never imported or rendered. The `CustomSectionEditor` still uses a plain `<Input>` for image URLs. The `SectionStyleEditor` uses a plain text input for background image URLs.

**Fix**: Replace the `image_url` `<Input>` in `CustomSectionEditor` (image_text type) with `ImageUploadInput`. Use it in `SectionStyleEditor` when `background_type === 'image'`.

#### 4. WebsiteSectionsHub Has No Multi-Page UI
The `PageSettingsEditor` and `PageTemplatePicker` components exist but are never imported or used in the hub. The sidebar has no page selector. The entire editor only operates on `website_sections` (homepage), never on `website_pages`.

**Fix**: Add a page selector dropdown at the top of the sidebar. When a non-home page is selected, load that page's sections array. Add "Add Page" / "Delete Page" controls and a "Page Settings" tab.

#### 5. Duplicate Data Sources -- `website_sections` vs `website_pages`
Both `useWebsiteSections` and `useWebsitePages` exist. The homepage data lives in `website_sections` while `useWebsitePages` has its own copy of homepage sections. These can drift out of sync. `Index.tsx` reads from `useWebsiteSections` while `DynamicPage.tsx` reads from `useWebsitePages`.

**Fix**: Make `website_pages` the single source of truth. `useWebsiteSections` becomes a thin wrapper that reads/writes the `home` page from `website_pages`. `Index.tsx` switches to read from the pages system. The existing `website_sections` data gets migrated into `website_pages.pages[0].sections` on first load.

---

### Significant Gaps (P1)

#### 6. Built-in Editors Cannot Be Opened from Non-Home Pages
The `EDITOR_COMPONENTS` map in `WebsiteSectionsHub` is hardcoded. If an About page includes a `hero` section, clicking it would open the global Hero editor, not a page-scoped one. Built-in sections on non-home pages need to either use the custom section editor or be scoped to the correct page context.

#### 7. No "Duplicate Section" Capability
Users can add and delete sections but cannot duplicate an existing section (copy its content + style). This is a common site builder operation.

**Fix**: Add a "Duplicate" button next to the delete button on each section row in the sidebar.

#### 8. No Section Preview Thumbnails in Template Picker
Both `TemplatePicker` and `PageTemplatePicker` show only text descriptions with generic icons. No visual preview of what the template looks like.

**Fix**: Add a mini rendered preview or static thumbnail for each template card. Even a styled mock using the template's config values would help.

#### 9. Undo/Redo Scope is Limited
Undo/redo only covers the section order/visibility array. It does not cover content edits within sections (text, images, styles). A user who changes a heading and wants to undo has no path.

**Fix (future)**: Extend undo/redo to content edits by snapshotting section config before/after saves.

#### 10. No Mobile Editing Experience
The sidebar is hidden on mobile (`!isMobile && showSidebar`). Mobile users see only the editor content with no way to navigate between sections or pages. The "Add Section" button is inside the hidden sidebar.

**Fix**: Add a mobile-friendly section picker (bottom sheet or collapsible header) for mobile viewports.

---

### Quality Improvements (P2)

#### 11. Custom Section Cleanup on Delete
When a custom section is deleted, the sidebar removes it from the sections array, but the corresponding `site_settings` row (`section_custom_{id}`) is never deleted. Over time, orphaned config rows accumulate.

**Fix**: Add a `supabase.from('site_settings').delete().eq('id', settingsKey)` call in `handleDeleteSection`.

#### 12. Slug Collision Prevention
`PageSettingsEditor` allows free-text slug entry without checking for collisions against existing hardcoded routes (`services`, `extensions`, `about`) or other custom pages.

**Fix**: Validate slug uniqueness against both the pages array and a reserved-slugs list.

#### 13. Template Library is Sparse
Only 12 section templates and 4 page templates exist. Categories like "social_proof", "team", and "hero" mentioned in the plan are absent.

**Fix**: Expand templates to cover all planned categories. Add hero variants, team layouts, and social proof blocks.

#### 14. No Live Preview for Style Changes
Style overrides save to the database immediately via `handleStyleOverrideChange` without going through the dirty/save flow. This means every slider drag triggers a database write. No debouncing exists.

**Fix**: Debounce style override saves (300-500ms). Route them through the same dirty-state system as content edits.

#### 15. DynamicPage and Index.tsx Are Largely Duplicated
Both files contain identical section rendering logic (BUILTIN_COMPONENTS map, enabled section filtering, SectionStyleWrapper, postMessage listener). Any change to rendering must be made in two places.

**Fix**: Extract shared section rendering into a `PageSectionRenderer` component used by both.

---

### Implementation Plan

**Phase A -- Unify Data Model (P0, foundational)**
1. Make `useWebsitePages` the single source of truth
2. Convert `useWebsiteSections` into a wrapper that reads/writes the home page from `website_pages`
3. Update `Index.tsx` to use the pages system
4. Extract shared `PageSectionRenderer` component from `Index.tsx` and `DynamicPage.tsx`

**Phase B -- Wire Up Disconnected Features (P0)**
5. Integrate `ImageUploadInput` into `CustomSectionEditor` and `SectionStyleEditor`
6. Add `SectionStyleEditor` to all 13 built-in editors via a wrapper pattern
7. Add page selector, Add/Delete Page, and Page Settings to the sidebar and hub
8. Update `Header.tsx` to read dynamic pages from `useWebsitePages`

**Phase C -- UX Polish (P1-P2)**
9. Add "Duplicate Section" to sidebar
10. Clean up orphaned `site_settings` rows on section delete
11. Add slug collision validation
12. Debounce style override saves
13. Add mobile section navigation
14. Expand template library

### Technical Details

**Files to create:**
- `src/components/home/PageSectionRenderer.tsx` -- shared section rendering extracted from Index/DynamicPage

**Files to modify:**
- `src/hooks/useWebsiteSections.ts` -- becomes a wrapper around useWebsitePages for home page
- `src/hooks/useWebsitePages.ts` -- becomes the canonical data source
- `src/pages/Index.tsx` -- switch to pages system, use PageSectionRenderer
- `src/pages/DynamicPage.tsx` -- use PageSectionRenderer
- `src/components/layout/Header.tsx` -- read dynamic nav from useWebsitePages
- `src/components/dashboard/website-editor/CustomSectionEditor.tsx` -- use ImageUploadInput
- `src/components/dashboard/website-editor/SectionStyleEditor.tsx` -- use ImageUploadInput for background images
- `src/pages/dashboard/admin/WebsiteSectionsHub.tsx` -- add page context, style overrides for built-in sections, page settings routing
- `src/components/dashboard/website-editor/WebsiteEditorSidebar.tsx` -- add page selector, duplicate button, orphan cleanup on delete, mobile nav
- `src/components/dashboard/website-editor/PageSettingsEditor.tsx` -- add slug validation
- `src/data/section-templates.ts` -- expand template library

