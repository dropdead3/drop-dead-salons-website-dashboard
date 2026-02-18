

## New "Category Popularity" Card for Services Analytics

### Gap Identified
The Services tab has a **Service Popularity** card that ranks individual services with animated horizontal bars, Revenue/Frequency tabs, and stylist drill-downs. But there is no equivalent visual for **categories** (Blonding, Color, Haircut, Extensions, etc.). The existing "Service Category Mix" section is a donut + table — useful but visually flat and lacking the interactive depth of the Popularity card.

A **Category Popularity** card would mirror the Service Popularity pattern but at the category level, giving owners an instant visual ranking of which service lines dominate their business.

---

### What It Shows

**Revenue Tab (default)**
- Horizontal bar chart ranking categories by total revenue
- Animated bars using category-specific colors from the settings-driven color map
- Luxury glass gradient treatment matching Service Popularity
- Badge labels on bars showing revenue amount
- Summary badges: total categories count + total revenue

**Frequency Tab**
- Same bars ranked by appointment count instead of revenue

**Category Drill-Downs**
Clicking any category bar/row expands to show:
- **Top 5 services** within that category (name, bookings, revenue, avg ticket)
- **Stylist breakdown** for the category: who performs the most, revenue share per stylist (uses existing `useRevenueByCategoryDrilldown` hook which already provides this data)
- **Client mix**: New vs. Returning percentage for the category
- **Rebook rate**: Category-level checkout rebooking rate
- **Concentration risk flag**: If one stylist accounts for more than 70% of category revenue

---

### Technical Implementation

**New Component: `src/components/dashboard/sales/CategoryPopularityChart.tsx`**
- Mirrors the architecture of `ServicePopularityChart.tsx`
- Uses `useRevenueByCategoryDrilldown` hook (already exists with stylist + client data per category)
- Renders horizontal `BarChart` with `AnimatedBar` shape, glass gradients, and `LabelList` badges
- Revenue/Frequency tab switcher
- Expandable rows per category with stylist breakdown, client mix, rebook stats
- Filter badge integration
- Category colors from `useServiceCategoryColorsMap`

**Modified: `src/components/dashboard/analytics/ServicesContent.tsx`**
- Add the new `CategoryPopularityChart` as a new section between the existing Category Mix (Section 2) and Client Type Analysis (Section 3)
- Wrapped in `PinnableCard` for dashboard pinning support

**No new hooks needed** — `useRevenueByCategoryDrilldown` already provides:
- Category-level revenue + count
- Per-stylist revenue, count, share percentage
- New vs. returning client counts per stylist per category
- All the data needed for drill-downs

**No database changes required.**

---

### Layout Position

```text
KPI Tiles
Service Category Mix (donut + table)      <-- existing
Category Popularity (animated bars)       <-- NEW
Client Type Analysis                      <-- existing
Service Popularity (individual services)  <-- existing
... remaining sections
```

---

### Drill-Down Detail

When a category row is expanded:

| Metric | Source |
|---|---|
| Top services in category | From `useRevenueByCategoryDrilldown` + service name aggregation |
| Stylist revenue breakdown | `CategoryStylistData[]` from existing hook |
| Stylist revenue share % | Already computed in hook |
| New client count | `CategoryStylistData.newClients` |
| Returning client count | `CategoryStylistData.returningClients` |
| Concentration risk | Computed: top stylist share > 70% |

---

### Why This Matters

1. **Visual hierarchy**: The donut/table shows distribution, but bars show ranking at a glance — owners can instantly see which category leads and by how much.

2. **Category-level stylist risk**: If one stylist does 85% of all Extensions revenue and they leave, that category collapses. This drill-down makes that risk visible.

3. **Consistency**: Matches the Service Popularity card's visual language, creating a natural pair — categories above, individual services below.

4. **Actionable**: Category-level new client percentages reveal which service lines are growth engines vs. retention engines, informing marketing spend allocation.
