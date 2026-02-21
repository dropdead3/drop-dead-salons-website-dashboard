
# Remediation Plan — COMPLETE

All gaps have been resolved.

## Gap 1: EmailTemplateEditor Brand IDs ✅
- Renamed all `drop-dead-main-*` IDs to `brand-primary-*`
- Renamed `dd-secondary-*` IDs to `brand-secondary-*`
- Renamed `drop-dead-premium` theme ID to `premium-dark`
- Renamed 4 SVG assets to `brand-logo-primary.svg`, `brand-logo-primary-white.svg`, `brand-logo-secondary.svg`, `brand-logo-secondary-white.svg`

## Gap 2: Database Column Rename ✅
- Migrated `why_drop_dead` → `why_join_us` in `job_applications` table
- Updated `useJobApplications.ts` and `ApplicantDetailSheet.tsx`

## Gap 3: CSS Comment ✅
- Removed "Drop Dead Salon" from index.css comment

## Gap 4: Secondary Logo Renames ✅
- Included in Gap 1 asset renames

## Out of Scope (Accepted)
- `rounded-2xl` (525 matches): Non-dashboard elements, acceptable
- `verify_jwt = false`: config.toml setting, handled internally
- 2 RLS "always true" warnings: Intentional for public forms
