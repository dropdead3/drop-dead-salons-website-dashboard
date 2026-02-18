

## Service Costs and Sales Profits

This feature adds cost tracking to services and a new analytics card that calculates profit margins, matching the reference screenshot.

### Part 1: Database — Add Cost Column

Add a `cost` column to the `services` table:
- `cost NUMERIC(10,2) DEFAULT NULL` — the cost to deliver the service (product, time, supplies)
- Nullable so existing services aren't affected until costs are entered

### Part 2: Service Editor — Cost Input

**File: `src/components/dashboard/settings/ServiceEditorDialog.tsx`**

Add a "Cost ($)" input field next to the existing "Price ($)" field in the Details tab:
- New state: `const [cost, setCost] = useState('')`
- Populate from `initialData.cost` on edit
- Include in the `handleDetailsSubmit` payload
- Place it in the existing `grid grid-cols-2 gap-4` row, making it a 3-column grid: Duration | Price | Cost

**File: `src/hooks/useServicesData.ts`**

Add `cost: number | null` to the `Service` interface and include it in the `useCreateService` insert payload.

### Part 3: Analytics Card — Service Costs and Sales Profits

**New file: `src/components/dashboard/sales/ServiceCostsProfitsCard.tsx`**

A table-based analytics card matching the reference screenshot with these columns:
- Location (Branch Name)
- Service Category
- Service Name
- Total number of Services (count of appointments)
- Total Service Sales (revenue with inline bar visualization)
- Cost of Service (cost per service x count)
- Service Profit (sales - cost)
- Service Profit % ((profit / sales) x 100)

Data sourcing:
- Appointments from `phorest_appointments` (filtered by date range and location)
- Cost from the `services` table (joined by service name or matched post-query)
- Totals row at the bottom

The card follows the standard luxury header layout with icon, title, MetricInfoTooltip, and AnalyticsFilterBadge.

**File: `src/components/dashboard/analytics/ServicesContent.tsx`**

Wire the new card into the Services subtab's ordered card list and render it alongside existing cards.

### Technical Details

**Migration SQL:**
```sql
ALTER TABLE public.services
ADD COLUMN cost NUMERIC(10,2) DEFAULT NULL;

COMMENT ON COLUMN public.services.cost IS 'Cost to deliver this service (product, supplies, etc.)';
```

**New hook: `src/hooks/useServiceCostsProfits.ts`**
- Queries `phorest_appointments` for the date range (with pagination for large datasets)
- Queries `services` table for cost data
- Joins by service name to calculate: total sales, total cost, profit, profit %
- Groups by location + category + service name
- Returns sorted by total service sales descending

**Card features:**
- Inline horizontal bar chart in the "Total Service Sales" column (colored bars like the reference)
- Sortable columns (click header to sort)
- Totals row at the bottom
- Services without a cost defined show "$0" in the Cost column (100% profit) — this incentivizes owners to enter costs
- Respects HideNumbersContext (BlurredAmount) for financial values
