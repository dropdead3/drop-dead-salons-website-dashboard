

## Comprehensive Website Editor Enhancement Plan

Four major features to transform the editor into a full site builder. Each feature builds on the existing `site_settings` + `SectionConfig[]` architecture.

---

### Feature 1: Per-Section Style Overrides

Allow each section to customize its own background, padding, and font sizing independent of the global theme.

**Data Model**

Add a `style_overrides` object to `SectionConfig`:

```text
SectionConfig {
  ...existing fields,
  style_overrides?: {
    background_type: 'none' | 'color' | 'gradient' | 'image';
    background_value: string;       // hex, gradient CSS, or image URL
    padding_top: number;            // px, default 64
    padding_bottom: number;         // px, default 64
    max_width: 'sm' | 'md' | 'lg' | 'xl' | 'full';  // content container width
    text_color_override: string;    // hex or empty
    border_radius: number;          // section border radius in px
  }
}
```

**Implementation**

| File | Change |
|------|--------|
| `src/hooks/useWebsiteSections.ts` | Add `style_overrides` to `SectionConfig` interface with sensible defaults |
| `src/components/dashboard/website-editor/SectionStyleEditor.tsx` (new) | Collapsible "Style" panel with color picker, padding sliders, max-width selector, background type/value inputs |
| `src/components/dashboard/website-editor/CustomSectionEditor.tsx` | Import and render `SectionStyleEditor` below content fields |
| `src/components/dashboard/website-editor/HeroEditor.tsx` (and all built-in editors) | Add `SectionStyleEditor` as an "Advanced > Section Styling" collapsible at the bottom of each editor |
| `src/pages/Index.tsx` | Wrap each section `<div>` with inline styles derived from `style_overrides` |
| `src/components/home/SectionStyleWrapper.tsx` (new) | Shared wrapper component that reads `style_overrides` and applies `style={{ paddingTop, paddingBottom, background, color }}` plus Tailwind max-width classes |

**How it works**: Each section's wrapper reads `style_overrides` from the section config and applies CSS inline styles. The editor provides a collapsible "Section Styling" panel with:
- Background type selector (none / solid color / gradient / image)
- Color picker for background and text
- Padding top/bottom sliders (16-200px)
- Content max-width selector
- Live preview updates via postMessage bridge

---

### Feature 2: Media/Image Upload for Custom Sections

Replace URL-only image inputs with a proper upload flow using the existing storage infrastructure.

**Storage Setup**

Create a new public storage bucket `website-sections` via SQL migration:

```text
INSERT INTO storage.buckets (id, name, public) VALUES ('website-sections', 'website-sections', true);
-- RLS: authenticated users can upload/delete, anyone can read
```

**Implementation**

| File | Change |
|------|--------|
| SQL migration | Create `website-sections` bucket with RLS policies for authenticated upload and public read |
| `src/components/dashboard/website-editor/inputs/ImageUploadInput.tsx` (new) | Reusable component: drag-and-drop zone, file picker, upload to `website-sections` bucket, returns public URL. Shows thumbnail preview, loading state, and delete button. Uses `optimizeImage()` from `src/lib/image-utils.ts` for client-side compression before upload |
| `src/components/dashboard/website-editor/CustomSectionEditor.tsx` | Replace the plain `<Input>` for `image_url` (in `image_text` type) with `<ImageUploadInput>`. Keep the URL input as a fallback "or paste URL" option |
| `src/components/dashboard/website-editor/SectionStyleEditor.tsx` | Use `ImageUploadInput` for background image selection when `background_type === 'image'` |
| `src/components/home/CustomSectionRenderer.tsx` | No changes needed -- it already renders `image_url` as an `<img>` src |

**Component Design for `ImageUploadInput`**:
- Drop zone with dashed border and upload icon
- "Or paste URL" text input below
- On file drop/select: optimize via `optimizeImage()`, upload to `website-sections/{sectionId}/{timestamp}.webp`, return public URL
- Thumbnail preview with remove button once uploaded
- Accepts `value` (current URL) and `onChange` (new URL) props
- `bucket` and `path` props for flexibility across different contexts

---

### Feature 3: Multi-Page Support

Extend the editor and routing to support About, Contact, and custom pages beyond the homepage.

**Data Model**

Add a new `site_settings` key: `website_pages`

```text
WebsitePagesConfig {
  pages: PageConfig[];
}

PageConfig {
  id: string;                    // e.g. "home", "about", "contact", "custom_xyz"
  slug: string;                  // URL path segment: "", "about", "contact", "our-story"
  title: string;                 // "Home", "About Us", "Contact"
  seo_title: string;
  seo_description: string;
  enabled: boolean;
  show_in_nav: boolean;          // whether to show in the header navigation
  nav_order: number;
  sections: SectionConfig[];     // each page has its own section array
  page_type: 'home' | 'standard' | 'custom';
  deletable: boolean;
}
```

**Migration from current model**: The existing `website_sections` setting becomes the `sections` array for the `home` page. A migration helper converts the current flat structure into the pages model on first load.

**Implementation**

| File | Change |
|------|--------|
| `src/hooks/useWebsitePages.ts` (new) | New hook: `useWebsitePages()`, `useUpdateWebsitePages()`. Manages the `website_pages` site setting. Includes migration from `website_sections` to pages model. Default pages: Home, About, Contact |
| `src/hooks/useWebsiteSections.ts` | Becomes a thin wrapper that reads/writes sections for the currently selected page. Add `pageId` parameter |
| `src/pages/DynamicPage.tsx` (new) | Generic page component that reads its `PageConfig` by slug and renders its sections array (same pattern as `Index.tsx`) |
| `src/App.tsx` | Add a catch-all route under `/org/:orgSlug/*` that renders `DynamicPage`. Keep existing hardcoded routes (about, services, etc.) as higher-priority matches |
| `src/components/layout/Header.tsx` | Read `website_pages` config and dynamically render nav links for pages where `show_in_nav === true`, ordered by `nav_order` |
| `src/components/dashboard/website-editor/WebsiteEditorSidebar.tsx` | Add a "Pages" section above "Site Content" with a page selector dropdown. Selecting a page loads that page's sections into the layout area. Add "Add Page" and "Delete Page" controls |
| `src/components/dashboard/website-editor/PageSettingsEditor.tsx` (new) | Editor for page-level settings: title, slug, SEO title/description, show-in-nav toggle |
| `src/pages/dashboard/admin/WebsiteSectionsHub.tsx` | Add page context state. Pass selected page to sidebar and editors. Update breadcrumb to show "Home > Hero" or "About > Rich Text" |
| `src/components/SEO.tsx` | Accept dynamic title/description from `PageConfig.seo_title` and `seo_description` |

**Routing Architecture**:

```text
/org/:orgSlug              -> Index.tsx (home page, highest priority)
/org/:orgSlug/about        -> existing About.tsx (keep existing)
/org/:orgSlug/services     -> existing Services.tsx (keep existing)
/org/:orgSlug/:pageSlug    -> DynamicPage.tsx (catch-all for custom pages)
```

Existing hardcoded routes remain unchanged. Custom pages use a catch-all that looks up the slug in `website_pages`. If no match is found, render a 404.

**Page Templates**: Default pages come pre-configured:
- **Home**: Current section set (migrated)
- **About**: rich_text (story) + image_text (team) + custom_cta
- **Contact**: rich_text (info) + locations (reused built-in) + custom_cta

---

### Feature 4: Template Library

Pre-built section and page designs users can apply with one click.

**Data Model**

Templates are stored as a static JSON registry (no database needed initially):

```text
SectionTemplate {
  id: string;                    // "hero-minimal", "cta-bold-dark"
  name: string;                  // "Minimal Hero"
  description: string;
  category: 'hero' | 'content' | 'cta' | 'social_proof' | 'team' | 'full_page';
  thumbnail_url: string;         // preview image
  section_type: SectionType;
  default_config: Record<string, unknown>;   // pre-filled config values
  style_overrides?: StyleOverrides;          // pre-set styling
}

PageTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail_url: string;
  sections: { type: SectionType; config: Record<string, unknown>; style_overrides?: StyleOverrides }[];
}
```

**Implementation**

| File | Change |
|------|--------|
| `src/data/section-templates.ts` (new) | Static registry of 15-20 section templates across categories. Each template includes a `default_config` matching its section type's config interface |
| `src/data/page-templates.ts` (new) | Static registry of 4-5 page templates (Landing Page, About Us, Contact, Services Showcase, Minimal) |
| `src/components/dashboard/website-editor/TemplatePicker.tsx` (new) | Modal/dialog with template cards organized by category. Each card shows thumbnail, name, description. Click applies the template config to the current section or creates a new section |
| `src/components/dashboard/website-editor/PageTemplatePicker.tsx` (new) | Similar to TemplatePicker but for full pages. Applies a complete set of sections at once. Shows "This will replace current sections" warning |
| `src/components/dashboard/website-editor/AddSectionDialog.tsx` | Add a "Start from Template" tab alongside the current type picker. Shows `TemplatePicker` filtered to the selected type |
| `src/components/dashboard/website-editor/WebsiteEditorSidebar.tsx` | Add "Browse Templates" button near the "Add Section" button |
| `src/pages/dashboard/admin/WebsiteSectionsHub.tsx` | Add "Apply Page Template" option in the header dropdown |

**Template Categories**:
- **Hero Variants**: Minimal (text only), Split (image + text), Video Background, Full-screen CTA
- **Content Blocks**: Story Block, Feature Grid, Stats Counter, Timeline
- **Social Proof**: Testimonial Carousel, Review Grid, Logo Wall
- **CTA Variants**: Bold Dark, Gradient, Minimal, Split with Image
- **Team**: Grid Cards, Carousel, Bios with Photos
- **Full Page Templates**: Salon Landing, About Us, Contact, Services Showcase

**Application Flow**:
1. User clicks "Add Section" or "Browse Templates"
2. Template picker opens with category filter tabs
3. User selects a template -- preview shown
4. "Apply" creates a new section with the template's type, config, and style overrides pre-filled
5. User can then customize everything via the normal editor

---

### Implementation Order and Dependencies

```text
Phase 1: Per-Section Style Overrides
  -- No dependencies, extends existing SectionConfig
  -- Estimated scope: 3 new files, 15+ files modified

Phase 2: Media/Image Upload
  -- Depends on: storage bucket creation
  -- Estimated scope: 1 migration, 2 new files, 3 modified

Phase 3: Multi-Page Support
  -- Depends on: Phase 1 (style overrides travel with sections)
  -- Largest change: new routing, page model, sidebar redesign
  -- Estimated scope: 4 new files, 8+ modified, 1 migration (optional)

Phase 4: Template Library
  -- Depends on: Phase 1 (templates include style overrides) + Phase 3 (page templates)
  -- Estimated scope: 5 new files, 3 modified
  -- Can be partially built alongside Phase 1 (section templates only)
```

---

### Database Changes Required

Only one SQL migration is needed across all four features:

1. **Storage bucket**: `website-sections` (public, with authenticated upload RLS)
2. No new tables -- all config continues to live in `site_settings` as JSON

The `site_settings` table already supports arbitrary JSON values, so the new `website_pages` config, style overrides, and template references all fit within the existing schema.

