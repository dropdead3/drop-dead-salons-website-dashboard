

## Add Filter Badges to All Services Analytics Cards

### Problem
The Services analytics page has 7 card sections, none of which display the `AnalyticsFilterBadge` showing which location and date range the data represents. Other analytics cards throughout the app (e.g., Rebooking Rate, Service Mix standalone) already use this badge pattern consistently. The Services tab should match.

### What Changes

Add the `AnalyticsFilterBadge` component to the header row of every card section on the Services tab. The badge sits in the top-right corner of each card header, showing the selected location and date range (e.g., "All Locations . Today").

Cards receiving the badge:
1. Service Category Mix
2. Client Type Analysis (New Client Magnets / Retention Drivers)
3. Service Efficiency Matrix
4. Service Rebooking Rates
5. Price Realization
6. Service Demand Trends
7. Service Pairings

The KPI tiles at the top do not get individual badges since they share the page-level filter context and are compact metric tiles, not full cards.

### Technical Details

**File: `src/components/dashboard/analytics/ServicesContent.tsx`**

- Import `AnalyticsFilterBadge` from `@/components/dashboard/AnalyticsFilterBadge`
- In each of the 7 card `CardHeader` sections, wrap the existing header content and the badge in a `flex items-center justify-between` container
- The badge renders: `<AnalyticsFilterBadge locationId={filterContext.locationId} dateRange={filterContext.dateRange} />`
- This follows the exact same pattern used in `RebookingCard`, `ServiceMixCard`, and other existing analytics cards

No new files, no new hooks, no database changes. Purely a UI consistency fix using an existing component.
