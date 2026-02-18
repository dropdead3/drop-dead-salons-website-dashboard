

# Website Editor: Enhancement Analysis (Round 2)

## What's Working Well
The Website Editor is now a solid system with 24+ editor components, drag-and-drop section ordering, database-backed persistence, and inline live previews for most section editors. The previous round closed the major gaps (standardized buttons, dead code cleanup, section editors, footer editor, services persistence).

## Remaining Gaps and Enhancement Opportunities

---

### 1. Live Preview Panel Never Auto-Refreshes After Save

**Problem**: `triggerPreviewRefresh()` is exported from `LivePreviewPanel.tsx` but is never called from any editor's save handler. When a user edits the Hero section and clicks "Save & Publish Changes" with the Preview panel open, the iframe stays stale until they manually click refresh.

**Fix**: Import and call `triggerPreviewRefresh()` inside the `handleSave` success path of every editor that persists to the database. This is a one-line addition per editor (~12 editors).

---

### 2. Five New Section Editors Have No Live Preview

**Problem**: The newly created section editors (`ServicesPreviewEditor`, `PopularServicesEditor`, `GalleryDisplayEditor`, `StylistsDisplayEditor`, `LocationsDisplayEditor`) all use the generic `SectionDisplayEditor` component, which renders a simple form card with no side-by-side preview panel. Every other homepage section editor (Hero, Brand Statement, Extensions, FAQ, New Client, Testimonials, Brands, Drinks, Footer CTA) has a dedicated preview component alongside it.

**Fix**: Either:
- (A) Add a "Link to Preview" approach -- show a callout card linking to the global Preview panel, or
- (B) Extend `SectionDisplayEditor` to accept an optional preview component and render the xl:grid-cols-2 layout when one is provided.

Option B is cleaner and consistent with existing patterns. This would require creating 5 new lightweight preview components.

---

### 3. Footer Editor Missing from the Settings > Website Tab

**Problem**: The Footer Editor exists in the Website Editor (`?tab=footer`) but the Settings > Website tab has cards for Announcement Banner, Social Links, Booking, Retail, SEO, and Theme -- but no Footer card. This means footer settings are only editable from one entry point, while all other website settings have dual access (Settings card + Website Editor).

**Fix**: Add a "Footer" settings card in the Website Settings tab that shows a mini-preview of the footer and links to the Website Editor's Footer tab for full editing.

---

### 4. Footer Editor Social Links are Instagram-Only

**Problem**: The `FooterEditor.tsx` only manages `instagram_handle` and `instagram_url`. But the `useWebsiteSocialLinksSettings` hook already supports Instagram, Facebook, Twitter, YouTube, LinkedIn, and TikTok. The Footer Editor should reference or manage all social links, not just Instagram.

**Fix**: Wire the Footer Editor's "Social Media" card to use the `useWebsiteSocialLinksSettings` hook, adding fields for all 6 social platforms. Alternatively, add a "Manage Social Links" button that navigates to the existing Social Links card in Settings.

---

### 5. Unsaved Changes Warning Missing

**Problem**: Several editors track dirty state (`isDirty`) but none of them warn users when navigating away with unsaved changes. Clicking a different sidebar item discards all unsaved work silently.

**Fix**: Add a `useBeforeUnload` hook and an `onTabChange` interceptor in `WebsiteSectionsHub` that shows a confirmation dialog ("You have unsaved changes. Discard?") before switching tabs.

---

### 6. Sidebar Icons are Repetitive

**Problem**: Footer CTA and Footer both use the `Megaphone` icon in the sidebar, same as Announcement Bar. Three items sharing the same icon reduces scannability.

**Fix**: Use distinct icons:
- Footer CTA: `MousePointerClick` or `ArrowDown`
- Footer: `PanelBottom` or `LayoutTemplate`
- Announcement Bar keeps `Megaphone`

---

### 7. SectionDisplayEditor Missing "Save & Publish" in Card Header

**Problem**: The `SectionDisplayEditor` component puts the save button in the card header, which is correct. However, it doesn't include the `Save` icon like other editors do, and uses `Save & Publish Changes` text inconsistently (it does show it, but the button is plain compared to other editors).

**Fix**: Minor -- align the save button styling with the pattern used in HeroEditor/BrandStatementEditor (icon + text + sticky header).

---

## Recommended Implementation Priority

| Priority | Enhancement | Effort | Impact |
|---|---|---|---|
| 1 | Wire `triggerPreviewRefresh()` into all save handlers | Small | High -- preview actually works |
| 2 | Unsaved changes warning on tab switch | Small | High -- prevents data loss |
| 3 | Fix sidebar icons (3 Megaphones) | Tiny | Medium -- better navigation |
| 4 | Expand Footer social links to all 6 platforms | Small | Medium -- feature completeness |
| 5 | Add preview components to 5 section editors | Medium | Medium -- visual consistency |
| 6 | Add Footer card to Settings > Website | Small | Low -- dual access convenience |
| 7 | Sticky header + icon alignment on SectionDisplayEditor | Tiny | Low -- visual polish |

## Technical Details

### Wiring triggerPreviewRefresh (Priority 1)
In each editor's `handleSave` success callback, add:
```
import { triggerPreviewRefresh } from './LivePreviewPanel';
// inside handleSave try block after toast.success:
triggerPreviewRefresh();
```

Affected files: HeroEditor, BrandStatementEditor, ExtensionsEditor, FAQEditor, NewClientEditor, TestimonialsEditor, BrandsManager, DrinksManager, FooterCTAEditor, FooterEditor, AnnouncementBarContent, ServicesContent, and all 5 SectionDisplayEditor-based editors.

### Unsaved Changes Warning (Priority 2)
Add an `onBeforeTabChange` callback in `WebsiteSectionsHub` that checks a ref-based dirty flag. Each editor component would register its dirty state via a context or callback prop. A simpler approach: add `window.onbeforeunload` in editors with dirty state, and show an `AlertDialog` when sidebar items are clicked while any editor reports unsaved changes.

### Sidebar Icon Fix (Priority 3)
In `WebsiteEditorSidebar.tsx`, update `SITE_CONTENT_ITEMS`:
- `footer-cta`: use `MousePointerClick` from lucide
- `footer`: use `PanelBottom` from lucide

