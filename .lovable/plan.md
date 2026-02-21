

# Remaining Audit Plan: Items #7 and #9

## Item #7 -- Persona Density Scaling

### Problem
All roles currently see nearly the same dashboard density. The `dashboard_element_visibility` table has ~153 elements per role, but almost all are set to `is_visible = true`. Solo operators (stylists, booth renters) are exposed to the same 8+ Command Center cards, leadership widgets, and analytics surfaces as multi-location owners -- violating the persona scaling doctrine.

### Current State
- VisibilityGate infrastructure is healthy and already wraps dashboard elements
- The `dashboard_element_visibility` table has entries for all roles
- Stylists have only 5 elements hidden; booth renters and bookkeepers have 0 hidden
- 154+ elements are visible to every persona by default

### Approach
Run a SQL migration to set `is_visible = false` for elements that should be hidden from simpler personas. No code changes required -- the existing VisibilityGate system will enforce the new defaults automatically.

**Persona-specific hiding rules:**

| Role | Elements to Hide | Rationale |
|------|-----------------|-----------|
| `stylist` | Leadership Widgets, Leadership Cards, Payroll admin, multi-location analytics, operations management | Stylists need personal performance, not enterprise metrics |
| `stylist_assistant` | Same as stylist + additional analytics hub leadership/operations elements | Assistants need even less complexity |
| `booth_renter` | All leadership, operations, payroll, program admin, team overview cards | Booth renters are independent operators -- simplest view |
| `receptionist` | Leadership analytics, payroll, program admin, forecasting | Receptionists need scheduling and client tools, not financial analytics |
| `bookkeeper` | Operations widgets, leadership widgets, program cards, team overview | Bookkeepers need financial surfaces only |

Estimated: ~40-60 visibility rows updated per role, targeting elements in categories like "Leadership Widgets", "Leadership Cards", "Analytics Hub - Leadership", "Forecasting", and "Payroll".

---

## Item #9 -- Legacy dd75 Asset and DB Key Renames

### Problem
74 references to `dd75` remain across 8 source files. These are internal asset filenames and database category keys from a legacy tenant brand.

### Current State
- 4 SVG asset files: `dd75-icon.svg`, `dd75-icon-white.svg`, `dd75-logo.svg`, `dd75-logo-white.svg`
- Import aliases in `EmailTemplateEditor.tsx`, `ColoredLogo.tsx`, `Program.tsx`
- Category key `'dd75'` used in `Training.tsx`, `VideoUploadDialog.tsx`, `VideoLibraryManager.tsx`, `TeamProgressDashboard.tsx`
- Database `training_videos.category` column allows `'dd75'` as a value (but 0 rows currently use it)
- No data migration needed -- the table is empty

### Approach

**Step 1: Rename asset files**
- `dd75-icon.svg` -> `brand-icon.svg`
- `dd75-icon-white.svg` -> `brand-icon-white.svg`
- `dd75-logo.svg` -> `brand-wordmark.svg`
- `dd75-logo-white.svg` -> `brand-wordmark-white.svg`

**Step 2: Update all imports** (6 files)
- `EmailTemplateEditor.tsx` -- update 4 imports and logo preset IDs (`dd75-icon-black` -> `brand-icon-black`, etc.)
- `ColoredLogo.tsx` -- update import from `dd75-logo.svg` to `brand-wordmark.svg`
- `Program.tsx` -- update import from `dd75-logo.svg` to `brand-wordmark.svg`
- `MyProfile.tsx` -- update asset path from `dd75-icon.svg` to `brand-icon.svg`

**Step 3: Update category keys** (4 files)
- Replace `'dd75'` category key with `'client_engine'` in:
  - `Training.tsx`
  - `VideoUploadDialog.tsx`
  - `VideoLibraryManager.tsx`
  - `TeamProgressDashboard.tsx`

**Step 4: Database migration**
- Update any `training_videos` rows with `category = 'dd75'` to `'client_engine'` (currently 0 rows, but future-proofs the schema)

### Technical Details

**Files modified:**
- 4 SVG files renamed (copy + delete pattern since direct rename isn't available)
- 8 TypeScript/TSX files updated with new import paths and category keys
- 1 SQL migration for category key update
- Total: ~12 file operations

**Risk:** Low. No data exists with the old category key. Asset renames are internal-only (not user-facing URLs). All changes are mechanical find-and-replace.

---

## Execution Order

1. **#9 first** (legacy dd75 renames) -- purely mechanical, no risk
2. **#7 second** (persona density scaling) -- SQL migration to set visibility defaults

After both are complete, all 10 audit remediation items will be marked done.
