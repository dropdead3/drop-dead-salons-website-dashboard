

## Fix: 404 on Contact Page Preview + Reserved Slug Conflict

### Problem 1: Preview shows 404 for disabled pages

The editor preview iframe loads `/org/{slug}/contact?preview=true`, but `DynamicPage.tsx` never reads the `?preview=true` query parameter. It calls `getPageBySlug()` which filters pages by `p.enabled === true`. Since the Contact page defaults to `enabled: false` in the database, it always returns 404 in the preview -- even while the user is actively editing it.

### Problem 2: Reserved slugs block built-in pages

`PageSettingsEditor` has a `RESERVED_SLUGS` list that includes `'contact'` and `'about'`. These are the exact slugs used by the built-in default pages. If a user ever touches the slug field (even accidentally clicking into it and clicking away), the validator would flag their own page's slug as reserved. The reserved list should exclude slugs that belong to the page being edited.

### Problem 3: Save was failing (now fixed)

The previous migration added an INSERT RLS policy on `site_settings`. The database logs confirm the row now exists and is writable. The "Failed to save" error should no longer occur. No additional database changes needed.

---

### Fix Details

**File: `src/pages/DynamicPage.tsx`**

Add a `?preview=true` bypass: when the URL contains this query param, skip the `p.enabled` filter so disabled pages render in the editor preview. This matches how the editor already appends `?preview=true` to the iframe URL.

```
Before: getPageBySlug(pagesConfig, pageSlug || '')
  --> only finds pages where enabled === true

After: when ?preview=true is present, find page by slug regardless of enabled state
```

**File: `src/hooks/useWebsitePages.ts`**

Export a new helper `getPageBySlugPreview()` that finds a page by slug without the `enabled` check. Or add an optional `ignoreEnabled` parameter to `getPageBySlug`.

**File: `src/components/dashboard/website-editor/PageSettingsEditor.tsx`**

Update `validateSlug` to allow the page's own current slug even if it appears in `RESERVED_SLUGS`. The reserved list is meant to prevent user-created pages from colliding with hardcoded routes -- it should not block built-in pages from keeping their own slugs.

---

### Implementation

| Step | File | Change |
|------|------|--------|
| 1 | `src/hooks/useWebsitePages.ts` | Add optional `preview` parameter to `getPageBySlug` that skips the `enabled` filter |
| 2 | `src/pages/DynamicPage.tsx` | Read `?preview=true` from search params; pass `preview: true` to `getPageBySlug` when present |
| 3 | `src/components/dashboard/website-editor/PageSettingsEditor.tsx` | Update `validateSlug` to allow the page's own existing slug (skip reserved check if slug matches `page.slug`) |

Three files modified. No database changes.
