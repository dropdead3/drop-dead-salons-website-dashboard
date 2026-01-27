
# Remove Manual Metrics Tabs from My Stats Page

## Overview

Remove the manual entry tabs (Visibility, Leads, Bookings) from the My Stats page. These social media and lead tracking metrics belong to the Client Engine program's daily task workflow, not the stylist performance dashboard.

## What to Remove

The entire `Tabs` component section containing:
- **Visibility tab**: Posts Published, Reels Published, Stories Published, Reach, Profile Visits, Saves, Shares
- **Leads tab**: DMs Received, Inquiry Forms, Ad Leads, Referral Leads
- **Bookings tab**: Consults Booked, Consults Completed, Services Booked, Revenue Booked, New Clients

Also remove:
- The `handleSave` function and Save button (no longer needed)
- The `metrics` state and `handleChange` function
- The `initialMetrics` interface and constant
- The `DailyMetrics` interface
- The `MetricInput` component
- The unused imports related to manual entry

## What Remains

The My Stats page will focus on **Phorest-powered performance data**:
- Phorest Data Card (weekly stats)
- Personal Goals & Tier Progress
- Performance Trend Charts
- Client Insights
- Service Mix Charts
- Location Revenue Comparison
- Sales Achievements
- Conversion Dashboard

## File to Modify

| File | Changes |
|------|---------|
| `src/pages/dashboard/Stats.tsx` | Remove Tabs section, metrics state, Save button, and related code |

## Code Cleanup

Remove these elements:
1. `DailyMetrics` interface (lines 41-57)
2. `initialMetrics` constant (lines 59-76)
3. `metrics` and `setMetrics` state
4. `saving` state
5. `handleChange` function
6. `handleSave` function
7. `totalLeads` calculation
8. Save button in header
9. Entire `Tabs` component and its contents
10. `MetricInput` component definition
11. Unused imports: `Input`, `Label`, `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger`, `Save`, `Loader2`

## Result

A cleaner My Stats page focused purely on automated Phorest data visualization, personal goals, and performance analytics - no manual data entry fields.
