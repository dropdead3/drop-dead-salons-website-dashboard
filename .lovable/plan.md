

# Fix Analytics Tab Visibility - Content Should Hide When Tab Is Disabled

## Problem

When visibility toggles are turned off for analytics tabs (like Sales), only the **tab button** is hidden. The **tab content** still displays because:

1. The `VisibilityGate` only wraps the `TabsTrigger`, not the `TabsContent`
2. The default active tab is `'sales'`, so it renders even when the button is hidden
3. Users can still see revenue data they shouldn't have access to

## Solution

Wrap each `TabsContent` with the same `VisibilityGate` used for its corresponding `TabsTrigger`, and add logic to automatically redirect to the first visible tab when the current tab is hidden.

---

## Changes

### 1. Update AnalyticsHub.tsx

**File: `src/pages/dashboard/admin/AnalyticsHub.tsx`**

Add visibility gating to each `TabsContent` and implement auto-redirect logic:

| Change | Description |
|--------|-------------|
| Import `useElementVisibility` | Hook to check tab visibility |
| Add visibility checks | Check if each tab is visible before rendering content |
| Auto-redirect logic | If current tab is hidden, switch to first visible tab |
| Wrap `TabsContent` | Each content section respects its tab's visibility |

```tsx
import { VisibilityGate, useElementVisibility } from '@/components/visibility/VisibilityGate';

// Check visibility of each tab
const salesTabVisible = useElementVisibility('analytics_sales_tab');
const operationsTabVisible = useElementVisibility('analytics_operations_tab');
const marketingTabVisible = useElementVisibility('analytics_marketing_tab');
const programTabVisible = useElementVisibility('analytics_program_tab');
const reportsTabVisible = useElementVisibility('analytics_reports_tab');
const rentTabVisible = useElementVisibility('analytics_rent_tab');

// Find first visible tab for redirect
const getFirstVisibleTab = () => {
  if (salesTabVisible) return 'sales';
  if (operationsTabVisible) return 'operations';
  if (marketingTabVisible) return 'marketing';
  if (programTabVisible) return 'program';
  if (reportsTabVisible) return 'reports';
  if (rentTabVisible && isSuperAdmin) return 'rent';
  return null;
};

// Auto-redirect if current tab is hidden
useEffect(() => {
  const currentTabHidden = 
    (activeTab === 'sales' && !salesTabVisible) ||
    (activeTab === 'operations' && !operationsTabVisible) ||
    // ... etc for each tab
  ;
  
  if (currentTabHidden) {
    const firstVisible = getFirstVisibleTab();
    if (firstVisible) {
      setSearchParams({ tab: firstVisible });
    }
  }
}, [activeTab, salesTabVisible, operationsTabVisible, ...]);
```

Then wrap each `TabsContent`:

```tsx
<VisibilityGate elementKey="analytics_sales_tab">
  <TabsContent value="sales" className="mt-6">
    <SalesTabContent ... />
  </TabsContent>
</VisibilityGate>

<VisibilityGate elementKey="analytics_operations_tab">
  <TabsContent value="operations" className="mt-6">
    <OperationsTabContent ... />
  </TabsContent>
</VisibilityGate>

// ... repeat for all tabs
```

---

## Technical Details

### Visibility Check Order

The first visible tab fallback priority:
1. Sales
2. Operations  
3. Marketing
4. Program
5. Reports
6. Rent (only for super_admin)

### Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| Current tab hidden | Auto-redirect to first visible tab |
| All tabs hidden | Show empty state or access denied message |
| URL directly to hidden tab | Redirect on mount |
| Role change during session | React to visibility changes dynamically |

---

## File Summary

| File | Action |
|------|--------|
| `src/pages/dashboard/admin/AnalyticsHub.tsx` | Add visibility checks, auto-redirect, wrap TabsContent |

---

## Visual Result

When Sales visibility is turned OFF for Manager role:

**Before (Current - Broken)**
```
Tabs: [Operations] [Marketing] [Program] [Reports] [Rent]
Content: Still shows Sales Overview with $2,205 revenue
```

**After (Fixed)**
```
Tabs: [Operations] [Marketing] [Program] [Reports] [Rent]
Content: Shows Operations content (auto-redirected)
```

The Manager will no longer see any sales or revenue data when those tabs are disabled.

