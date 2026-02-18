

## New "Services" Subtab in Sales Analytics

### The Big Picture
A dedicated **Services** subtab (placed between Commission and Retail) that consolidates all service-level intelligence into one place. This becomes the go-to page for salon owners asking: *"How are my services performing, and which ones should I adjust, promote, or retire?"*

---

### What Salon Owners Actually Want to Know

**Revenue Questions**
- Which services generate the most revenue? Which are declining?
- What's my average ticket per service? Is it rising or falling?
- Which categories drive the business vs. which are dead weight?

**Demand Questions**
- Which services are booked most frequently?
- Are certain services seasonal (e.g., Vivids in summer)?
- Which services have growing vs. shrinking demand?

**Pricing Questions**
- How does actual collected revenue compare to listed menu price?
- Where is discounting eroding margin?
- Which services could support a price increase without demand drop?

**Staff Questions**
- Who performs which services? Who dominates a category?
- Are high-revenue services concentrated on one stylist (risk)?
- Which stylists upsell add-ons most effectively?

**Operational Questions**
- Revenue per hour by service (which services are the best use of chair time?)
- Duration efficiency: do services consistently run over their allocated time?
- Which services get paired together most often (bundle opportunities)?

---

### Redundancy Cleanup

| Currently Lives In | What | Action |
|---|---|---|
| Sales Overview | Service Popularity chart | **Move** to Services tab; replace with a compact "Top 5 Services" summary card in Overview that links to Services tab |
| Sales Overview | Service Mix legend (on Popularity card) | **Move** with the chart |
| Forecasting | Service Mix legend (By Category mode) | **Keep** -- contextually relevant to forecasting |
| ServiceMixCard (standalone) | Category revenue breakdown | **Absorb** into the Services tab as the "Category Mix" section |

This declutters the Overview subtab (which should focus on aggregate KPIs) and gives services their own dedicated space.

---

### Services Tab Layout

#### Section 1: Service KPI Tiles (Top Row)
Four metric tiles following the existing KPI tile pattern:

| Tile | Metric | Source |
|---|---|---|
| Total Service Revenue | Sum of service revenue for period | `phorest_appointments` |
| Active Services | Count of distinct services booked | `phorest_appointments` |
| Avg Service Ticket | Revenue / appointment count | Computed |
| Revenue per Chair Hour | Service revenue / total booked hours | `phorest_appointments` (duration) |

#### Section 2: Service Mix Donut + Category Table
- Full-size donut chart showing category revenue distribution (the one removed from Capacity Utilization, now with its proper home)
- Category table below with: Category name, Revenue, Count, % of Total, Avg Ticket, color dot
- Sortable by any column

#### Section 3: Service Popularity (Relocated)
- The existing `ServicePopularityChart` moved here with its full Revenue/Frequency tabs, animated bars, and Stylist Breakdown drill-downs
- No changes to the component itself, just its location

#### Section 4: Service Efficiency Matrix (New)
A table ranking services by **Revenue per Hour** -- the metric that matters most for chair-time optimization:

| Column | Source |
|---|---|
| Service Name | `phorest_appointments.service_name` |
| Category | `phorest_services.category` |
| Avg Duration (min) | `phorest_services.duration_minutes` |
| Avg Revenue | Computed from appointments |
| Rev/Hour | `(avg_revenue / avg_duration) * 60` |
| Bookings | Count |

Sorted by Rev/Hour descending. Color-coded: green (above salon avg), amber (near avg), red (below avg). This directly tells owners which services are the best and worst use of chair time.

#### Section 5: Price Realization (New)
Compares **menu price** (from `phorest_services.price` or the pricing resolution engine) vs. **actual collected average** (from appointments):

- Bar chart: menu price vs. actual avg for top 10 services
- "Realization Rate" = actual / menu as a percentage
- Flags services where realization < 85% (heavy discounting)
- Flags services where actual > menu (opportunity to raise menu price)

This is a **brilliant, rare insight** most salon software doesn't provide. It directly surfaces pricing levers.

#### Section 6: Service Demand Trend (New)
- Small multiples or sparklines showing booking count trend over the last 12 weeks for the top 8 services
- Simple "rising / stable / declining" indicators
- Helps owners spot seasonal shifts and fading services before they become problems

---

### Technical Implementation

**New File: `src/components/dashboard/analytics/ServicesContent.tsx`**
- Main content component for the Services subtab
- Receives `filters` and `filterContext` from `SalesTabContent`
- Composes the sections above

**New Hook: `src/hooks/useServiceEfficiency.ts`**
- Joins `phorest_appointments` (actual revenue, count) with `phorest_services` (duration, menu price)
- Returns per-service: avgRevenue, avgDuration, revPerHour, menuPrice, realizationRate

**New Hook: `src/hooks/useServiceDemandTrend.ts`**
- Queries `phorest_appointments` grouped by service + week
- Returns weekly booking counts for sparkline rendering

**Modified: `src/components/dashboard/analytics/SalesTabContent.tsx`**
- Add "Services" subtab trigger between Commission and Retail
- Add `TabsContent value="services"` rendering `ServicesContent`
- Move `ServicePopularityChart` from Overview to Services tab
- Replace with a compact "Top Services" summary in Overview that links to `?tab=sales&subtab=services`

**Modified: `src/config/dashboardNav.ts`**
- Add `services` subtab entry for the Sales tab nav registry

**Reused Components**
- `ServiceMixLegend` -- used in the Category Mix section
- `ServicePopularityChart` -- moved as-is
- `PinnableCard` wrapper for each section
- Existing filter system (date range, location)

---

### What Makes This Tab Brilliant

1. **Revenue per Chair Hour** -- Most salon software ignores this. A $200 balayage that takes 3 hours ($67/hr) is less profitable than a $75 haircut in 45 min ($100/hr). This reframes how owners think about their menu.

2. **Price Realization** -- Exposes the gap between what's on the menu and what's actually collected. No other salon platform surfaces this. It's the single most actionable pricing lever.

3. **Demand Trends** -- Weekly sparklines let owners see which services are gaining or losing traction *before* it shows up in revenue. Early signal for menu adjustments, training investments, or marketing pushes.

4. **Single Source of Truth** -- No more hunting across Overview, Forecasting, and Capacity for service data. One tab, complete picture.

---

### Phase Consideration
This aligns with **Phase 1** (structured visibility) since it's organizing existing data into actionable views. The Price Realization and Efficiency Matrix plant seeds for **Phase 3** (simulation engine) -- eventually owners could ask "what if I raise Balayage by $25?" and see projected impact.

