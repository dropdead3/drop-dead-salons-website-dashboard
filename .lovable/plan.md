
# Add Border to Location Dropdown in Capacity Utilization Card

## Change Required

Add a thin border stroke to the `LocationSelect` dropdown in the `CapacityUtilizationCard` component for visual prominence.

## File to Modify

**`src/components/dashboard/sales/CapacityUtilizationCard.tsx`** (Line 207)

### Current Code:
```typescript
<LocationSelect
  value={selectedLocation}
  onValueChange={setSelectedLocation}
  includeAll={true}
  allLabel="All Locations"
  triggerClassName="h-8 w-[180px] text-xs"
/>
```

### Updated Code:
```typescript
<LocationSelect
  value={selectedLocation}
  onValueChange={setSelectedLocation}
  includeAll={true}
  allLabel="All Locations"
  triggerClassName="h-8 w-[180px] text-xs border border-border"
/>
```

## Visual Result

The dropdown will have a subtle border that matches the design system's border color (`border-border`), giving it clear visual definition without being too heavy.
