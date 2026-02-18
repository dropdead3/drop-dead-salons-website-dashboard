

## Service Bundling Intelligence

### Overview

Transform the existing Service Pairings card into a comprehensive **Service Bundling Intelligence** section with three connected analytics cards. All data comes from the same `phorest_appointments` query already used by `useServicePairings` — no new database queries needed.

---

### Card 1: Standalone vs. Grouped Ratio (by Category)

**What it shows:** For each service category, the percentage of bookings where it was the only service vs. part of a multi-service visit.

- Horizontal stacked bar per category (two segments: standalone %, grouped %)
- Sorted by standalone % descending (highest standalone = biggest upsell opportunity)
- Badge on each bar showing total booking count
- Insight line at the bottom: "Services with high standalone rates represent upsell opportunities"

**Data logic:**
- Reuse the visits map from `useServicePairings` (client + date grouping)
- For each appointment, check if the visit had 1 service or multiple
- Aggregate by category using `getServiceCategory()`
- Compute: `standaloneRate = singleServiceBookings / totalBookings * 100`

---

### Card 2: Revenue Lift from Grouping

**What it shows:** For each category, the average visit ticket when the category is booked alone vs. when it's part of a grouped visit.

- Table with columns: Category, Avg Ticket (Solo), Avg Ticket (Grouped), Revenue Lift ($), Revenue Lift (%)
- Sorted by revenue lift descending
- Highlight rows where lift exceeds 50% (strong bundling signal)

**Data logic:**
- Same visit grouping as above
- For solo visits: average of `total_price` where visit has 1 service
- For grouped visits: sum all `total_price` in the visit, average across grouped visits containing that category
- Lift = grouped avg - solo avg

**Requires:** Adding `total_price` to the query in `useServicePairings` (currently only fetches `service_name`)

---

### Card 3: Category Pairing Heatmap

**What it shows:** A matrix showing how often service categories are booked together, replacing the noisy raw-service-name pairs.

- Grid/matrix layout with categories on both axes
- Cell values show pairing count and % of multi-service visits
- Color intensity based on frequency (darker = more common)
- Diagonal cells show total bookings for that category (for context)

**Data logic:**
- Same visit grouping
- Map each service to its category
- Count co-occurrences at the category level
- Compute percentage relative to total multi-service visits

---

### Technical Implementation

**Modified hook: `src/hooks/useServicePairings.ts`**

Extend the query to also fetch `total_price` alongside `service_name`. Expand the returned data to include:
- `pairings` (existing, unchanged)
- `standalonRates`: array of `{ category, totalBookings, standaloneCount, standaloneRate, groupedCount, groupedRate }`
- `revenueLift`: array of `{ category, avgTicketSolo, avgTicketGrouped, liftDollars, liftPct }`
- `categoryPairings`: array of `{ categoryA, categoryB, count, pctOfMultiVisits }`

All computed in `useMemo` from the same raw appointment data.

**New component: `src/components/dashboard/sales/ServiceBundlingIntelligence.tsx`**

A single compound component that renders all three cards (standalone ratio, revenue lift table, category heatmap). Accepts `dateFrom`, `dateTo`, `locationId`, `filterContext` props.

**Modified: `src/components/dashboard/analytics/ServicesContent.tsx`**

- Replace the current simple `service_pairings` section with the new `ServiceBundlingIntelligence` component
- Keep the same section ID (`service_pairings`) and reorder position so existing user preferences are preserved
- Update section label to "Service Bundling Intelligence"

---

### Why This Matters

- **Standalone ratio** reveals which services are undertapped for upselling — if Haircut is 85% standalone, there is a clear opportunity to attach Extras or Styling
- **Revenue lift** quantifies the dollar impact of bundling, giving owners a concrete reason to create packages
- **Category heatmap** shows natural affinities at a glance — much more actionable than individual service name pairs which are noisy and hard to act on
- Together, these three views answer: "What should we bundle? What's the revenue upside? And where are we leaving money on the table?"
