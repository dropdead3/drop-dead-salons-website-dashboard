

## Review: Gaps and Enhancements for Recent Services Analytics Build

After reviewing all three modified files (`ServiceBundlingIntelligence.tsx`, `ServicesContent.tsx`, `useServiceEfficiency.ts`), here are the issues and improvements grouped by priority.

---

### Gap 1: Stylist Names Show Raw IDs Instead of Real Names

**Problem:** In the `useServiceEfficiency` hook (line 183), `staffName` is set to the raw `phorest_staff_id` string. Every drill-down that shows "Stylist Breakdown" — Efficiency Matrix, Price Realization by Stylist, Rebooking by Stylist — displays cryptic IDs instead of human names.

**Fix:** Fetch `phorest_staff_mapping` joined to `employee_profiles` (the same pattern used in `useNewBookings.ts` and `useStylistExperienceScore.ts`) and resolve IDs to display names before returning `stylistBreakdown`.

**Files:** `src/hooks/useServiceEfficiency.ts`

---

### Gap 2: Prohibited Font Weights (Design System Violation)

The design rules cap font weight at `font-medium` (500) in analytics components. Multiple violations exist:

| File | Lines | Current | Fix |
|---|---|---|---|
| `ServiceBundlingIntelligence.tsx` | 137, 143 | `font-semibold` | `font-medium` |
| `ServiceBundlingIntelligence.tsx` | 356 | `font-bold` | `font-medium` |
| `ServicesContent.tsx` | 105 | `font-bold` (KPI value) | `font-medium` |
| `ServicesContent.tsx` | 129 | `font-semibold` (RebookBar) | `font-medium` |
| `ServicesContent.tsx` | 593 | `font-semibold` (Rev/Hr cell) | `font-medium` |
| `ServicesContent.tsx` | 811, 826 | `font-semibold` (realization rates) | `font-medium` |

**Files:** `ServiceBundlingIntelligence.tsx`, `ServicesContent.tsx`

---

### Gap 3: Abbreviation "appts" Violates Terminology Rule

Line 727 of `ServicesContent.tsx` uses `"appts"` in the Rebooking Rates rows. The project rule requires full words ("appointments") for professional clarity.

Also appears on line 737 in the stylist rebook drill-down.

**Fix:** Replace `appts` with `appointments` in both places.

**File:** `ServicesContent.tsx`

---

### Gap 4: Missing MetricInfoTooltips on Several Cards

The analytics tooltip rule requires every card to have a `MetricInfoTooltip` next to its title. These cards are missing one:

- **Service Category Mix** card (line 371)
- **Client Type Analysis** card (line 490)
- **Service Efficiency Matrix** card (line 549)
- **Price Realization** card (line 767)
- **Service Demand Trends** card (line 856)

The Rebooking Rates and Bundling Intelligence cards already have tooltips.

**File:** `ServicesContent.tsx`

---

### Gap 5: React Key Warnings on Fragments

Multiple `.map()` calls wrap rows in bare `<>...</>` fragments without a `key` prop. While the inner `<TableRow>` has a key, the fragment wrapper does not, which can cause React console warnings:

- Category Mix table (line 413)
- Efficiency Matrix table (line 581)
- Revenue Lift table in Bundling Intelligence (line 222)

**Fix:** Replace `<>` with `<Fragment key={...}>` or `<React.Fragment key={...}>`.

**Files:** `ServicesContent.tsx`, `ServiceBundlingIntelligence.tsx`

---

### Gap 6: Supabase 1000-Row Query Limit

The `useServiceEfficiency` hook fetches from `phorest_appointments` without pagination. For busy salons over longer date ranges, this can silently truncate data at 1000 rows, producing inaccurate metrics with no indication to the user.

The `useServicePairings` hook has the same issue.

**Fix:** Add `.limit(10000)` or implement pagination (fetch in batches until no more rows), and add a data-quality note if results hit the limit.

**Files:** `useServiceEfficiency.ts`, `useServicePairings.ts`

---

### Enhancement: Heatmap Readability in Dark Mode

The heatmap cell text in `ServiceBundlingIntelligence.tsx` (line 356) uses default foreground color on a dynamically-colored background (`hsl(var(--primary) / opacity)`). In some themes, high-intensity cells can have poor contrast. Adding explicit text color that adapts to intensity would improve readability.

**File:** `ServiceBundlingIntelligence.tsx`

---

### Summary

| # | Issue | Severity | Effort |
|---|---|---|---|
| 1 | Stylist names show raw IDs | High -- user-facing data is unreadable | Moderate (add staff lookup query) |
| 2 | Prohibited font weights | Medium -- design rule violation | Small (find-replace) |
| 3 | "appts" abbreviation | Low -- terminology rule | Trivial |
| 4 | Missing MetricInfoTooltips | Medium -- analytics rule violation | Small (5 additions) |
| 5 | Fragment key warnings | Low -- console noise | Trivial |
| 6 | 1000-row query limit | High -- silent data truncation | Moderate (pagination logic) |
| 7 | Heatmap dark mode contrast | Low -- cosmetic | Small |

### Recommended Implementation Order

1. Stylist name resolution (most impactful user-facing fix)
2. Query limit fix (data integrity)
3. Missing tooltips (rule compliance)
4. Font weight fixes (design compliance)
5. Abbreviation + fragment keys + heatmap contrast (quick cleanup)

