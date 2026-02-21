

## Settings Page UI Audit and Fixes

### Issues Found

**1. Card Header Pattern Violations (canonical-card-header-pattern)**
The Experience Levels and Team Commission Roster cards use the old pattern where the icon is missing from the card header. Per the design system, all card headers must include a `tokens.card.iconBox` with a `tokens.card.icon` to the left of the `CardTitle`.

- `StylistLevelsContent.tsx` -- Experience Levels card has no icon box
- `TeamCommissionRoster.tsx` -- Team Commission Roster card has no icon box
- `CommissionIntelligence.tsx` -- Team Commission Breakdown card uses an inline icon without the proper icon box wrapper

**2. Typography Rule Violations (design-rules)**
- `CommissionIntelligence.tsx` line 221: Uses `font-semibold` on the total row -- this is a **banned** weight class (max is `font-medium` / 500)
- `CommissionIntelligence.tsx` line 101: Section heading uses raw `text-lg font-display` instead of `tokens.heading.card`

**3. Settings Sub-Page Header Inconsistency**
The Stylist Levels sub-page uses a raw inline back button and a manually styled `h1` (line 937-948 in Settings.tsx). This is inconsistent with other pages that use `DashboardPageHeader`. The header should use the canonical `DashboardPageHeader` component for consistency with other settings sub-pages.

**4. CommissionIntelligence Summary Cards Missing Icon Box Standard**
The three summary cards in `CommissionIntelligence.tsx` use `p-3 rounded-lg bg-primary/10` for their icon containers. The canonical token is `tokens.card.iconBox` (`w-10 h-10 bg-muted flex items-center justify-center rounded-lg`). These should be aligned.

**5. Missing Canonical Card Title Token**
Several `CardTitle` elements use `font-display text-lg` instead of `tokens.card.title` (`font-display text-base tracking-wide`). This creates an inconsistent heading size.

Affected locations:
- `StylistLevelsContent.tsx` line 283
- `TeamCommissionRoster.tsx` line 156

---

### Plan

**File: `src/components/dashboard/settings/StylistLevelsContent.tsx`**
- Add icon box (`tokens.card.iconBox` with `Layers` icon) to Experience Levels card header
- Replace raw `font-display text-lg` on CardTitle with `tokens.card.title`

**File: `src/components/dashboard/settings/TeamCommissionRoster.tsx`**
- Add icon box (`tokens.card.iconBox` with `Users` icon) to Team Commission Roster card header
- Replace raw `font-display text-lg` on CardTitle with `tokens.card.title`

**File: `src/components/dashboard/payroll/CommissionIntelligence.tsx`**
- Fix `font-semibold` on total row (line 221) -- replace with `font-medium`
- Replace section heading (line 101) with `tokens.heading.card`
- Add icon box to the Team Commission Breakdown card header (line 168)
- Align summary card icon containers to `tokens.card.iconBox`
- Use `tokens.card.title` on CardTitle

**File: `src/pages/dashboard/admin/Settings.tsx`**
- Replace the raw back button + h1 in the active category view (lines 937-948) with `DashboardPageHeader`, matching the pattern used on all other settings sub-pages. This gives consistent back-button behavior, proper `font-display text-xl md:text-2xl` sizing, and correct layout alignment.

---

### Files Changed

| File | Change |
|------|--------|
| `src/components/dashboard/settings/StylistLevelsContent.tsx` | Add icon box, fix card title token |
| `src/components/dashboard/settings/TeamCommissionRoster.tsx` | Add icon box, fix card title token |
| `src/components/dashboard/payroll/CommissionIntelligence.tsx` | Fix banned font weight, standardize tokens, add icon box |
| `src/pages/dashboard/admin/Settings.tsx` | Replace raw header with `DashboardPageHeader` |

