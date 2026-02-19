

## New Client Service Conversion Analytics

### What This Builds

A new analytics card (or small section) that answers three questions salon operators care deeply about:

1. **What services do new clients book first?** -- Ranked list of entry-point services/categories
2. **Do they convert to high-ticket services?** -- Conversion rate from entry services (Haircut, Styling, Consultation) to high-ticket categories (Blonding, Extensions, Color/Vivids)
3. **How long does conversion take?** -- Average days between first visit and first high-ticket service

### Data Logic

The approach uses the existing `phorest_appointments` table, grouping by `phorest_client_id`:

```text
For each client:
  1. Find their first appointment (earliest appointment_date)
  2. Record the entry service category
  3. Scan subsequent appointments for high-ticket categories
  4. If found: mark as converted, calculate days between first visit and first high-ticket visit

High-ticket categories (configurable):
  - Blonding (balayage, highlights, etc.)
  - Extensions
  - Color/Vivids (fashion color, vivids specifically)
```

### What the Card Shows

**Entry Services Breakdown** (top section)
- Ranked list of service categories new clients book first
- Count and percentage for each

**Conversion Funnel** (middle section)
- Overall conversion rate: "X% of new clients convert to high-ticket services"
- Per entry-category conversion: e.g., "Haircut -> High Ticket: 34%"

**Time to Convert** (bottom section)
- Average days from first visit to first high-ticket booking
- Broken out by entry category if useful

### Technical Implementation

**1. New hook: `src/hooks/useNewClientConversion.ts`**
- Queries all appointments for clients who have `is_new_client = true` on any visit
- Groups by `phorest_client_id`, sorts by date to find first visit and first high-ticket visit
- Uses existing `getServiceCategory()` from `serviceCategorization.ts` to classify services
- Implements paginated fetching (matching project standards for data integrity)
- Defines high-ticket categories as a configurable constant: `['Blonding', 'Extensions']` (with Vivids captured under Color/Blonding patterns)
- Returns: entry service breakdown, conversion rate, average conversion time in days

**2. New component: `src/components/dashboard/analytics/NewClientConversionCard.tsx`**
- Follows the luxury analytics card pattern (icon box, font-display title, MetricInfoTooltip)
- Three sections: Entry Services list, Conversion Rate KPI, Avg Time to Convert KPI
- Respects dashboard date/location filters for the "new client first visit" window
- Uses existing chart colors from `CATEGORY_COLORS`

**3. Integration**
- Place the card in the Services analytics subtab or the Clients section of the Analytics Hub
- Wire to existing filter context (date range, location)

**4. Important data note**
- Currently all 458 appointments have `is_new_client = false`, meaning this field may not be populated from the Phorest sync yet. The card will gracefully show an empty state until data flows in. Alternatively, the hook can fall back to identifying "new clients" by finding each client's earliest appointment date (first visit = new client), which works regardless of the flag.

### Files

| File | Action |
|------|--------|
| `src/hooks/useNewClientConversion.ts` | Create -- query + aggregation logic |
| `src/components/dashboard/analytics/NewClientConversionCard.tsx` | Create -- UI card |
| Analytics hub page (Services or Clients subtab) | Modify -- mount the new card |

