

# Location Comparison: Single-Location Optimization

## Overview

Ensure the Location Comparison component and its associated UI elements are completely hidden for single-location accounts. The component already has a guard clause, but we need to also hide the tab trigger and the pinnable wrapper to provide a cleaner experience.

---

## Current State

| Element | Location | Current Behavior |
|---------|----------|------------------|
| `LocationComparison` component | `sales/LocationComparison.tsx:60-62` | Returns `null` when less than 2 locations |
| "Compare" tab trigger | `SalesDashboard.tsx:450-453` | Always visible |
| `PinnableCard` wrapper | `SalesTabContent.tsx:272-277` | Still renders wrapper when component returns null |

---

## Proposed Changes

### 1. Hide "Compare" Tab in SalesDashboard

Conditionally render the "Compare" `TabsTrigger` only when there are 2+ active locations.

**File:** `src/pages/dashboard/admin/SalesDashboard.tsx`

```tsx
// Line 450-453 - Wrap in conditional
{(locations?.filter(l => l.is_active).length ?? 0) >= 2 && (
  <TabsTrigger value="compare" className="flex-1 md:flex-none">
    <GitCompare className="w-4 h-4 mr-1 hidden sm:inline" />
    Compare
  </TabsTrigger>
)}
```

Also wrap the `TabsContent` for "compare" (lines 782-788) in the same conditional to prevent an empty tab panel from being accessible via URL or other means.

---

### 2. Hide PinnableCard Wrapper in Analytics Hub

Conditionally render the entire `PinnableCard` for Location Comparison only when there are 2+ locations with data.

**File:** `src/components/dashboard/analytics/SalesTabContent.tsx`

```tsx
// Line 271-277 - Wrap in conditional
{(locationData?.length ?? 0) >= 2 && (
  <PinnableCard elementKey="location_comparison" elementName="Location Comparison" category="Analytics Hub - Sales">
    <LocationComparison 
      locations={locationData || []} 
      isLoading={locationLoading} 
    />
  </PinnableCard>
)}
```

This prevents the pinnable affordance (push-pin icon, hover states) from appearing when the inner component would be empty anyway.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/dashboard/admin/SalesDashboard.tsx` | Conditionally render "Compare" tab trigger and content based on location count |
| `src/components/dashboard/analytics/SalesTabContent.tsx` | Conditionally render PinnableCard wrapper based on location data count |

---

## Technical Details

### SalesDashboard.tsx Changes

**Tab Trigger (around line 450):**
```tsx
// Before
<TabsTrigger value="compare" className="flex-1 md:flex-none">
  <GitCompare className="w-4 h-4 mr-1 hidden sm:inline" />
  Compare
</TabsTrigger>

// After
{(locations?.filter(l => l.is_active).length ?? 0) >= 2 && (
  <TabsTrigger value="compare" className="flex-1 md:flex-none">
    <GitCompare className="w-4 h-4 mr-1 hidden sm:inline" />
    Compare
  </TabsTrigger>
)}
```

**Tab Content (around line 782):**
```tsx
// Before
<TabsContent value="compare" className="space-y-6">
  <LocationComparison ... />
</TabsContent>

// After
{(locations?.filter(l => l.is_active).length ?? 0) >= 2 && (
  <TabsContent value="compare" className="space-y-6">
    <LocationComparison ... />
  </TabsContent>
)}
```

### SalesTabContent.tsx Changes

**PinnableCard wrapper (around line 271):**
```tsx
// Before
<PinnableCard elementKey="location_comparison" elementName="Location Comparison" category="Analytics Hub - Sales">
  <LocationComparison locations={locationData || []} isLoading={locationLoading} />
</PinnableCard>

// After
{(locationData?.length ?? 0) >= 2 && (
  <PinnableCard elementKey="location_comparison" elementName="Location Comparison" category="Analytics Hub - Sales">
    <LocationComparison locations={locationData || []} isLoading={locationLoading} />
  </PinnableCard>
)}
```

---

## User Experience

| Scenario | Result |
|----------|--------|
| Account with 2+ active locations | Full experience - Compare tab visible, PinnableCard available |
| Account with 1 location | No "Compare" tab, no Location Comparison card in Analytics Hub |
| Location data still loading | Component shows loading state (handled by existing `isLoading` prop) |

---

## Why This Approach

1. **Guard at multiple levels:** Hiding both the tab trigger AND the content ensures users can't accidentally navigate to an empty view
2. **Clean pinnable experience:** Wrapping the entire `PinnableCard` prevents empty pin affordances in the Analytics Hub
3. **Uses existing data:** Leverages `locations` array already fetched in both components, no additional queries needed
4. **Future-proof:** New locations added to an account will automatically enable the comparison features

