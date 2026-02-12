

## Replace "Services vs Products" Bar with Retail Attachment Rate

### What Changes

The current "Services vs Products" revenue split bar on each Location Comparison Card will be replaced with a **Retail Attachment Rate** bar — a far more actionable metric.

**Definition**: Of all transactions that contain at least one service, what percentage also include a retail product? E.g., 10 service transactions, 2 also had retail = 20% attachment rate.

---

### 1. Update `useRetailAttachmentRate` Hook

The existing hook in `src/hooks/useRetailAttachmentRate.ts` currently counts by **distinct clients**. We will update it to count by **distinct transactions** instead:

- Query `phorest_transaction_items` for distinct `transaction_id` values where `item_type` is a service
- Query distinct `transaction_id` values where `item_type` is a product/retail
- Compute intersection: service transactions that also appear in the product set
- Return `serviceTransactions`, `attachedTransactions`, and `attachmentRate`

The interface will update from `serviceClients/retailClients` to `serviceTransactions/attachedTransactions` while keeping `attachmentRate` the same.

---

### 2. Update LocationComparisonCard

In `src/components/dashboard/sales/location-comparison/LocationComparisonCard.tsx`:

- Remove the "Services vs Products" revenue ratio calculation and bar (lines 46-48 and the corresponding JSX block)
- Add a call to `useRetailAttachmentRate({ dateFrom, dateTo, locationId: location.location_id })`
- Replace the ratio bar with:
  - Label: "Attach Rate" on the left, percentage on the right
  - A `Progress` bar filled to the attachment rate percentage, colored with the location's chart color
  - Tooltip showing "X of Y service transactions included retail"

---

### 3. Update Anywhere Else Using the Old Interface

Check if `serviceClients` / `retailClients` fields from the hook are used elsewhere and update those references to match the new transaction-based naming.

---

### Technical Notes

- **Files modified**:
  - `src/hooks/useRetailAttachmentRate.ts` — switch from client-based to transaction-based counting
  - `src/components/dashboard/sales/location-comparison/LocationComparisonCard.tsx` — swap ratio bar for attachment rate bar
  - Any other consumers of `useRetailAttachmentRate` (will verify during implementation)
- No new dependencies needed
- The hook already accepts `locationId`, so per-location attachment rates work out of the box
