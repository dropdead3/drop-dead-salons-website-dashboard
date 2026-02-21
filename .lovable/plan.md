

## Retitle "Service Add-Ons" to "Service Add-Ons & Extras"

A cosmetic rename of user-facing labels across the UI. No database or code logic changes — only display strings.

### Changes

| File | What Changes |
|------|-------------|
| `src/components/dashboard/settings/ServiceAddonsLibrary.tsx` (line 425) | Card title: `SERVICE ADD-ONS` becomes `SERVICE ADD-ONS & EXTRAS` |
| `src/components/dashboard/settings/ServicesSettingsContent.tsx` (line 556) | Code comment updated for consistency |
| `src/pages/dashboard/Stats.tsx` (line 355) | Section heading: `STYLIST ADD-ON PERFORMANCE` becomes `STYLIST ADD-ON & EXTRAS PERFORMANCE` |
| `src/pages/dashboard/Stats.tsx` (line 348) | Visibility gate element name updated |
| `src/components/dashboard/schedule/QuickBookingPopover.tsx` (line 1179) | Virtual category label: `Add-Ons` becomes `Add-Ons & Extras` |
| `src/components/dashboard/schedule/QuickBookingPopover.tsx` (line 1205) | Category header when viewing add-ons list |
| `src/components/dashboard/schedule/ServiceAddonToast.tsx` (line 46) | Toast header text: `Frequently added with {categoryName}` stays the same (no "Service Add-Ons" text here, so no change needed) |

All internal code (hook names, table names, query keys, variable names) stays unchanged — this is purely a display-label update.

