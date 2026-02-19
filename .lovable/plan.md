

## Website Editor Generalization: Analysis and Enhancement Plan

This plan addresses the core issue -- the website editor labels and defaults are hardcoded to Drop Dead Salon's specific context, making the editor unusable for other salons using the same theme. Beyond relabeling, this identifies structural gaps preventing a truly customizable site builder.

---

### Problem Areas Identified

**1. Hardcoded "New Client / Returning Client" Labels (Hero Editor)**
- `HeroEditor.tsx` line 106: "New Client Button Text"
- `HeroEditor.tsx` line 114: "New Client Button URL"
- `HeroEditor.tsx` line 121: "Returning Client Button Text"
- `HeroEditor.tsx` line 129: "Returning Client Button URL"
- These should be "Primary Button" and "Secondary Button"

**2. Drop Dead-Specific Default Values (useSectionConfig.ts)**
- Brand Statement eyebrow: "Drop Dead is" 
- Brand Statement paragraph: "Located in the heart of Mesa and Gilbert, Arizona, Drop Dead Salon..."
- Extensions headline: "Drop Dead Method"
- FAQ intro: "At Drop Dead Hair Studio..."
- Footer defaults: "Drop Dead Salon", "Work at Drop Dead", "Powered by Drop Dead Salon Software"
- These defaults should be generic placeholders that any salon can understand

**3. Missing Component-Level Visibility Controls**
- Individual elements within a section (e.g., consultation notes, scroll indicator, education link) cannot be hidden independently
- The Hero section has no toggle for its consultation notes block
- Extensions has no toggle for the education link or floating badge
- Footer CTA has no toggle for the description text

**4. Missing "Add Component" Capability**
- No way to add custom content blocks or duplicate existing sections
- Section list is fixed at build time -- no dynamic section creation

**5. Inconsistent CTA Labeling Across Editors**
- Hero: "New Client Button Text" / "Returning Client Button Text"
- Extensions: "Primary CTA" / "Secondary CTA" (already correct)
- FAQ: "Primary Button Text" / "Secondary Button Text" (already correct)
- Footer CTA: "Button Text" (already correct)
- New Client CTA: "CTA Button Text" (acceptable)

---

### Implementation Plan

#### Phase 1: Relabel All Editors to Generic Terminology

**File: `src/components/dashboard/website-editor/HeroEditor.tsx`**
- Line 104: Change section header to "Call to Action Buttons" (keep as-is, this is fine)
- Line 106: "New Client Button Text" --> "Primary Button Text"
- Line 114: "New Client Button URL" --> "Primary Button URL"
- Line 118: Update description: "Leave empty to open consultation form" --> "Leave empty to open the default form"
- Line 121: "Returning Client Button Text" --> "Secondary Button Text"
- Line 129: "Returning Client Button URL" --> "Secondary Button URL"
- Lines 138-155: "Consultation Notes" --> "Below-Button Notes" with field labels "Note Line 1/2" kept generic

**File: `src/hooks/useSectionConfig.ts`** -- Neutralize all defaults:
- Line 264: Eyebrow default --> "Your Tagline Here"
- Line 265: Rotating words --> ["Salon", "Studio", "Experience"]
- Line 266-267: Subheadlines --> generic placeholders
- Line 268-269: CTA defaults --> "Book Now" / "Explore Services"
- Line 270-271: Note defaults --> "" (empty)
- Line 281: Brand Statement eyebrow --> "Our Brand"
- Line 286-287: Paragraphs --> generic salon description
- Line 325-326: Extensions headline --> "Our Signature" / "Method"
- Line 347-348: FAQ intro --> generic FAQ intro text
- Lines 362-367: Brands --> empty array (each salon adds their own)
- Footer defaults (FooterEditor.tsx lines 42-59): neutralize "Drop Dead" references

#### Phase 2: Add Per-Element Visibility Toggles

Add `show_*` boolean fields to section configs so individual components can be hidden:

**HeroConfig** (add to interface + defaults):
- `show_secondary_button: boolean` (default: true)
- `show_consultation_notes: boolean` (default: true)

**ExtensionsConfig** (add):
- `show_education_link: boolean` (default: true)
- `show_floating_badge: boolean` (default: true)
- `show_secondary_cta: boolean` (default: true)

**FooterCTAConfig** (add):
- `show_description: boolean` (default: true)
- `show_eyebrow: boolean` (default: true)

**NewClientConfig** (add):
- `show_benefits: boolean` (default: true)

Each editor gets a `ToggleInput` next to the relevant field group, allowing the salon owner to hide that component without deleting content.

#### Phase 3: Add Component Visibility to Hero Editor UI

Update `HeroEditor.tsx` to wrap the secondary button fields and consultation notes in collapsible blocks gated by their new `show_*` toggles. When toggled off, the fields collapse and the preview hides that element.

#### Phase 4: Footer Editor Generalization

Update `FooterEditor.tsx`:
- Line 42: tagline --> "" (empty placeholder)
- Line 43: copyright --> "(c) {year} Your Salon Name"
- Line 44: contact_email --> ""
- Lines 56-58: bottom_links --> empty array
- Line 59: powered_by_text --> ""

---

### Files Modified

| File | Changes |
|------|---------|
| `src/components/dashboard/website-editor/HeroEditor.tsx` | Relabel CTA fields to Primary/Secondary, add visibility toggles |
| `src/hooks/useSectionConfig.ts` | Neutralize all Drop Dead defaults, add `show_*` booleans to interfaces |
| `src/components/dashboard/website-editor/FooterEditor.tsx` | Neutralize footer defaults |
| `src/components/dashboard/website-editor/NewClientEditor.tsx` | Add `show_benefits` toggle |
| `src/components/dashboard/website-editor/ExtensionsEditor.tsx` | Add visibility toggles for education link, floating badge, secondary CTA |
| `src/components/dashboard/website-editor/FooterCTAEditor.tsx` | Add visibility toggles for eyebrow and description |

---

### What This Does NOT Cover (Future Phases)

These are identified gaps that require deeper architectural changes and should be separate efforts:

1. **Dynamic Section Creation** -- allowing users to add custom content blocks (rich text, image+text, video embeds) beyond the fixed section list. This requires a block-based content model.

2. **Section Duplication** -- cloning an existing section with its config to create variations (e.g., two different CTA sections).

3. **Per-Section Style Overrides** -- letting each section customize its own background color, padding, font size independent of the theme.

4. **Image/Media Management Per Section** -- hero background images, section background images, custom icons beyond the current Lucide set.

5. **Custom CSS Injection** -- advanced users adding custom styles to specific sections.

6. **Multi-Page Support** -- the editor currently only manages the homepage. A full site builder needs page-level management (About, Contact, etc.).

