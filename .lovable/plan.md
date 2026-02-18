

# Website Editor: Full Gap Analysis and Enhancement Opportunities

## Summary

After reviewing all 20+ editor components, the sidebar navigation, the homepage section system, and the main WebsiteSectionsHub page, here is a complete picture of what works, what's missing, and what could be improved.

---

## 1. Missing Editors (TODO items in codebase)

The `WebsiteSectionsHub.tsx` file contains 5 explicit `// TODO: Create dedicated editor` comments. These sidebar section entries currently fall through to the generic data manager instead of showing section-specific config (eyebrow text, headlines, layout options):

| Sidebar Section | Currently Shows | What's Missing |
|---|---|---|
| Services Preview | Full Services Manager | Dedicated editor for section headline, description, layout config |
| Popular Services | Full Services Manager | Dedicated editor for section headline, how many to feature, layout |
| Gallery Display | Full Gallery Manager | Dedicated editor for section headline, grid layout, how many images |
| Stylists Display | Full Stylists Manager | Dedicated editor for section headline, card style, max visible |
| Locations Display | Full Locations Manager | Dedicated editor for section headline, map toggle, layout config |

**Impact**: Clicking "Services Preview" in the Homepage Layout sidebar shows the full CRUD services list -- not section-level config like headlines, descriptions, or layout options. This is confusing because the same component loads whether you click "Services" under Site Content or "Services Preview" under Homepage Layout.

---

## 2. Footer CTA Not Accessible from Sidebar

`FooterCTAEditor` exists and is registered in `EDITOR_COMPONENTS` (tab key `'footer-cta'`), but it is **not listed** in either `SITE_CONTENT_ITEMS` or `SECTION_GROUPS` in the sidebar. The only way to reach it is by manually navigating to `?tab=footer-cta`.

**Fix**: Add Footer CTA to the sidebar, likely at the bottom of the Homepage Layout section or as its own "Footer" group.

---

## 3. Button Label Inconsistency: "Save Changes" vs "Save & Publish Changes"

The Announcement Bar editor was updated to say "Save & Publish Changes", but every other editor still says "Save Changes":

- HeroEditor: "Save Changes"
- BrandStatementEditor: "Save Changes"
- ExtensionsEditor: "Save Changes"
- FAQEditor: "Save Changes"
- NewClientEditor: "Save Changes"
- TestimonialsEditor: "Save Changes"
- BrandsManager: "Save Changes"
- DrinksManager: "Save Changes"
- FooterCTAEditor: "Save Changes"
- BrandsEditor (old): "Save Changes"
- DrinkMenuEditor (old): "Save Changes"

**Decision needed**: Either standardize all to "Save & Publish Changes" (if changes go live immediately) or keep "Save Changes" everywhere and revert the banner. Consistency matters.

---

## 4. Stale/Duplicate Editor Components

Two pairs of editors exist for the same sections:

| Active (used in hub) | Legacy (unused?) | Section |
|---|---|---|
| `BrandsManager.tsx` (full CRUD + DnD + logo upload + preview) | `BrandsEditor.tsx` (text-only, says "logos are hardcoded") | Brands |
| `DrinksManager.tsx` (full CRUD + DnD + image upload + preview) | `DrinkMenuEditor.tsx` (text-only, says "managed in code") | Drink Menu |

The legacy `BrandsEditor` and `DrinkMenuEditor` appear to be dead code. They contain misleading "Contact development" notes that contradict the newer full managers. These should be removed to avoid confusion.

---

## 5. Preview Panel Inconsistency

Some editors have inline live previews (side-by-side on xl screens), others don't:

| Has Preview | No Preview |
|---|---|
| HeroEditor | ServicesContent |
| BrandStatementEditor | TestimonialsContent |
| TestimonialsEditor | GalleryContent |
| ExtensionsEditor | StylistsContent |
| FAQEditor | LocationsContent |
| NewClientEditor | AnnouncementBarContent (has inline mini-preview only) |
| BrandsManager | |
| DrinksManager | |
| FooterCTAEditor | |

The data manager pages (Services, Testimonials, Gallery, Stylists, Locations) don't have section-level previews because they're CRUD managers, not section editors -- which circles back to gap #1.

---

## 6. Services Manager Uses Local State Only

`ServicesContent.tsx` initializes from `import { services as initialServices }` (a static data file) and manages everything in `useState`. Changes are lost on page refresh -- they never persist to the database. Every other content manager (Testimonials, Gallery, Stylists, Locations) uses database-backed hooks.

**Impact**: Any service edits made in the Website Editor are ephemeral.

---

## 7. Live Preview Panel (`LivePreviewPanel.tsx`) Not Wired Up

The `LivePreviewPanel` component exists and loads the homepage in an iframe (`/?preview=true`), but:
- The `showPreview` state exists in `WebsiteSectionsHub` but there is no button to toggle it (removed or never added).
- The `triggerPreviewRefresh()` utility is exported but never called from any editor's save handler.

---

## 8. Missing Sidebar Item: Footer

The website Footer (`Footer.tsx`) contains hardcoded links, location data, and branding. There is no editor for:
- Footer link management
- Footer text/copyright
- Footer social links (these exist in `useWebsiteSocialLinksSettings` but have no dedicated editor in the Website hub)

---

## Recommended Priority Order

1. **Standardize save button labels** -- quick consistency win
2. **Add Footer CTA to sidebar** -- unreachable editor, simple fix
3. **Remove legacy BrandsEditor and DrinkMenuEditor** -- dead code cleanup
4. **Persist Services to database** -- critical data loss bug
5. **Create dedicated section editors** for Services Preview, Popular Services, Gallery Display, Stylists Display, Locations Display -- resolves the 5 TODOs
6. **Wire up Live Preview Panel** or remove dead code
7. **Add Footer editor** to sidebar for link/social/copyright management

