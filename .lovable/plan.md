

## Reorganize Service Costs Card: Summary vs. Detail View

### What Changes

Add a **"By Category" / "By Service"** toggle to the card header (using the existing `FilterTabsList` / `FilterTabsTrigger` pattern already used across your analytics cards).

### Two Views

**1. By Category (default)** — A compact summary table with one row per service category:
- Category Name
- Number of Services (total appointments in that category)
- Total Sales
- Total Cost
- Profit
- Margin %
- A small inline bar showing share of total revenue

This collapses the 80+ rows into roughly 5-8 category rows, making the card instantly digestible.

**2. By Service (detail)** — The current full table with every individual service row, grouped by category with collapsible headers (exactly what exists today). This becomes the drill-down for users who need line-item detail.

### Layout

The toggle sits in the card header's right column (next to the filter badge and missing-costs warning), following the established card header layout standard for view-level toggles.

### Technical Details

**File: `src/components/dashboard/sales/ServiceCostsProfitsCard.tsx`**

1. Add state: `const [view, setView] = useState<'category' | 'service'>('category');`

2. Import `Tabs, FilterTabsList, FilterTabsTrigger` from `@/components/ui/tabs`

3. Add the toggle in the header's right-side `div` (before the filter badge):
   ```tsx
   <Tabs value={view} onValueChange={(v) => setView(v as 'category' | 'service')}>
     <FilterTabsList>
       <FilterTabsTrigger value="category">By Category</FilterTabsTrigger>
       <FilterTabsTrigger value="service">By Service</FilterTabsTrigger>
     </FilterTabsList>
   </Tabs>
   ```

4. Compute a `categoryRows` summary from `groupedByCategory` (already computed) — aggregating total services, sales, cost, profit, and margin per category.

5. Conditionally render:
   - `view === 'category'`: Simplified table with columns **Category, # Services, Total Sales, Total Cost, Profit, Margin** (no Location or Unit Cost columns since those are service-level details). Each row gets a bar visualization for sales share.
   - `view === 'service'`: The existing full table (current behavior, unchanged).

6. The summary KPI tiles at the top remain visible in both views.

7. The category view table includes the same sort functionality (click column headers to sort) and the totals footer row.

