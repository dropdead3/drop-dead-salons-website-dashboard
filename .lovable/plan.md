

# Remaining Gaps — Remediation Plan

## Gap 1: EmailTemplateEditor Brand IDs (High Priority)

`EmailTemplateEditor.tsx` still contains **77 references** to legacy brand strings:

- **Asset imports**: `drop-dead-logo.svg`, `drop-dead-logo-white.svg` (lines 87, 92)
- **Logo preset IDs**: `drop-dead-main-black`, `drop-dead-main-white`, `drop-dead-main` (used as baseId and default logoId throughout)
- **Theme ID**: `drop-dead-premium` used as default selected theme (line 1208) and for Crown icon logic (line 3035)
- **Default fallback logoIds**: Hardcoded `'drop-dead-main-white'` in footer defaults (~6 locations), `'drop-dead-main-black'` in header defaults (~3 locations)

**Fix**: Rename all internal IDs:
- `drop-dead-main-black` -> `brand-primary-black`
- `drop-dead-main-white` -> `brand-primary-white`
- `drop-dead-main` (baseId) -> `brand-primary`
- `drop-dead-premium` (theme ID) -> `premium-dark`
- Import paths: `drop-dead-logo.svg` -> `brand-logo-primary.svg`, `drop-dead-logo-white.svg` -> `brand-logo-primary-white.svg`

Also rename the actual SVG asset files to match.

**Files**: `EmailTemplateEditor.tsx` (bulk find-replace), 2 SVG asset renames

---

## Gap 2: Database Column `why_drop_dead` (Medium Priority)

The `job_applications` table has a column named `why_drop_dead`. This leaks tenant branding into the schema.

- Referenced in `useJobApplications.ts` (lines 14, 207)
- Displayed in `ApplicantDetailSheet.tsx` (line 215) with label "Why Us?"
- Present in auto-generated `types.ts` (read-only, will update after migration)

**Fix**: 
- SQL migration: `ALTER TABLE job_applications RENAME COLUMN why_drop_dead TO why_join_us;`
- Update `useJobApplications.ts` type interfaces
- Update `ApplicantDetailSheet.tsx` field reference

**Files**: 1 migration, 2 source files

---

## Gap 3: CSS Comment in index.css (Low Priority)

Line 11 of `src/index.css` contains: `/* Drop Dead Salon - Cream Editorial Luxury Design System */`

**Fix**: Replace with `/* Cream Editorial Luxury Design System */`

**Files**: `index.css` (1 line)

---

## Gap 4: Remaining `dd-secondary-logo` References (Low Priority)

`EmailTemplateEditor.tsx` imports `dd-secondary-logo.svg` and `dd-secondary-logo-white.svg` (lines 88, 93). These are legacy asset names.

**Fix**: Rename assets to `brand-logo-secondary.svg` and `brand-logo-secondary-white.svg`, update imports.

**Files**: 2 SVG renames, `EmailTemplateEditor.tsx` imports

---

## Out of Scope (Acceptable)

- **`rounded-2xl` (525 matches)**: Most are on non-dashboard elements (kiosk buttons, public pages, dialogs, platform admin). The UI Canon rule targets dashboard Card containers specifically. A full sweep would be disruptive with low ROI. The dashboard cards were already fixed in the prior pass.
- **`verify_jwt = false` on all 68 edge functions**: This is a `config.toml` setting that cannot be edited. The functions themselves handle auth internally where needed. This is an architectural awareness item, not a code gap.
- **2 remaining RLS "always true" warnings**: Previously confirmed as intentional for `day_rate_bookings` and `job_applications` (public-facing forms).

---

## Execution Order

1. Gap 1 (EmailTemplateEditor brand IDs + asset renames) — largest surface area
2. Gap 2 (DB column rename `why_drop_dead` -> `why_join_us`)
3. Gap 3 + Gap 4 (CSS comment + secondary logo renames) — quick mechanical fixes

**Total**: ~6 file edits, 4 asset renames, 1 DB migration

