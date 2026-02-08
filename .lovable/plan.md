

# Add Missing Sidebar Navigation to Dashboard Pages

## Problem
Five dashboard pages are missing the `DashboardLayout` wrapper, which provides the sidebar navigation. Users on these pages see only the page content without the ability to navigate to other dashboard sections.

**Affected Pages:**
| Page | Current State | Issue |
|------|---------------|-------|
| Access Hub | `<div className="p-6 lg:p-8...">` | No sidebar |
| Booth Renters | `<PlatformPageContainer>` only | No sidebar |
| Day Rate Calendar | `<div className="container">` | No sidebar |
| Day Rate Settings | `<div className="container">` | No sidebar |
| Features Center | `<div className="p-6 lg:p-8...">` | No sidebar |

## Solution
Wrap each page's content in the `DashboardLayout` component, which provides the consistent sidebar navigation used throughout the dashboard.

---

## Implementation

### File Changes

**1. `src/pages/dashboard/admin/AccessHub.tsx`**
- Import `DashboardLayout`
- Wrap the return content in `<DashboardLayout>...</DashboardLayout>`

**2. `src/pages/dashboard/admin/BoothRenters.tsx`**
- Import `DashboardLayout`
- Wrap the `PlatformPageContainer` in `<DashboardLayout>...</DashboardLayout>`

**3. `src/pages/dashboard/admin/DayRateCalendar.tsx`**
- Import `DashboardLayout`
- Wrap the container div in `<DashboardLayout>...</DashboardLayout>`

**4. `src/pages/dashboard/admin/DayRateSettings.tsx`**
- Import `DashboardLayout`
- Wrap the container div in `<DashboardLayout>...</DashboardLayout>`

**5. `src/pages/dashboard/admin/FeaturesCenter.tsx`**
- Import `DashboardLayout`
- Wrap the main div in `<DashboardLayout>...</DashboardLayout>`

---

## Technical Pattern

Each page will follow this consistent pattern:

```typescript
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export default function PageName() {
  return (
    <DashboardLayout>
      {/* existing page content */}
    </DashboardLayout>
  );
}
```

This matches the pattern used by other dashboard pages like `ManagementHub`, `AnalyticsHub`, `Payroll`, `TrainingHub`, etc.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/dashboard/admin/AccessHub.tsx` | Add DashboardLayout wrapper |
| `src/pages/dashboard/admin/BoothRenters.tsx` | Add DashboardLayout wrapper |
| `src/pages/dashboard/admin/DayRateCalendar.tsx` | Add DashboardLayout wrapper |
| `src/pages/dashboard/admin/DayRateSettings.tsx` | Add DashboardLayout wrapper |
| `src/pages/dashboard/admin/FeaturesCenter.tsx` | Add DashboardLayout wrapper |

