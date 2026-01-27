

# Fix: Analytics Cards Not Toggling On

## Problem

When you toggle "Sales Overview" (and other cards) in the Available Analytics list, nothing happens. The card doesn't appear on the dashboard.

## Root Cause

The toggle system tries to **update** visibility records in the database, but many analytics cards don't have records in the `dashboard_element_visibility` table yet.

**Cards registered in database:**
- sales_dashboard_bento
- top_performers
- revenue_breakdown
- capacity_utilization
- week_ahead_forecast

**Cards missing from database (can't be toggled):**
- sales_overview
- operations_stats
- client_funnel
- team_goals
- new_bookings
- hiring_capacity
- staffing_trends
- stylist_workload

When `handleTogglePinnedCard` runs, it calls an UPDATE query on non-existent rows, which silently fails.

---

## Solution

Modify `handleTogglePinnedCard` in `DashboardCustomizeMenu.tsx` to **upsert** (insert if missing, update if exists) rather than just update.

### Option A: Use existing `useAddVisibilityElement` hook (Recommended)

Before toggling, check if the element exists. If not, register it first using the existing registration pattern:

```typescript
const handleTogglePinnedCard = async (cardId: string) => {
  const isPinned = isCardPinned(cardId);
  const newIsVisible = !isPinned;
  
  // Get card metadata for registration
  const card = PINNABLE_CARDS.find(c => c.id === cardId);
  
  // Check if element exists in visibility system
  const elementExists = visibilityData?.some(v => v.element_key === cardId);
  
  if (!elementExists && newIsVisible && card) {
    // Register the element first (creates entries for all roles)
    await registerElement.mutateAsync({
      elementKey: cardId,
      elementName: card.label,
      elementCategory: 'Analytics',
    });
  }
  
  // Then toggle visibility for leadership roles
  for (const role of leadershipRoles) {
    await toggleVisibility.mutateAsync({
      elementKey: cardId,
      role,
      isVisible: newIsVisible,
    });
  }
  
  // Update sectionOrder...
};
```

### Option B: Update toggle mutation to upsert

Modify `useToggleDashboardVisibility` to use an upsert operation instead of update.

---

## Implementation Steps

1. **Add `useAddVisibilityElement` hook** to `DashboardCustomizeMenu.tsx`

2. **Update `handleTogglePinnedCard`** to:
   - Check if element exists in `visibilityData`
   - If not, call `registerElement.mutateAsync()` first
   - Then proceed with toggling visibility

3. **Add category metadata** to `PINNABLE_CARDS` for proper registration:
   ```typescript
   const PINNABLE_CARDS = [
     { id: 'sales_overview', label: 'Sales Overview', category: 'Sales', icon: ... },
     { id: 'operations_stats', label: 'Operations Stats', category: 'Operations', icon: ... },
     // etc.
   ];
   ```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/DashboardCustomizeMenu.tsx` | Import `useAddVisibilityElement`, update toggle logic to register missing elements first |

---

## Technical Details

The fix adds a pre-check before toggling:

```typescript
// In DashboardCustomizeMenu.tsx
const registerElement = useAddVisibilityElement();

const handleTogglePinnedCard = async (cardId: string) => {
  const isPinned = isCardPinned(cardId);
  const newIsVisible = !isPinned;
  const card = PINNABLE_CARDS.find(c => c.id === cardId);
  
  // Check if this element has any visibility entries
  const elementExists = visibilityData?.some(v => v.element_key === cardId);
  
  // If turning ON and element doesn't exist, register it first
  if (!elementExists && newIsVisible && card) {
    await registerElement.mutateAsync({
      elementKey: cardId,
      elementName: card.label,
      elementCategory: card.category || 'Analytics',
    });
  }
  
  // Now toggle visibility for leadership roles
  for (const role of leadershipRoles) {
    await toggleVisibility.mutateAsync({
      elementKey: cardId,
      role,
      isVisible: newIsVisible,
    });
  }
  
  // Rest of the function (updating sectionOrder)...
};
```

This ensures any new pinnable card will be auto-registered on first toggle.

