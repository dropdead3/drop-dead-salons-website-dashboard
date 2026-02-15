

## Fix Location Sort Display Values

### Problem
When sorting locations by a metric other than "Revenue" (e.g., Services, Products, Transactions, Avg Ticket), the displayed value on each row still shows total revenue. The number should reflect the selected sort field so users can see why locations are ranked in that order.

**Exception**: When sorting by "Name" (alphabetical), the displayed value should remain as revenue since alphabetical sorting is just a different ordering of the same data.

### Changes

**File**: `src/components/dashboard/AggregateSalesCard.tsx`

**Location**: Around line 1019-1022, where each location row renders its value.

Currently:
```tsx
<span className="text-sm font-display tabular-nums">
  <BlurredAmount>{formatCurrency(location.totalRevenue)}</BlurredAmount>
</span>
```

Will be updated to dynamically show the value matching the selected sort field:

| Sort Field | Displayed Value | Format |
|---|---|---|
| Revenue (default) | `totalRevenue` | Currency |
| Name | `totalRevenue` | Currency (no change) |
| Services | `serviceRevenue` | Currency |
| Products | `productRevenue` | Currency |
| Transactions | `totalTransactions` | Plain number |
| Avg Ticket | `totalRevenue / totalTransactions` | Currency |

A helper function will map `locationSortField` to the correct value and format (currency vs plain number), keeping the logic clean and readable.

### Scope
Single file change, ~15 lines added. No new dependencies or data changes needed -- all required data fields already exist on each location object.

