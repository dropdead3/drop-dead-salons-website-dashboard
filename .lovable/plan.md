

## Staff Performance Subtab — Gap Fixes and Enhancements

### 1. Fix Staff Performance Leaderboard design system compliance

**File**: `src/components/dashboard/analytics/SalesTabContent.tsx` (lines 397-429)

- Add `className={tokens.card.wrapper}` to the leaderboard `<Card>`
- Restructure the `<CardHeader>` to use two-column `justify-between` layout
- Add `MetricInfoTooltip` next to the "STAFF PERFORMANCE" title
- Add `AnalyticsFilterBadge` in the right column
- Add an `EmptyState` fallback when `stylistData` is empty or undefined
- Use `tokens.card.iconBox`, `tokens.card.icon`, `tokens.card.title` for icon and title

### 2. Make StaffKPISummary tiles interactive (smart tab linking)

**File**: `src/components/dashboard/sales/StaffKPISummary.tsx`
**File**: `src/components/dashboard/analytics/SalesTabContent.tsx`

- Accept an `onTileClick` callback prop on `StaffKPISummary` that receives the engagement view key (`'visits' | 'retention' | 'rebooking'`)
- Map each tile to its corresponding view: Total Visits -> `'visits'`, Returning % -> `'retention'`, Rebooking % -> `'rebooking'`, Avg Ticket -> `'visits'`
- Add `cursor-pointer hover:border-primary/30 transition-colors` to clickable tiles
- In `SalesTabContent`, lift the `ClientEngagementCard`'s active view into shared state. When a KPI tile is clicked, set that state so the engagement card switches to the matching tab and scrolls into view via `scrollIntoView({ behavior: 'smooth' })`

### 3. Add Avg Ticket period-over-period trend

**File**: `src/hooks/useClientEngagement.ts`

- Compute `avgTicketCurrent` and `avgTicketPrior` from the current/prior appointment data (total revenue / total appointments for each period)
- Add to the return object: `avgTicket: { current: number, prior: number, percentChange: number | null }`

**File**: `src/components/dashboard/sales/StaffKPISummary.tsx`

- Replace the hardcoded `change: null` on the Avg Ticket tile with `data.avgTicket.percentChange`

### 4. Leaderboard empty state

**File**: `src/components/dashboard/analytics/SalesTabContent.tsx`

- Wrap the existing `stylistData?.slice(0, 10).map(...)` block with a conditional: if `stylistData` is empty or undefined after loading completes, render `<EmptyState icon={CreditCard} title="No staff data" description="No revenue data found for the selected period." />`

### Technical notes

- The `useClientEngagement` hook already fetches `total_price` for both current and prior periods, so computing the aggregate avg ticket and its trend requires no new database queries
- The smart tab linking uses a React `useRef` on the engagement card wrapper and `scrollIntoView` for smooth UX
- All changes follow existing design token patterns and card header rules
- The leaderboard card uses a separate data source (`useStylistPerformance` or similar), so the `AnalyticsFilterBadge` will use the same `filterContext` already threaded through the subtab

