
# Make Operating Hours Non-Editable with Link to Settings

## Overview
Transform the "Operating Hours × Stylists" row from editable inputs to read-only display values, with explanatory text indicating the data source and a link to edit location settings.

## Changes Required

### File: `src/components/dashboard/analytics/CapacityBreakdown.tsx`

#### 1. Add Link Import
Add `Link` from react-router-dom and `Settings` icon from lucide-react for the edit link.

#### 2. Remove Editable State for Hours/Stylists
Remove the `useState` and `useEffect` for `grossHours` and `stylistCount` since these will now be read-only. Keep them as direct props.

#### 3. Update hasChanges Logic
Remove `grossHours` and `stylistCount` from the change detection since they're no longer editable.

#### 4. Update handleReset Function
Remove `grossHours` and `stylistCount` from the reset function.

#### 5. Replace Operating Hours Row
Transform the editable inputs row into a read-only display with:
- Static display values (not input fields)
- Subtitle text: "From your location settings"
- A small "Edit" link/button that navigates to `/dashboard/admin/settings?category=locations`

### Visual Design

**Current (editable):**
```
Operating Hours × Stylists    [8] h × [20] = 160h
```

**New (read-only with link):**
```
Operating Hours × Stylists              8h × 20 = 160h
From your location settings    [Edit Settings →]
```

## Technical Details

### Updated Operating Hours Row JSX:
```tsx
{/* Operating Hours × Stylists - Read Only */}
<div className="space-y-1">
  <div className="grid grid-cols-[1fr,auto] items-center gap-4">
    <span className="text-muted-foreground">Operating Hours × Stylists</span>
    <div className="flex items-center gap-2">
      <span className="tabular-nums text-sm">{initialGrossHours}h</span>
      <span className="text-muted-foreground text-xs">×</span>
      <span className="tabular-nums text-sm">{initialStylistCount}</span>
      <span className="text-muted-foreground text-xs">=</span>
      <span className="font-semibold tabular-nums w-14 text-right">{grossHoursPerDay}h</span>
    </div>
  </div>
  <div className="flex items-center justify-between">
    <span className="text-xs text-muted-foreground/70">
      From your location settings
    </span>
    <Link 
      to="/dashboard/admin/settings?category=locations"
      className="text-xs text-primary hover:underline flex items-center gap-1"
    >
      Edit Settings
      <Settings className="w-3 h-3" />
    </Link>
  </div>
</div>
```

### State Cleanup:
- Remove: `const [grossHours, setGrossHours] = useState(initialGrossHours);`
- Remove: `const [stylistCount, setStylistCount] = useState(initialStylistCount);`
- Update calculations to use `initialGrossHours` and `initialStylistCount` directly
- Simplify `hasChanges` to only track break, lunch, and padding values

## Result
The calculator will show operating hours and stylist count as read-only values sourced from location settings, with a clear link to navigate to the settings page to edit them. Users can still adjust breaks, lunch, and padding for scenario planning.
