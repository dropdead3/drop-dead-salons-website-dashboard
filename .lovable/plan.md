

## Services Analytics Tab: Enhancements and Drill-Downs

### Current State
The Services tab has 6 sections: KPI Tiles, Category Mix donut/table, Service Popularity (relocated), Efficiency Matrix, Price Realization, and Demand Trends. All are flat -- no drill-downs, no interactivity beyond sorting and tab switching.

### What's Missing (Gaps)

1. **No drill-downs anywhere** -- KPI tiles, category rows, efficiency rows, and demand trend cards are all static. Salon owners can't click into anything to understand *why* a number looks the way it does.

2. **No client-type segmentation** -- The data has `is_new_client` but services aren't analyzed by new vs. returning clients. This matters enormously: services that attract new clients vs. services that retain existing ones require different strategies.

3. **No rebooking analysis by service** -- `rebooked_at_checkout` exists on every appointment. Which services have the highest rebook rates? Low rebook = the client wasn't impressed enough to come back. This is a retention lever.

4. **No stylist concentration risk** -- If 80% of Balayage revenue comes from one stylist, that's a business risk. The Popularity chart has stylist breakdown but the Efficiency Matrix doesn't.

5. **No add-on/upsell visibility** -- Which services get paired together? Which stylists upsell most? This is a revenue growth lever that's completely invisible.

6. **No tip analysis by service** -- `tip_amount` is tracked. Services with higher tip rates indicate higher client satisfaction. This is an indirect quality signal.

---

### Plan: 7 Enhancements

#### Enhancement 1: KPI Tile Drill-Downs
Each of the 4 KPI tiles becomes clickable with an expanding panel below (framer-motion, matching existing drill-down patterns):

- **Service Revenue tile**: Expands to show revenue by category as a mini stacked bar, with period-over-period comparison (current period vs. prior equal-length period)
- **Active Services tile**: Expands to show services with zero bookings this period (dormant services that are still on the menu -- cleanup candidates)
- **Avg Service Ticket tile**: Expands to show top 5 and bottom 5 services by avg ticket, highlighting outliers
- **Rev/Chair Hour tile**: Expands to show the same top 5 / bottom 5 by hourly yield, with the salon average as a reference line

#### Enhancement 2: Category Mix Drill-Down
Clicking a category row in the table expands to show:
- The individual services within that category, sorted by revenue
- Each service shows: bookings, avg ticket, % of category revenue
- New vs. returning client split for the category (pie or simple bar)
- Category rebook rate (% of appointments in this category where `rebooked_at_checkout = true`)

#### Enhancement 3: Efficiency Matrix Row Drill-Down
Clicking any row in the Service Efficiency Matrix expands to show:
- **Stylist breakdown**: Who performs this service, their individual rev/hr, and booking count (identifies concentration risk)
- **Client type split**: New vs. returning client percentage for this service
- **Rebook rate**: % of clients who rebooked at checkout after this service
- **Tip indicator**: Average tip % for this service (quality signal)

#### Enhancement 4: New vs. Returning Client Service Analysis (New Section)
A new card section between Category Mix and Service Popularity:
- Horizontal stacked bar chart showing each service's booking split: new clients (one color) vs. returning clients (another color)
- Top 10 services sorted by new client acquisition count
- Answers: "Which services are my best new client magnets?"
- Inverse view toggle: "Which services retain existing clients best?" (sorted by returning %)

#### Enhancement 5: Service Rebooking Rates (New Section)
A new card after the Efficiency Matrix:
- Table showing each service (min 5 bookings), its rebook rate, and a visual progress bar
- Color-coded: green (>70%), amber (40-70%), red (<40%)
- Drill-down per service: which stylists have the highest/lowest rebook rates for that service
- This is a **quality and retention lever** -- low rebook services need attention (training, pricing, or menu retirement)

#### Enhancement 6: Demand Trend Drill-Down
Clicking a demand trend sparkline card expands to show:
- The full 12-week data as a larger line chart with actual values
- Week-over-week change percentage
- The service's share of total bookings over time (is it growing as a % of the business?)

#### Enhancement 7: Service Pairing Analysis (New Section -- Future-Ready)
A compact card at the bottom showing the most common service combinations booked by the same client on the same day:
- Query: group appointments by `phorest_client_id + appointment_date`, find services that co-occur
- Display top 5 pairs with co-occurrence count
- This reveals bundle opportunities (e.g., "Balayage + Olaplex Treatment" appear together 73% of the time -- create a package)

---

### Technical Implementation

**Modified: `src/components/dashboard/analytics/ServicesContent.tsx`**
- Add expandable drill-down states for KPI tiles, category rows, efficiency rows, and demand trend cards
- Add new sections: Client Type Analysis, Service Rebooking, Service Pairing
- All drill-downs use framer-motion AnimatePresence pattern consistent with existing code

**New Hook: `src/hooks/useServiceClientAnalysis.ts`**
- Queries `phorest_appointments` with `is_new_client`, `rebooked_at_checkout`, `tip_amount` grouped by `service_name`
- Returns per-service: newClientCount, returningCount, rebookRate, avgTipPct

**New Hook: `src/hooks/useServicePairings.ts`**
- Queries appointments grouped by `phorest_client_id + appointment_date`
- Identifies co-occurring services and returns top pairs with counts

**Modified: `src/hooks/useServiceEfficiency.ts`**
- Add `is_new_client`, `rebooked_at_checkout`, `tip_amount`, `phorest_staff_id` to the appointment query
- Enrich `ServiceEfficiencyRow` with: `newClientPct`, `rebookRate`, `avgTipPct`

**No database changes required** -- all data already exists in `phorest_appointments`.

---

### What Makes These Enhancements Brilliant

1. **Rebooking by service** is almost never surfaced in salon software. It's the most direct signal of service quality and client satisfaction. A service with great revenue but poor rebook rate is a ticking time bomb.

2. **New client magnet analysis** tells owners which services to promote in marketing. If "Balayage Consultation" brings in 4x more new clients than anything else, that's your lead-gen service.

3. **Stylist concentration risk** in the efficiency drill-down protects against the scenario where one stylist leaves and takes 80% of a service category's revenue with them.

4. **Service pairing** plants the seed for automated bundle creation in Phase 3, and immediately reveals upsell training opportunities.

5. **Every section becomes interactive** -- consistent with the drill-down-first philosophy used in Sales Overview and Location Comparison cards. No dead-end data.

