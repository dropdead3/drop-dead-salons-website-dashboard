

# Font-Weight Cleanup: Replace All Prohibited `font-bold` and `font-semibold` Instances

## Scope

- **67 files** with `font-bold` (704 instances)
- **122 files** with `font-semibold` (1,214 instances)
- **0 files** with `font-extrabold` or `font-black`
- Total: ~1,918 violations across ~162 unique files

## Replacement Rules

| Current Class | Replacement | Context Notes |
|---|---|---|
| `font-bold` | `font-medium` | For stat values, headings, emphasis text |
| `font-semibold` | `font-medium` | For labels, card titles, names, badges |
| `font-bold` on headings | `font-display font-medium` | Where the element is clearly a headline/stat and should use Termina |
| `font-semibold` on `font-mono` code | `font-medium` | Preserve `font-mono`, just swap weight |

Exception: `font-serif` (Laguna) supports bold -- any `font-serif font-bold` instances can remain.

## Batch Execution Plan

Work will proceed in logical groups by directory to minimize context-switching:

### Batch 1: Foundation Layer
- `src/components/ui/ZuraAvatar.tsx` (1 file)

### Batch 2: Dashboard Core
- `src/components/dashboard/` -- largest cluster including:
  - Analytics charts and KPI tiles
  - Booth renters / payments
  - Schedule and agenda views
  - Email template editor
  - Changelog components
  - Sales comparison tools
  - Client management
  - Settings panels

### Batch 3: Communication and Chat
- `src/components/team-chat/` (channel headers, message lists, sortable items)

### Batch 4: Platform Admin
- `src/components/platform/` (health gauges, PandaDoc status, revenue)

### Batch 5: Mobile Components
- `src/components/mobile/` (agenda cards, mobile views)

### Batch 6: Pages
- `src/pages/` (ProductDemo, RenterPayRent, DocumentTracker, IncidentReports, platform pages)

### Batch 7: Remaining Components
- `src/components/demo/`
- `src/components/home/`
- `src/components/features/`
- `src/components/auth/`
- `src/components/coaching/`
- `src/components/achievements/`
- `src/components/executive-brief/`
- All other subdirectories with violations

## Technical Details

- Every `font-bold` and `font-semibold` class will be replaced with `font-medium`
- Where a heading currently uses `font-bold` without `font-display`, evaluate whether adding `font-display` (Termina, uppercase, tracked) is appropriate for the context
- `font-mono font-semibold` becomes `font-mono font-medium`
- No structural, layout, or data changes -- purely class string replacements
- The existing CSS guardrail in `index.css` already caps weight to 500 at runtime, but the source code should be correct to avoid confusion and ensure the guardrail can eventually be removed

## Verification

- Visual spot-check across dashboard, analytics, team chat, platform admin, and mobile views
- Confirm no regressions in text hierarchy or readability
- Search codebase post-cleanup to confirm zero remaining violations

