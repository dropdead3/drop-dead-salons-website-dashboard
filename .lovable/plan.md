

## Clean Up Donut Chart Gaps

Remove visible gaps between donut chart segments and replace with a clean thin stroke separator. This applies to all donut/pie charts across the project for consistency.

### The Fix

For every `<Pie>` component that currently uses `paddingAngle={2}` or `paddingAngle={5}`:
- Set `paddingAngle={0}` (no gaps)
- Set `stroke="hsl(var(--border) / 0.4)"` (thin separator line matching the app's border color)
- Set `strokeWidth={1}` (clean, minimal divider)

### Files to Update (19 total with paddingAngle)

1. **`src/components/dashboard/analytics/ServicesContent.tsx`** (line 391) -- the category mix donut visible in the screenshot
2. **`src/components/dashboard/sales/RevenueDonutChart.tsx`** (line 84)
3. **`src/components/dashboard/payroll/analytics/CompensationBreakdownChart.tsx`** (line 90)
4. **`src/components/dashboard/sales/ServiceMixChart.tsx`** (line 133)
5. **`src/components/dashboard/sales/ClientFunnelCard.tsx`** (line 82)
6. **`src/components/dashboard/LeadFunnelCard.tsx`** (line 147)
7. **`src/components/dashboard/analytics/StaffUtilizationContent.tsx`** (line 258)
8. **`src/components/dashboard/analytics/AppointmentsContent.tsx`** (line 339)
9. **`src/components/dashboard/analytics/PromotionROIPanel.tsx`** (line 230)
10. **`src/components/dashboard/marketing/MediumDistributionChart.tsx`** (line 107)
11. **`src/components/dashboard/reports/IndividualStaffReport.tsx`** (lines 468, 505)
12. **`src/components/platform/RevenueChart.tsx`** (line 165)
13. **`src/components/platform/analytics/RevenueIntelligence.tsx`** (line 190)
14. **`src/pages/dashboard/admin/SalesDashboard.tsx`** (line 597)
15. **`src/pages/dashboard/admin/ProgramAnalytics.tsx`** (line ~520)

The `LocationDonutChart.tsx` already uses `paddingAngle={0}` with a stroke -- no changes needed there.

### Design Rule Addition

The `CARD_HEADER_DESIGN_RULES.md` will be updated with a new "Donut/Pie Chart" rule:
- `paddingAngle={0}` always
- `stroke="hsl(var(--border) / 0.4)"` and `strokeWidth={1}` for clean segment separation
- No visible gaps between segments

