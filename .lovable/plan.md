
# Set "Today" as Default Time Range Filter

## Summary

Update all analytics and dashboard pages to default to **"Today"** for time range filters, providing immediate visibility into current-day metrics on page load.

---

## Current Defaults vs Proposed

| Location | Current Default | Proposed Default |
|----------|----------------|------------------|
| DashboardHome.tsx | `thisMonth` | `today` |
| CommandCenterAnalytics.tsx | `thisMonth` | `today` |
| SalesDashboard.tsx | `30d` | `today` |
| ForecastingCard.tsx | `7days` | `tomorrow` (appropriate for forecasting) |

**Already Correct (no changes needed):**
- AnalyticsHub.tsx → `today` ✓
- AggregateSalesCard.tsx → `today` ✓
- OperationalAnalytics.tsx → `tomorrow` ✓ (makes sense for ops planning)

**Exceptions (keep as-is):**
- ReportsHub.tsx → Full month (reports need broader timeframes)
- MarketingAnalytics.tsx → `month` (marketing trends need longer periods)
- LeadManagement.tsx → `month` (lead tracking needs longer periods)
- StaffRevenueLeaderboard.tsx → `month` (performance tracking)

---

## Files to Modify

### 1. `src/pages/dashboard/DashboardHome.tsx`
Change line 98:
```tsx
// Before
const [dateRange, setDateRange] = useState<DateRangeType>('thisMonth');

// After
const [dateRange, setDateRange] = useState<DateRangeType>('today');
```

### 2. `src/components/dashboard/CommandCenterAnalytics.tsx`
Change line 106:
```tsx
// Before
const [dateRange, setDateRange] = useState<DateRangeType>('thisMonth');

// After
const [dateRange, setDateRange] = useState<DateRangeType>('today');
```

### 3. `src/pages/dashboard/admin/SalesDashboard.tsx`
Change line 87:
```tsx
// Before
const [dateRange, setDateRange] = useState<DateRange>('30d');

// After
const [dateRange, setDateRange] = useState<DateRange>('today');
```

### 4. `src/components/dashboard/sales/ForecastingCard.tsx`
Change line 252 to default to `tomorrow` (since forecasting is forward-looking):
```tsx
// Before
const [period, setPeriod] = useState<ForecastPeriod>('7days');

// After
const [period, setPeriod] = useState<ForecastPeriod>('tomorrow');
```

---

## Result

After implementation:
- Dashboard home page shows today's data immediately on load
- Command Center analytics defaults to today's metrics
- Sales Dashboard shows current day performance
- Forecasting Card defaults to tomorrow (forward-looking context)

This aligns with the existing memory about Analytics Hub defaulting to "Today" for current-day visibility.
