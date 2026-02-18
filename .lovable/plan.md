

## Revenue Per Hour by Service Category

### What It Shows

A ranked horizontal bar chart showing **average revenue per hour** for each service category (Blonding, Color, Haircut, Extensions, Styling, Extras, etc.). This answers the question: "Which service lines generate the most revenue per hour of chair time?"

**Default view:**
- Horizontal bars ranked by rev/hour, highest first
- Category-specific colors from the settings-driven color map
- Overall salon average rev/hour shown as a vertical reference line on every bar
- Badge on each bar showing the dollar amount per hour

**Drill-down per category (click to expand):**
- Top 5 individual services within that category ranked by rev/hour
- Per-service: name, avg duration, avg ticket, rev/hour, booking count
- Stylist breakdown: which stylists perform this category, their individual rev/hour, and share percentage
- Concentration risk flag if one stylist handles more than 70% of category hours
- Efficiency delta: how far above/below the salon average each category sits (shown as a +/- percentage badge)

### Data Source

The existing `useServiceEfficiency` hook already fetches all appointments with `service_name`, `total_price`, `start_time`, `end_time`, `phorest_staff_id`, and computes per-service rev/hour using actual appointment duration (with catalog fallback). No new database queries needed -- we aggregate this existing per-service data up to the category level using `getServiceCategory()` from the categorization utility.

### Technical Implementation

**New component: `src/components/dashboard/sales/RevPerHourByCategoryChart.tsx`**
- Accepts `dateFrom`, `dateTo`, `locationId`, `filterContext` props
- Calls `useServiceEfficiency(dateFrom, dateTo, locationId)` to get per-service efficiency data
- Groups `ServiceEfficiencyRow[]` by `category` field, computing:
  - Category total revenue and total booked hours (sum of all services in category)
  - Category rev/hour = total revenue / total hours
  - Overall salon rev/hour as the reference line
- Renders horizontal bar chart with animated bars (framer-motion), category colors, and reference line
- Expandable rows per category showing top services and stylist breakdown
- Filter badge integration via `AnalyticsFilterBadge`

**Modified: `src/components/dashboard/analytics/ServicesContent.tsx`**
- Import the new component
- Add it to the `SECTION_DEFINITIONS` array and `sections` map for the reorder system
- Position it after the Service Efficiency Matrix section by default (since they share the efficiency theme)

**No new hooks, no new database queries, no schema changes.** All data is already available from `useServiceEfficiency`.

### Why This Matters

1. Revenue per hour is the core chair-time efficiency metric -- showing it at the category level reveals which service lines are the best use of salon capacity
2. A salon doing heavy Extensions work at high ticket prices may still have lower rev/hour than Color if Extensions take 3x longer
3. Category-level concentration risk flags help owners identify where losing a single stylist would collapse an efficient service line
4. The efficiency delta badge makes it instantly clear which categories are dragging down (or lifting up) the salon average

