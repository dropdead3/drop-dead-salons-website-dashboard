
# Hide Sales Reports When Sales Visibility is Disabled

## Problem

In the Analytics & Reports page (Reports tab), sales-related reports are still visible for the Manager role even when the Sales visibility toggle is OFF:

- Daily Sales Summary
- Sales by Stylist  
- Sales by Location
- Product Sales Report

These reports display revenue data that should be restricted when `analytics_sales_tab` is disabled.

---

## Solution

Apply the same pattern used for the Command Center cards: inherit visibility from the parent `analytics_sales_tab`. When sales visibility is disabled, the Sales report category and all its reports should be hidden.

---

## Changes

### Update ReportsTabContent.tsx

**File: `src/components/dashboard/analytics/ReportsTabContent.tsx`**

| Change | Description |
|--------|-------------|
| Import `useElementVisibility` | Check if parent sales tab is visible |
| Add visibility check for Sales category | Hide entire "Sales" sub-tab if sales visibility is off |
| Wrap Sales TabsContent | Don't render sales reports content if hidden |
| Auto-redirect logic | If user lands on "sales" category and it's hidden, redirect to first visible category |

```tsx
import { VisibilityGate, useElementVisibility } from '@/components/visibility/VisibilityGate';

// Check if parent sales tab is visible (determines if sales reports should show)
const salesTabVisible = useElementVisibility('analytics_sales_tab');

// Update report categories to filter based on visibility
const visibleCategories = reportCategories.filter(cat => {
  if (cat.id === 'sales' && !salesTabVisible) return false;
  // Add other category visibility checks as needed
  return true;
});

// Auto-redirect if current category is hidden
useEffect(() => {
  if (activeCategory === 'sales' && !salesTabVisible) {
    const firstVisible = visibleCategories[0]?.id || 'staff';
    setActiveCategory(firstVisible);
  }
}, [activeCategory, salesTabVisible, visibleCategories]);
```

Then update the tab content rendering:

```tsx
{/* Only render Sales content if visible */}
{salesTabVisible && (
  <TabsContent value="sales" className="mt-6">
    {renderReportCards(salesReports)}
  </TabsContent>
)}
```

---

## Report Category to Parent Tab Mapping

| Report Category | Parent Visibility Key | Should Hide When |
|-----------------|----------------------|------------------|
| Sales | `analytics_sales_tab` | Sales tab hidden |
| Staff | (always visible) | - |
| Clients | (always visible) | - |
| Operations | `analytics_operations_tab` | Operations tab hidden (optional) |
| Financial | `analytics_sales_tab` | Sales tab hidden (financial includes revenue) |

---

## Technical Details

### Default Category Fallback

When sales visibility is OFF and user tries to access the sales report category:
1. The Sales sub-tab trigger will not render
2. The Sales TabsContent will not render
3. If `activeCategory === 'sales'`, auto-redirect to "staff" (next available category)

### Financial Reports Consideration

Financial reports (Revenue Trend, Commission, YoY) should also be hidden when sales visibility is off since they contain revenue data. Two options:

1. **Hide entire Financial category** when sales is hidden
2. **Keep Financial visible** but hide revenue-specific reports within it

Option 1 is safer since most financial reports contain revenue data.

---

## File Summary

| File | Action |
|------|--------|
| `src/components/dashboard/analytics/ReportsTabContent.tsx` | Add visibility checks for Sales and Financial categories |

---

## Visual Result

When Sales visibility is OFF for Manager role:

**Before (Current - Broken)**
```
Sub-tabs: [Sales] [Staff] [Clients] [Operations] [Financial]
Content: Shows Daily Sales Summary, Sales by Stylist, Sales by Location, Product Sales Report
```

**After (Fixed)**
```
Sub-tabs: [Staff] [Clients] [Operations]
Content: Auto-redirects to Staff reports if user was on Sales
```

Manager will no longer see any sales reports or financial reports when the parent sales visibility is disabled.
