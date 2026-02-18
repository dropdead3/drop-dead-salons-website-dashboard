

## Service Retail Attachment Analytics

### What We're Building

A new analytic that answers: **"Which services drive the most retail product sales?"** It cross-references service and product line items within the same transaction to show:
- Which services have the highest/lowest retail attachment rates
- How much retail revenue is generated alongside each service
- Average retail dollars per attached transaction

This appears in **two places** with different framing:

1. **Services Tab**: Framed as "Retail Pairing Strength" -- helps understand which services naturally lead to product recommendations (e.g., color services may pair well with color care products)
2. **Retail Tab**: Framed as "Service-Driven Retail" -- helps understand which services are the biggest drivers of retail revenue, so owners can double down on training for low-attachment services

---

### Data Hook: `useServiceRetailAttachment`

**New file**: `src/hooks/useServiceRetailAttachment.ts`

Queries `phorest_transaction_items` with manual pagination (per project standards for high-volume orgs):

1. Fetch all service items in the date range (with `item_name`, `item_category`, `transaction_id`)
2. Fetch all product items in the date range (with `transaction_id`, `total_amount`)
3. Group services by `item_name` (and `item_category`)
4. For each service, count how many of its transactions also had a product, and sum the product `total_amount`

Returns:
```text
ServiceRetailRow {
  serviceName: string
  serviceCategory: string | null
  totalTransactions: number       -- transactions containing this service
  attachedTransactions: number    -- of those, how many also had retail
  attachmentRate: number          -- percentage
  retailRevenue: number           -- total retail $ from attached transactions
  avgRetailPerAttached: number    -- retail $ / attached transactions
}
```

Sorted by `retailRevenue` descending by default.

---

### Services Tab Card: "Retail Pairing Strength"

**File**: `src/components/dashboard/analytics/ServicesContent.tsx`

Added as a new section in the reorder drawer definitions. Shows a compact ranked list of services with:
- Service name + category badge
- Attachment rate as a color-coded progress bar (green >= 50%, amber >= 25%, red < 25%)
- Retail revenue total
- Expandable insight: "X of Y service visits included retail"

Framing copy: *"Which services naturally lead to product sales? Higher attachment rates suggest strong recommendation opportunities during these services."*

---

### Retail Tab Card: "Service-Driven Retail"

**File**: `src/components/dashboard/analytics/RetailAnalyticsContent.tsx`

Added as a new section. Shows a table view ranked by retail revenue with columns:
- Service name
- Category
- Retail Revenue (from attached transactions)
- Attachment Rate
- Average Retail Ticket (per attached visit)
- Transaction counts

Framing copy: *"Which services generate the most retail revenue? Focus training on low-attachment, high-volume services to unlock more product sales."*

Includes a summary insight line highlighting the top retail-driving service and the lowest-attachment high-volume service (opportunity callout).

---

### Technical Details

**Files created:**
- `src/hooks/useServiceRetailAttachment.ts` -- data hook with paginated fetching

**Files modified:**
- `src/components/dashboard/analytics/ServicesContent.tsx` -- add "Retail Pairing Strength" card + section definition
- `src/components/dashboard/analytics/RetailAnalyticsContent.tsx` -- add "Service-Driven Retail" card

**Patterns followed:**
- Manual pagination via `.range()` per analytics hook standards
- `PinnableCard` wrapper for dashboard pinning
- `MetricInfoTooltip` for metric explanations
- `BlurredAmount` for currency values
- `useFormatCurrency` for formatting
- Sortable columns with `ArrowUpDown` icons
- Color-coded progress bars matching existing rebooking rate pattern
