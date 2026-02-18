

## Client Experience Analytics Card

### What We're Building

A new "Client Experience" analytics card on the Staff Performance subtab that measures four levers of client experience quality, both salon-wide and per-stylist:

1. **Avg Tip** -- average tip amount per completed appointment
2. **Tip Rate** -- percentage of appointments that received any tip (frequency signal)
3. **Feedback Rate** -- percentage of appointments where a client feedback response was collected (sourced from `client_feedback_responses`), with optional new vs. returning split
4. **Rebook Rate** -- percentage of appointments where client rebooked at checkout (reused from existing data)

### Architecture

**New hook:** `src/hooks/useClientExperience.ts`
- Fetches `phorest_appointments` for the period (tip_amount, rebooked_at_checkout, is_new_client, phorest_staff_id, total_price, status) using the existing paginated fetch pattern
- Fetches `client_feedback_responses` for the period, joined by staff_user_id, to compute feedback collection counts
- Fetches staff name mappings (same pattern as useClientEngagement)
- Computes per-stylist and salon-wide aggregates for all four metrics
- Includes prior-period comparison for the KPI tiles (percent change badges)
- Returns a `hasNames` flag for the Stylist N fallback

**New component:** `src/components/dashboard/sales/ClientExperienceCard.tsx`
- **Header:** Heart icon in muted icon box, "CLIENT EXPERIENCE" title (font-display, tokens.card.title), filter badge
- **KPI Row:** 4 tiles using `tokens.kpi.*` -- Avg Tip, Tip Rate, Feedback Rate, Rebook Rate, each with a ChangeBadge for period-over-period trend
- **Staff Drill-Down:** Horizontal bar chart (same glass gradient pattern as ClientEngagementCard) showing the active metric per stylist, toggle between the four metrics via pill buttons
- **Bar limit:** Top 5 shown by default, expandable "Show all N stylists"
- **Info banner** when staff names are unmapped (same pattern as ClientEngagementCard)

**Integration:** `src/components/dashboard/analytics/SalesTabContent.tsx`
- Place the card below the Client Engagement card in the "staff" subtab
- Wrap in PinnableCard with key `client_experience_staff`
- Register in CARD_TO_TAB_MAP for pinning support

### Data Sources

| Metric | Source Table | Key Fields |
|--------|-------------|------------|
| Avg Tip | phorest_appointments | tip_amount, total_price |
| Tip Rate | phorest_appointments | tip_amount (non-null, > 0) |
| Feedback Rate | client_feedback_responses | staff_user_id, responded_at, appointment dates |
| Rebook Rate | phorest_appointments | rebooked_at_checkout |

No database schema changes needed. All tables and columns already exist.

### Technical Details

**Files created:**
- `src/hooks/useClientExperience.ts` -- composite hook with paginated fetching, prior-period comparison, staff name resolution
- `src/components/dashboard/sales/ClientExperienceCard.tsx` -- card component with KPI row + drill-down chart

**Files modified:**
- `src/components/dashboard/analytics/SalesTabContent.tsx` -- import and place the new card
- `src/components/dashboard/PinnedAnalyticsCard.tsx` -- add to CARD_TO_TAB_MAP if it exists

**Design rules followed:**
- `tokens.kpi.label` / `tokens.kpi.value` for all KPI tiles (Termina font)
- `tokens.card.wrapper` / `tokens.card.title` for the card shell
- Glass gradient bar pattern from ClientEngagementCard
- No font-bold/semibold; max font-weight 500
- MetricInfoTooltip on the header explaining the composite metric
- AnalyticsFilterBadge for date/location context
- Skeleton loading states matching tile layout

**Feedback query approach:**
- Query `client_feedback_responses` filtered by `responded_at` within the date range, grouped by `staff_user_id`
- Divide by total appointments per stylist to get feedback collection rate
- For the new-vs-returning split: cross-reference with the appointments query's `is_new_client` flag by matching on `staff_user_id` (aggregate level, not row-level join, since feedback doesn't have is_new_client directly)
