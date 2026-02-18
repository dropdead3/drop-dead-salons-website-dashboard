

## Client Engagement Card Improvements

### Problem Summary

The card has three categories of issues visible in the screenshot:

1. **Staff names are unreadable hashes** -- every bar shows truncated Phorest IDs like `sc-q41_Z...` because the staff mapping table has no entries for these staff IDs. This is a data gap, not a code bug, but the card should handle it more gracefully.
2. **Layout imbalance** -- the Hero KPI sits at the very bottom-left, disconnected from the chart. The two-panel grid doesn't properly center the hero.
3. **Too many bars with no differentiation** -- 10 identical gray gradient bars with cryptic labels creates visual noise instead of insight.

### Proposed Changes

#### 1. Graceful staff name fallback with numbered labels

Since staff mapping data doesn't exist for these IDs, showing `sc-q41_Z...` is worse than showing nothing. Replace the truncated hash fallback with clean sequential labels: "Stylist 1", "Stylist 2", etc., sorted by the active metric. Add a subtle banner at the top of the chart: "Staff names unavailable -- connect staff profiles in Settings" with a link to the staff mapping page. When real names are available, they display normally.

**File:** `src/hooks/useClientEngagement.ts`
- Remove the `is_active = true` filter on the mapping query (to catch all mappings, not just active ones)
- Add a `hasNames` boolean to the return object so the card knows whether to show the unmapped banner

**File:** `src/components/dashboard/sales/ClientEngagementCard.tsx`
- In `getChartData`, if the name looks like a hash (no spaces, contains underscores or is longer than 12 chars with no vowel pattern), replace with "Stylist N"
- Show a small info banner when `data.hasNames === false`

#### 2. Fix Hero KPI vertical centering and visual weight

The hero panel needs proper vertical centering and slightly more visual presence so it reads as the primary anchor.

**File:** `src/components/dashboard/sales/ClientEngagementCard.tsx`
- Change the left panel from `flex flex-col items-center md:items-start justify-center` to include `min-h-[200px]` to ensure it stays vertically centered relative to the chart regardless of chart height
- Add a subtle `bg-muted/20 rounded-xl p-6` background container to the hero panel so it reads as a distinct visual block (card-within-card pattern per the capacity utilization standard)

#### 3. Limit visible bars and add "Show more" expansion

Showing 10 bars of unreadable names creates clutter. Cap the default view to 5 bars (the top performers) and add a "Show all N stylists" toggle that expands to reveal the rest.

**File:** `src/components/dashboard/sales/ClientEngagementCard.tsx`
- Default to showing top 5 bars
- Add a subtle text link below the chart: "Show all 10 stylists" / "Show less"
- Animate the expansion with framer-motion

#### 4. Add glass gradient stroke and active-bar visual polish

The bars currently all look identical (same gray gradient). Add the standard 1px glass stroke and a slightly warmer gradient so bars feel intentional, not like a gray blob.

**File:** `src/components/dashboard/sales/ClientEngagementCard.tsx`
- Adjust the SVG gradient to use the warm glass pattern (primary color at 0.5 to 0.2 opacity) matching the luxury glass chart language
- Ensure active (clicked) bars are visually distinct with higher opacity

### Technical Details

**Files modified:**
- `src/hooks/useClientEngagement.ts` -- Remove `is_active` filter, add `hasNames` flag
- `src/components/dashboard/sales/ClientEngagementCard.tsx` -- Hash-to-label fallback, hero centering, bar limit with expand toggle, info banner
- `src/components/dashboard/sales/StaffKPISummary.tsx` -- No changes needed, it doesn't show staff names

**No new files created. No database changes needed.**

The bar limit, hero centering, and name fallback are all isolated UI changes. The mapping query filter removal is safe -- it just fetches all mappings instead of only active ones, giving more chances to find a name match.

