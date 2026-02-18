

## Services Analytics Tab -- Full Review

After a line-by-line audit of `ServicesContent.tsx` (975 lines), `ServiceBundlingIntelligence.tsx` (377 lines), and `useServiceEfficiency.ts` (284 lines), here are the remaining issues.

---

### Gap 1: `<strong>` Tags Render as Bold (Weight 700)

The HTML `<strong>` element renders at `font-weight: 700` by default -- the same weight as the banned `font-bold` class. There are 14+ instances across both component files:

- Line 327: `<strong>{data?.activeServiceCount || 0}</strong>`
- Line 357: `<strong>{formatCurrency(data?.avgRevPerHour || 0)}</strong>/hr`
- Lines 438-439: `<strong>{Math.round(clientStats.newPct)}%</strong>`, `<strong>{Math.round(clientStats.rebookRate)}%</strong>`
- Lines 613-615: New clients, Rebook rate, Avg tip `<strong>` wrappers
- Lines 657, 753, 921-922, 929: Additional `<strong>` usages
- `ServiceBundlingIntelligence.tsx` line 257: solo/grouped visit counts

**Fix:** Replace `<strong>` with `<span className="font-medium">` throughout. This keeps emphasis at weight 500 (the allowed maximum) instead of 700.

---

### Gap 2: Rebooking Card Missing `MetricInfoTooltip` in Standard Position

The Rebooking Rates card (line 704) has its `MetricInfoTooltip` placed *after* the `CardDescription` block (line 714), outside the standard `flex items-center gap-2` wrapper around the title. Every other card follows the pattern of tooltip immediately next to `CardTitle`. This inconsistency means the tooltip icon floats separately from the title text.

**Fix:** Move the `MetricInfoTooltip` into a `flex items-center gap-2` wrapper around the `CardTitle` on line 704, matching the pattern used by all other cards.

---

### Gap 3: Duplicate `key` Props on `TableRow` Inside `React.Fragment`

In three locations, a `React.Fragment key={...}` wraps a `<TableRow key={...}>` with the same key value, creating redundant key props:

- Line 416-417: Category Mix table (`React.Fragment key={cat.category}` + `TableRow key={cat.category}`)
- Line 590-591: Efficiency Matrix table (same pattern with `s.serviceName`)
- Line 222-224: Revenue Lift table in `ServiceBundlingIntelligence.tsx`

**Fix:** Remove the `key` prop from the inner `<TableRow>` since the `React.Fragment` already provides the key for React's reconciliation.

---

### Gap 4: KPI "Active Services" Drill-Down Uses `<strong>` for Count

Line 327 wraps the count in `<strong>` which renders at 700 weight. Additionally, this drill-down panel is purely text-based with no actionable data -- unlike the other three KPI drill-downs which show ranked lists. It could benefit from showing top 5 most-booked and bottom 5 least-booked services.

**Fix:** Replace `<strong>` with `<span className="font-medium">` and optionally enrich the drill-down with a mini top/bottom list.

---

### Gap 5: Inconsistent Card Wrapper -- Missing `tokens.card.wrapper`

The design token system mandates `tokens.card.wrapper` (which resolves to `rounded-2xl`) on all Card components. However, the cards in `ServicesContent.tsx` and `ServiceBundlingIntelligence.tsx` use bare `<Card>` without the wrapper token class. While this may be inherited from the base Card component, it should be verified for consistency.

---

### Gap 6: Rev/Hour Category Chart Missing Pinnable Wrapper Props

The `RevPerHourByCategoryChart` component (line 686-694) is wrapped in no visible `PinnableCard` in `ServicesContent`. Looking at the section, it passes no `dateRange` or `locationName`. If this chart handles its own pinnable wrapper internally, it may be fine -- but if not, it would lack pin functionality.

**Fix:** Verify the component handles pinning internally or add the wrapper.

---

### Gap 7: Heatmap Font Weight on Count Value

Line 357 of `ServiceBundlingIntelligence.tsx` uses `font-medium` on the heatmap count -- this is correct. However, the heatmap percentage text on line 358 uses no weight class but relies on the small font size (`text-[9px]`) for hierarchy. This is acceptable but could benefit from explicit `font-normal` for clarity.

---

### Summary

| # | Issue | Severity | Effort |
|---|---|---|---|
| 1 | `<strong>` tags rendering at weight 700 (14+ instances) | Medium -- design rule violation | Small (find-replace with `<span className="font-medium">`) |
| 2 | Rebooking card tooltip positioned incorrectly | Low -- inconsistency | Trivial (move tooltip into title wrapper) |
| 3 | Duplicate key props on TableRow inside Fragment | Low -- unnecessary React noise | Trivial (remove inner keys) |
| 4 | Active Services drill-down is text-only | Low -- missed opportunity | Small (add top/bottom services) |
| 5 | Missing `tokens.card.wrapper` on Cards | Low -- verify only | Trivial |
| 6 | Rev/Hour chart pinnable wrapper verification | Low -- verify only | Trivial |
| 7 | Heatmap percentage text weight clarity | Negligible | Trivial |

### Recommended Implementation Order

1. Gap 1 (`<strong>` tags) -- highest count, design rule violation
2. Gap 2 (Rebooking tooltip position) -- quick consistency fix
3. Gap 3 (Duplicate keys) -- cleanup
4. Gaps 4-7 -- minor polish items

### Overall Assessment

The previous round of fixes addressed all critical issues (stylist names, pagination, font-bold/semibold, abbreviations, missing tooltips, fragment keys, heatmap contrast). The remaining gaps are lower severity -- primarily the `<strong>` tag weight violation which is a subtle but systematic design rule breach across 14+ locations.

