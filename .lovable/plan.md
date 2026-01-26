
# Change Default Date Range Filter to "Tomorrow"

## Overview
Update the Operational Analytics page to default to "Tomorrow" instead of "30 Days" when first loaded.

## File to Modify

**`src/pages/dashboard/admin/OperationalAnalytics.tsx`** (Line 26)

### Current Code:
```typescript
const [dateRange, setDateRange] = useState<'tomorrow' | '7days' | '30days' | '90days'>('30days');
```

### Updated Code:
```typescript
const [dateRange, setDateRange] = useState<'tomorrow' | '7days' | '30days' | '90days'>('tomorrow');
```

## Result
When users navigate to the Operational Analytics page, the date filter will default to "Tomorrow" showing next-day appointments and capacity data.
