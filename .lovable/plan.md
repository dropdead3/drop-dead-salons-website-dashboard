

## Make Top Performers Empty State Fill Sidebar Gap

### Change

**File: `src/components/dashboard/sales/TopPerformersCard.tsx`**

Add `h-full` back to the empty-state Card (around line 115) so it stretches to fill the sidebar column, consistent with the loading and populated states. The card already uses `flex-1 flex items-center justify-center` for the content area, so the "No sales data available" message will remain vertically centered within the taller card.

Single class addition -- no other files affected.

