

## Add Empty State Messages and Default Date Range for Services Subtab

### Change 1: Default Date Range for Services Subtab

**File: `src/pages/dashboard/admin/AnalyticsHub.tsx`**

Add a `useEffect` that automatically switches the date range to `'30d'` when the user navigates to the `services` subtab (under the Sales tab). This ensures service-level cards show meaningful, aggregate data by default instead of a single day's sparse results.

The effect will only auto-switch if the current date range is `'today'` (the global default), so it won't override a user's intentional selection. When the user navigates away from the services subtab, the date range stays at whatever they chose -- no forced reset.

```tsx
// After line ~234 (handleSubTabChange)
useEffect(() => {
  if (subTab === 'services' && dateRange === 'today') {
    setDateRange('30d');
  }
}, [subTab]);
```

### Change 2: Empty State for Sparse Data

**File: `src/components/dashboard/analytics/ServicesContent.tsx`**

For three cards that need enough volume to be useful, add a helpful empty state when fewer than 3 services are returned. This replaces the current terse "Not enough data" messages with the project's `EmptyState` component and a suggestion to widen the date range.

Cards affected:
- **New Client Magnets / Retention Drivers** (line ~507-508): Currently shows "Not enough data (services need 3+ bookings)" -- will use `EmptyState` with a more helpful message
- **Service Rebooking Rates** (line ~719-720): Currently shows "Not enough data (services need 5+ bookings)" -- same treatment
- **Price Realization** (need to check, but same pattern)

The updated empty state will use the existing `EmptyState` component:
```tsx
import { EmptyState } from '@/components/ui/empty-state';
import { CalendarRange } from 'lucide-react';

// Replace sparse text with:
<EmptyState
  icon={CalendarRange}
  title="Not enough data"
  description="Fewer than 3 services found. Try widening your date range (e.g. Last 30 Days) for more meaningful insights."
/>
```

This gives users a clear, actionable next step instead of a cryptic one-liner.
