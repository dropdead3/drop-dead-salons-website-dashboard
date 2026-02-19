

## Add Granular Visibility Toggles to Every Section Editor

Every sub-component within each section editor will get a `show_*` toggle, giving users full control over what appears on their site. This follows the pattern already established in `FooterCTAEditor` (which has `show_eyebrow`, `show_description`).

---

### What Changes

For each section, new `show_*` boolean fields will be added to the config interface and defaults in `useSectionConfig.ts`, and corresponding `ToggleInput` controls will be added to the editor UI. When toggled off, the field's input is hidden (collapsed) in the editor, and the frontend rendering component will skip rendering that element.

---

### Section-by-Section Toggle Map

**HeroEditor** (partially done -- adding missing ones)
- `show_eyebrow` -- toggle eyebrow text
- `show_rotating_words` -- toggle the rotating headline words
- `show_subheadline` -- toggle both subheadline lines
- Already has: `show_secondary_button`, `show_consultation_notes`, `show_scroll_indicator`

**BrandStatementEditor**
- `show_eyebrow` -- toggle eyebrow text
- `show_headline` -- toggle the prefix/suffix/rotating headline
- `show_paragraphs` -- toggle description paragraphs

**TestimonialsEditor**
- `show_eyebrow` -- toggle eyebrow text
- `show_headline` -- toggle the headline
- `show_google_review_link` -- toggle the Google Review link/button
- Already has: `show_star_ratings`

**NewClientEditor** (partially done)
- `show_headline` -- toggle headline prefix + rotating words
- `show_description` -- toggle description text
- `show_cta` -- toggle the CTA button
- Already has: `show_benefits`

**ExtensionsEditor** (partially done)
- `show_eyebrow` -- toggle eyebrow text
- `show_headline` -- toggle both headline lines
- `show_description` -- toggle description
- `show_features` -- toggle all feature cards
- `show_primary_cta` -- toggle primary CTA button
- Already has: `show_secondary_cta`, `show_floating_badge`, `show_education_link`

**FAQEditor**
- `show_rotating_words` -- toggle headline rotating words
- `show_intro_paragraphs` -- toggle intro paragraphs
- `show_primary_cta` -- toggle primary CTA button
- `show_secondary_cta` -- toggle secondary CTA button
- Already has: `show_search_bar`

**FooterCTAEditor** (partially done)
- `show_headline` -- toggle headline lines
- `show_cta_button` -- toggle the CTA button
- Already has: `show_eyebrow`, `show_description`, `show_phone_numbers`

**FooterEditor**
- `show_tagline` -- toggle tagline
- `show_social_links` -- toggle social media section
- `show_nav_links` -- toggle navigation links
- `show_bottom_links` -- toggle bottom bar links
- `show_powered_by` -- toggle powered-by text

**BrandsManager**
- Already has: `show_intro_text`
- `show_logos` -- toggle logo images (show text-only marquee)

**DrinksManager**
- `show_eyebrow` -- toggle the eyebrow header text
- `show_drink_images` -- toggle drink images (text-only mode)

**SectionDisplayEditor-based editors** (Gallery, Locations, Popular Services, Services Preview, Stylists)
- `show_eyebrow` -- toggle eyebrow text
- `show_title` -- toggle section title
- `show_description` -- toggle section description

---

### Implementation Approach

**Step 1: Update config types and defaults** (`useSectionConfig.ts`)
Add the new `show_*` boolean fields to each config interface and set them all to `true` by default (non-breaking -- existing sites render unchanged).

**Step 2: Update each editor** (13 editor files)
For each new toggle, wrap the corresponding field input(s) in a conditional: show a `ToggleInput` above, and only render the input fields when the toggle is on. This matches the existing pattern used in `FooterCTAEditor`.

**Step 3: Update frontend rendering** (homepage section components)
In each section's rendering component (`HeroSection.tsx`, `BrandStatementSection.tsx`, etc.), read the `show_*` flags and conditionally render sub-elements. Elements with `show_*: false` simply don't render.

---

### Technical Details

**Files to modify:**

| File | Changes |
|------|---------|
| `src/hooks/useSectionConfig.ts` | Add ~30 new `show_*` boolean fields across 11 config interfaces + defaults |
| `src/components/dashboard/website-editor/HeroEditor.tsx` | Add 3 new toggles (eyebrow, rotating words, subheadline) |
| `src/components/dashboard/website-editor/BrandStatementEditor.tsx` | Add 3 toggles (eyebrow, headline, paragraphs) |
| `src/components/dashboard/website-editor/TestimonialsEditor.tsx` | Add 3 toggles (eyebrow, headline, google review link) |
| `src/components/dashboard/website-editor/NewClientEditor.tsx` | Add 3 toggles (headline, description, CTA) |
| `src/components/dashboard/website-editor/ExtensionsEditor.tsx` | Add 4 toggles (eyebrow, headline, description, features) + 1 primary CTA toggle |
| `src/components/dashboard/website-editor/FAQEditor.tsx` | Add 4 toggles (rotating words, intro, primary CTA, secondary CTA) |
| `src/components/dashboard/website-editor/FooterCTAEditor.tsx` | Add 2 toggles (headline, CTA button) |
| `src/components/dashboard/website-editor/FooterEditor.tsx` | Add 5 toggles (tagline, social, nav links, bottom links, powered by) |
| `src/components/dashboard/website-editor/BrandsManager.tsx` | Add 1 toggle (logos) |
| `src/components/dashboard/website-editor/DrinksManager.tsx` | Add 2 toggles (eyebrow, drink images) |
| `src/components/dashboard/website-editor/GalleryDisplayEditor.tsx` | Add 3 toggle fields to FIELDS array |
| `src/components/dashboard/website-editor/LocationsDisplayEditor.tsx` | Add 3 toggle fields to FIELDS array |
| `src/components/dashboard/website-editor/PopularServicesEditor.tsx` | Add 3 toggle fields to FIELDS array |
| `src/components/dashboard/website-editor/ServicesPreviewEditor.tsx` | Add 3 toggle fields to FIELDS array |
| `src/components/dashboard/website-editor/StylistsDisplayEditor.tsx` | Add 3 toggle fields to FIELDS array |

**Frontend rendering files** (conditional rendering based on `show_*` flags):
- `src/components/home/HeroSection.tsx`
- `src/components/home/BrandStatementSection.tsx`
- `src/components/home/TestimonialsSection.tsx`
- `src/components/home/NewClientCTA.tsx`
- `src/components/home/ExtensionsSection.tsx`
- `src/components/home/FAQPreviewSection.tsx`
- `src/components/home/FooterCTA.tsx`
- `src/components/layout/Footer.tsx`
- `src/components/home/BrandsMarquee.tsx`
- `src/components/home/DrinkMenuSection.tsx`
- `src/components/home/GallerySection.tsx`
- `src/components/home/LocationsSection.tsx`
- `src/components/home/PopularServicesSection.tsx`
- `src/components/home/ServicesPreviewSection.tsx`
- `src/components/home/StylistsSection.tsx`

**Pattern used** (consistent across all editors):
```text
// Editor side: wrap inputs with toggle
<ToggleInput
  label="Show Eyebrow"
  value={localConfig.show_eyebrow}
  onChange={(v) => updateField('show_eyebrow', v)}
  description="Display the small text above the headline"
/>
{localConfig.show_eyebrow && (
  <CharCountInput label="Eyebrow Text" ... />
)}

// Frontend side: conditionally render
{config.show_eyebrow !== false && (
  <Eyebrow>{config.eyebrow}</Eyebrow>
)}
```

The `!== false` check ensures backward compatibility -- existing configs without the field still render the element (defaults to visible).

**No database changes required.** All toggles are stored as JSON fields within the existing `site_settings.value` JSONB column.
