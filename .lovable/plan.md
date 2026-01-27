

# Hide Revenue Analytics from Front Desk Users

## Overview

This change removes the "Today's Revenue" card from the Front Desk (`receptionist`) role's dashboard view. Front Desk users should only see operational metrics (Waiting, In Service, Completed, No-Shows) without any financial data.

---

## Current State

The `OperationsQuickStats` component displays 5 cards:
1. Waiting
2. In Service
3. Completed
4. No-Shows
5. **Today's Revenue** (problematic for Front Desk)

The revenue card is always rendered regardless of user role.

---

## Solution

### Approach: Pass a prop to hide revenue

Add a `hideRevenue` prop to `OperationsQuickStats` and conditionally render the revenue card.

### File Changes

#### 1. `src/components/dashboard/operations/OperationsQuickStats.tsx`

**Add prop to interface:**
```typescript
interface OperationsQuickStatsProps {
  locationId?: string;
  hideRevenue?: boolean;  // NEW
}
```

**Update component signature:**
```typescript
export function OperationsQuickStats({ locationId, hideRevenue }: OperationsQuickStatsProps) {
```

**Conditionally render revenue card (lines 90-103):**
```typescript
{/* Revenue Card - Hidden for Front Desk */}
{!hideRevenue && (
  <Card className="p-4 bg-gradient-to-br from-green-50 ...">
    {/* ... existing revenue card content ... */}
  </Card>
)}
```

**Update grid layout (line 75):**
```typescript
// Adjust grid columns based on whether revenue is shown
<div className={`grid grid-cols-2 ${hideRevenue ? 'lg:grid-cols-4' : 'lg:grid-cols-5'} gap-4`}>
```

#### 2. `src/pages/dashboard/DashboardHome.tsx`

**Pass prop when rendering for Front Desk (around line 272):**
```typescript
<OperationsQuickStats hideRevenue={isFrontDesk && !isLeadership} />
```

This ensures:
- Front Desk (`receptionist` only) sees NO revenue
- Admins, Managers, Super Admins see revenue
- If someone has both roles, leadership wins (revenue shown)

---

## Visual Result

**Front Desk view:**
```text
+----------+----------+----------+----------+
| Waiting  | In Svc   | Complete | No-Shows |
+----------+----------+----------+----------+
```

**Leadership/Admin view:**
```text
+----------+----------+----------+----------+----------+
| Waiting  | In Svc   | Complete | No-Shows | Revenue  |
+----------+----------+----------+----------+----------+
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/dashboard/operations/OperationsQuickStats.tsx` | Add `hideRevenue` prop, conditionally render revenue card, adjust grid |
| `src/pages/dashboard/DashboardHome.tsx` | Pass `hideRevenue={isFrontDesk && !isLeadership}` prop |

