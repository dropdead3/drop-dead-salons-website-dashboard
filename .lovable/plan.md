

## Five Drill-Down Enhancements for Services Analytics

### Enhancement 1: Bundling Intelligence Drill-Downs

Make the three bundling cards interactive:

**Standalone vs. Grouped card** -- clicking a category bar expands a panel showing:
- Top 5 services within that category by standalone rate
- Top 3 pairings this category appears in (from `categoryPairings` data)
- A one-liner: "Haircut is booked alone 78% of the time -- consider bundling with Extras or Styling"

**Revenue Lift table** -- clicking a row expands to show:
- The specific service-level pairings driving the lift (from `pairings` data, filtered to services in that category)
- Sample size context: "Based on X solo visits and Y grouped visits"

**Technical:** Add `expandedStandalone` and `expandedLift` state variables to `ServiceBundlingIntelligence.tsx`. All data is already available from `useServicePairings` -- the `pairings` array has service-level pairs, `categoryPairings` has category-level pairs. Filter and display within the drill-down panels.

---

### Enhancement 2: Price Realization by Stylist

Click a service bar in the Price Realization chart to expand a stylist-level breakdown showing who is discounting most.

**Drill-down shows:**
- Each stylist's average collected price vs. the menu price
- Realization rate per stylist (color-coded: red < 85%, green > 105%)
- Booking count per stylist for that service

**Technical:**
- Add `expandedRealization` state to `ServicesContent.tsx`
- The `useServiceEfficiency` hook already tracks `stylistBreakdown` per service with `totalRevenue` and `bookings` -- derive per-stylist avg price from `totalRevenue / bookings`
- Render a `DrillDown` panel below the chart grid items for the selected service
- Match the existing drill-down pattern (framer-motion expand, muted background)

---

### Enhancement 3: Efficiency Matrix -- Time Patterns

Add day-of-week and peak hour data to the Efficiency Matrix drill-down rows.

**Currently the drill-down shows:** New client %, rebook rate, tip %, stylist breakdown
**Add:** A compact day-of-week mini-bar showing booking distribution (Mon-Sun) and a "Peak hours" line

**Technical:**
- Extend `useServiceEfficiency` to also fetch `appointment_date` (already fetched) -- extract day-of-week from it
- Add a `dayOfWeekMap` per service in the aggregation: `Map<number, number>` (0=Sun..6=Sat)
- Also fetch `start_time` (already fetched) and bucket into morning/afternoon/evening slots
- Add to `ServiceEfficiencyRow`: `dayDistribution: number[]` (7 values) and `peakHour: string`
- In the drill-down panel, render 7 tiny bars (Mon-Sun) showing relative booking density
- Show "Peak: Tue & Thu afternoons" text summary

---

### Enhancement 4: Rev/Hr in Category Mix Drill-Down

Enhance the existing Category Mix drill-down (which shows services within a category) to include per-service Rev/Hr.

**Currently shows:** Service name, bookings, avg revenue, % of category revenue
**Add:** Rev/Hr column with color coding (green if above salon average, red if below)

**Technical:**
- The `cat.services` array already contains `ServiceEfficiencyRow` objects which have `revPerHour`
- Simply add a `revPerHour` display in the drill-down row items, color-coded against `data.avgRevPerHour`
- Minimal change -- about 5 lines added to the drill-down template at line ~424

---

### Enhancement 5: Lost Rebooking Revenue

Add a "lost revenue" estimate to the Service Rebooking Rates card showing the dollar impact if rebooking reached a target (e.g., 70%).

**Shows:** For each service with a rebook rate below 70%, calculate:
`lostRevenue = (targetRate - actualRate) * totalCount * avgTicket`

**Drill-down addition:** Below the per-stylist rebook breakdown, add a line:
"If rebooking reached 70%, this service would generate an estimated +$X,XXX in additional revenue"

Also add a **summary stat at the top** of the Rebooking Rates card:
"Total estimated lost rebooking revenue: $XX,XXX" across all under-target services

**Technical:**
- Need the average ticket per service -- cross-reference `useServiceEfficiency` data (already loaded in `ServicesContent`)
- Build a `rebookLostRevenue` map in a `useMemo`: for each service in `rebookData` where `rebookRate < 70`, compute `(0.70 - rebookRate/100) * totalCount * avgTicketForService`
- Display the per-service estimate in the existing `DrillDown` panel
- Display the aggregate total as a `Badge` or subtitle in the card header

---

### Files Modified

| File | Changes |
|---|---|
| `src/components/dashboard/sales/ServiceBundlingIntelligence.tsx` | Add drill-down state + expandable panels for standalone bars and revenue lift rows |
| `src/components/dashboard/analytics/ServicesContent.tsx` | Add price realization drill-down, rev/hr in category drill-down, lost rebook revenue estimate |
| `src/hooks/useServiceEfficiency.ts` | Add `dayDistribution` and `peakHour` fields to `ServiceEfficiencyRow` |

### Implementation Order

1. Enhancement 4 (Rev/Hr in category drill-down) -- smallest, ~5 lines
2. Enhancement 5 (Lost rebooking revenue) -- moderate, uses existing data
3. Enhancement 1 (Bundling drill-downs) -- moderate, all data available
4. Enhancement 2 (Price realization by stylist) -- moderate, needs drill-down wiring
5. Enhancement 3 (Time patterns) -- largest, requires hook extension

