

## Remove Decorative Oat Dot from All Section Headers

### What Changes
Remove the small gold/oat decorative dot (`w-1.5 h-1.5 rounded-full bg-oat`) from all section headers across the dashboard. This dot appears in 7 files across ~10 instances.

### Files and Locations

1. **`src/pages/dashboard/DashboardHome.tsx`** (4 instances)
   - Line 424: Quick Actions header
   - Line 560: Today's Schedule header
   - Line 581: My Tasks header
   - Line 738: YOUR COMMAND CENTER header

2. **`src/pages/dashboard/CampaignDetail.tsx`** (1 instance)
   - Line 500: ACTION STEPS header

3. **`src/components/dashboard/AnnouncementsDrawer.tsx`** (1 instance)
   - Line 206: ANNOUNCEMENTS header

4. **`src/components/dashboard/AnnouncementsBento.tsx`** (1 instance)
   - Line 88: ANNOUNCEMENTS header

5. **`src/components/dashboard/ActiveCampaignsCard.tsx`** (1 instance)
   - Line 49: ACTIVE CAMPAIGNS header

6. **`src/components/dashboard/AIInsightsDrawer.tsx`** (1 instance)
   - Line 326: ZURA BUSINESS INSIGHTS header

7. **`src/components/dashboard/sales/ServicePopularityChart.tsx`** (1 instance)
   - Line 440: STYLIST BREAKDOWN header

### Technical Detail
For each instance, remove the `<div className="w-1.5 h-1.5 rounded-full bg-oat" />` element and adjust the parent wrapper if needed (e.g., remove the wrapping flex container if it only existed to hold the dot + text).

