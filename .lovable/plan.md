

# Optimize Sales Overview: Location-Aware Display

## Overview

Update the Sales Overview component to be location-aware. When "All Locations" is selected, show the full breakdown table. When a single location is selected, hide the "By Location" table and update the header sub-text to show the selected location name.

---

## Current Behavior

- The header always shows "All locations combined" (line 267)
- The "BY LOCATION" table always renders (lines 470-548)
- The component receives `filterContext.locationId` but doesn't use it for conditional rendering
- Sales data is already filtered by location via `useSalesMetrics`, but the location breakdown table always fetches all locations

---

## Proposed Behavior

| Filter Selection | Header Sub-text | "By Location" Table |
|------------------|-----------------|---------------------|
| "All Locations" | "All locations combined" | **Visible** |
| Specific location (e.g., "North Mesa") | "North Mesa" | **Hidden** |

---

## Implementation

### 1. Update AggregateSalesCard Props

The component already receives `filterContext` with `locationId`. We need to:
- Add a mechanism to look up the location name for display
- Use `filterContext.locationId` to determine visibility of the "By Location" section

### 2. Fetch Location Name for Display

Add a simple lookup using the existing `useActiveLocations` hook:

```typescript
const { data: locations } = useActiveLocations();

// Determine if viewing all locations or a specific one
const isAllLocations = !filterContext?.locationId || filterContext.locationId === 'all';
const selectedLocationName = !isAllLocations 
  ? locations?.find(loc => loc.id === filterContext.locationId)?.name 
  : null;
```

### 3. Update Header Sub-text (Line 267)

Change from static text to conditional:

```tsx
// Before
<p className="text-xs text-muted-foreground">All locations combined</p>

// After
<p className="text-xs text-muted-foreground">
  {isAllLocations ? 'All locations combined' : selectedLocationName || 'Loading...'}
</p>
```

### 4. Conditionally Render "By Location" Section (Lines 469-548)

Wrap the entire section in a conditional:

```tsx
{/* By Location Table - only show when viewing all locations */}
{isAllLocations && (
  <div>
    <div className="flex items-center gap-2 mb-4">
      <Building2 className="w-4 h-4 text-muted-foreground" />
      <h3 className="font-display text-xs tracking-wide text-muted-foreground">BY LOCATION</h3>
    </div>
    {/* ... rest of the table ... */}
  </div>
)}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/AggregateSalesCard.tsx` | Add location lookup, update header text, conditionally render "By Location" section |

---

## Technical Details

### Import Addition

```typescript
import { useActiveLocations } from '@/hooks/useLocations';
```

### New Variables (after existing hook calls ~line 132)

```typescript
const { data: locations } = useActiveLocations();

// Location display logic
const isAllLocations = !filterContext?.locationId || filterContext.locationId === 'all';
const selectedLocationName = !isAllLocations 
  ? locations?.find(loc => loc.id === filterContext.locationId)?.name 
  : null;
```

### Header Update (Line 267)

```tsx
<p className="text-xs text-muted-foreground">
  {isAllLocations ? 'All locations combined' : selectedLocationName || 'Loading...'}
</p>
```

### By Location Section (Lines 469-548)

Wrap entire section:

```tsx
{isAllLocations && (
  <div>
    {/* existing content */}
  </div>
)}
```

---

## User Experience

| Action | Result |
|--------|--------|
| Select "All Locations" | Full card with "BY LOCATION" breakdown table visible |
| Select "North Mesa" | Card shows only North Mesa data, header says "North Mesa", table hidden |
| Select "Val Vista Lakes" | Card shows only Val Vista data, header updates, table hidden |

