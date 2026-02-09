

# Move Location and Date Range Filters to Right Side

## Overview

Relocate the location filter and date range filter from the left side to the right side of the page header on both the Command Center and Analytics Hub pages. This creates a cleaner layout where the page title/description is on the left and the filters are on the right.

## Current State

Both pages currently have filters aligned to the left:
- **Analytics Hub**: Filters are in a flex container with `flex-wrap items-center gap-3` below the header
- **Command Center**: Uses `AnalyticsFilterBar` component with left-aligned filters

## Files to Modify

### 1. `src/components/dashboard/AnalyticsFilterBar.tsx`

Update the container to align filters to the right using `justify-end`:

```typescript
// Line 68 - Change from:
<div className="flex flex-wrap items-center gap-3 mb-6">

// To:
<div className="flex flex-wrap items-center justify-end gap-3 mb-6">
```

### 2. `src/pages/dashboard/admin/AnalyticsHub.tsx`

Restructure the header section to place filters on the right side of the same row as the title:

**Change the header layout (lines 199-303):**

```typescript
{/* Header with filters on the right */}
<div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
  <div>
    <h1 className="text-xl md:text-2xl font-display">ANALYTICS & REPORTS</h1>
    <p className="text-muted-foreground text-sm">Business intelligence and data exports</p>
  </div>
  
  {/* Filters - now on the right */}
  <div className="flex flex-wrap items-center gap-3">
    {/* Location Filter */}
    {showLocationSelector && (
      <Select value={locationId} onValueChange={setLocationId}>
        <SelectTrigger className="w-[200px]">
          <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
          <SelectValue placeholder="Select Location" />
        </SelectTrigger>
        <SelectContent>
          {canViewAggregate && (
            <SelectItem value="all">All Locations</SelectItem>
          )}
          {accessibleLocations.map(loc => (
            <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    )}
    
    {/* Single location badge */}
    {!showLocationSelector && accessibleLocations.length === 1 && (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md text-sm h-9">
        <MapPin className="w-4 h-4 text-muted-foreground" />
        <span>{accessibleLocations[0].name}</span>
      </div>
    )}

    {/* Date Range Select */}
    <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRangeType)}>
      {/* ... existing content ... */}
    </Select>

    {/* Custom Date Picker */}
    {dateRange === 'custom' && (
      <Popover>
        {/* ... existing content ... */}
      </Popover>
    )}
  </div>
</div>
```

## Visual Result

**Before:**
```
┌─────────────────────────────────────────────────────┐
│ ANALYTICS & REPORTS                                 │
│ Business intelligence and data exports              │
│                                                     │
│ [📍 All Locations ▼] [📅 Today ▼]                  │
│                                                     │
│ [Sales] [Operations] [Marketing] [Program] [Reports]│
└─────────────────────────────────────────────────────┘
```

**After:**
```
┌─────────────────────────────────────────────────────┐
│ ANALYTICS & REPORTS          [📍 All Locations ▼]  │
│ Business intelligence...     [📅 Today ▼]          │
│                                                     │
│ [Sales] [Operations] [Marketing] [Program] [Reports]│
└─────────────────────────────────────────────────────┘
```

## Benefits

1. **Better visual hierarchy** - Title and description stand out on the left, actionable filters are grouped on the right
2. **Follows common dashboard patterns** - Most analytics dashboards place filters on the right side of the header
3. **Responsive behavior** - On mobile, filters will stack below the title naturally
4. **Consistent across pages** - Both Command Center and Analytics Hub will have the same filter positioning

