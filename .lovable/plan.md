

## Staffing Tab UI Audit and Cohesiveness Fixes

### Issues Found (13 violations across 5 components)

---

### 1. Icon Color Violations (CARD_HEADER_DESIGN_RULES: "w-5 h-5 text-primary")

| Card | Current | Should Be |
|------|---------|-----------|
| STYLISTS BY LEVEL | `text-chart-5` | `text-primary` |
| CLIENT EXPERIENCE SCORECARD | `text-chart-4` | `text-primary` |

**File:** `StylistsOverviewCard.tsx` line 49, `StylistExperienceCard.tsx` line 200

---

### 2. Configure Button Inconsistency (HiringCapacityCard)

The HIRING CAPACITY card uses `variant="ghost"` with raw classes for its Configure button, while STYLISTS BY LEVEL uses the correct `variant="outline"` with `tokens.button.cardAction` (pill style). These must match.

**File:** `HiringCapacityCard.tsx` lines 206-214
- Change `variant="ghost"` to `variant="outline"`
- Add `className={tokens.button.cardAction}`

---

### 3. Workload Card Empty State: Non-Canonical Header

When the STYLIST WORKLOAD DISTRIBUTION card has no data (lines 97-123), its header is completely different from the data state: inline icon with mixed-case title, no icon box.

**File:** `StylistWorkloadCard.tsx` lines 99-115
- Replace inline `CardTitle` with proper icon-box + uppercase title pattern matching the data state (lines 154-166)

---

### 4. Spacing: Individual Card Margins vs Parent Grid

Cards should not carry their own vertical margins. The parent `StaffingContent.tsx` uses `gap-6` in grids for the first two rows, but the last three cards are standalone with their own `mb-6` or `mt-6`. This creates double-spacing in some cases and inconsistent gaps.

| Card | Current | Fix |
|------|---------|-----|
| StylistWorkloadCard | `className="mb-6"` (lines 72, 98, 152) | Remove `mb-6` |
| StaffRevenueLeaderboard | `className="mt-6"` (line 75) | Remove `mt-6` |
| StylistExperienceCard | `className="mt-6"` (line 195) | Remove `mt-6` |

**File:** `StaffingContent.tsx` -- wrap the last three cards in a `space-y-6` container to provide consistent spacing from the parent.

---

### 5. Subsection Headers Not Using Design Tokens

Internal subsection headings inside cards use raw `h4 text-sm font-medium` instead of `tokens.heading.subsection`.

| Card | Heading Text | Line |
|------|-------------|------|
| HiringCapacityCard | "By Location (Sorted by Priority)" | 256 |
| HiringCapacityCard | "90-Day Hiring Forecast" | 265 |
| StylistWorkloadCard | "Productivity per Appointment" | 242 |

**Fix:** Replace with `tokens.heading.subsection` class.

---

### 6. Bold Weight Violation in Tooltip

StylistExperienceCard tooltip uses `<strong>` tags (lines 223-226) which renders at 700 weight, violating the 500 max rule.

**File:** `StylistExperienceCard.tsx` lines 223-226
- Replace `<strong>` with `<span className="font-medium">`

---

### 7. Staff Revenue Leaderboard Settings Button

The settings gear button uses `variant="outline" size="icon" className="h-8 w-8"` -- an icon-only square button that doesn't match the pill-style `cardAction` pattern used elsewhere. It should match the HIRING CAPACITY and STYLISTS BY LEVEL Configure buttons.

**File:** `StaffRevenueLeaderboard.tsx` line 113
- Change from icon-only to pill button with "Settings" label using `tokens.button.cardAction`

---

### 8. Missing `tokens.card.wrapper` on Several Cards

Cards that use raw `className="p-6"` or `className="mb-6"` without `tokens.card.wrapper` (`rounded-xl`):
- StaffOverviewCard (line 154)
- StylistsOverviewCard (line 45)
- StylistWorkloadCard (lines 72, 98, 152)
- StylistExperienceCard (line 195)
- StaffRevenueLeaderboard (line 75)

These should all include `tokens.card.wrapper` for the standard rounded corner radius.

---

### Files Changed Summary

| File | Changes |
|------|---------|
| `StylistsOverviewCard.tsx` | Fix icon color to `text-primary`, add `tokens.card.wrapper` |
| `HiringCapacityCard.tsx` | Fix Configure button to pill style, subsection headers to tokens |
| `StylistWorkloadCard.tsx` | Fix empty state header, remove `mb-6`, add `tokens.card.wrapper`, subsection headers to tokens |
| `StaffRevenueLeaderboard.tsx` | Fix settings button to pill style, remove `mt-6`, add `tokens.card.wrapper` |
| `StylistExperienceCard.tsx` | Fix icon color to `text-primary`, remove bold `<strong>` tags, remove `mt-6`, add `tokens.card.wrapper` |
| `StaffingContent.tsx` | Wrap standalone cards in `space-y-6` for consistent spacing |

