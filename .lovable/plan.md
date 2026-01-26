
# Add Styling & Photography Padding Option

## Overview
Add a new "Styling & Photography" section to the capacity calculator that lets users input:
1. Minutes added per appointment for styling/photography
2. Percentage of appointments that get styled and photographed

The system will calculate the effective capacity impact based on both values.

## Changes Required

### File: `src/components/dashboard/analytics/CapacityBreakdown.tsx`

#### 1. Add New State Variables
```tsx
const [stylingMinutes, setStylingMinutes] = useState(0);
const [stylingPercentage, setStylingPercentage] = useState(25); // Default 25% of appointments
```

#### 2. Add to hasChanges and handleReset
Include the new styling values in change detection and reset functionality.

#### 3. Calculate Styling Impact
```tsx
// Weighted impact: (styling minutes × percentage of appts) / avg appointment time
const stylingImpact = stylingMinutes > 0 && stylingPercentage > 0
  ? Math.round(((stylingMinutes * (stylingPercentage / 100)) / avgAppointmentMinutes) * 100)
  : 0;
```

#### 4. Add New UI Section (after Appointment Padding)
New section with:
- "Styling & Photography" label
- Input for minutes (0-60 min range)
- Input for percentage of appointments (0-100%)
- Info callout showing combined capacity impact

### Visual Design

```text
Styling & Photography
  Duration:    [15] min     Appointments:    [25] %
  
  ℹ If 25% of appointments include 15 min of styling/photography,
    this reduces effective capacity by ~4%.
```

## Technical Details

### New State & Effects:
```tsx
const [stylingMinutes, setStylingMinutes] = useState(0);
const [stylingPercentage, setStylingPercentage] = useState(25);

// In useEffect - reset on prop changes
// (styling has no initial prop, so no reset needed from props)

// Updated hasChanges
const hasChanges = 
  breakMinutes !== initialBreakMinutes ||
  lunchMinutes !== initialLunchMinutes ||
  paddingMinutes !== initialPaddingMinutes ||
  stylingMinutes !== 0 ||
  stylingPercentage !== 25;

// Updated handleReset
const handleReset = () => {
  setBreakMinutes(initialBreakMinutes);
  setLunchMinutes(initialLunchMinutes);
  setPaddingMinutes(initialPaddingMinutes);
  setStylingMinutes(0);
  setStylingPercentage(25);
};
```

### New UI Section JSX:
```tsx
{/* Styling & Photography section */}
<div className="pt-3 border-t border-border/50 space-y-3">
  <div className="grid grid-cols-[1fr,auto] items-center gap-4">
    <span className="text-muted-foreground">Styling & Photography</span>
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        <Input
          type="number"
          min={0}
          max={60}
          value={stylingMinutes}
          onChange={(e) => setStylingMinutes(Math.max(0, Math.min(60, Number(e.target.value) || 0)))}
          className="w-16 h-8 text-sm text-center tabular-nums bg-background"
        />
        <span className="text-muted-foreground text-xs">min</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Input
          type="number"
          min={0}
          max={100}
          value={stylingPercentage}
          onChange={(e) => setStylingPercentage(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
          className="w-16 h-8 text-sm text-center tabular-nums bg-background"
        />
        <span className="text-muted-foreground text-xs">%</span>
      </div>
    </div>
  </div>
  {stylingMinutes > 0 && stylingPercentage > 0 && (
    <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2.5">
      <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary/70" />
      <span>
        If {stylingPercentage}% of appointments include {stylingMinutes} min of styling/photography,
        this reduces effective capacity by ~{stylingImpact}%.
      </span>
    </div>
  )}
</div>
```

## Result
Users can model the capacity impact of styling and photography time by specifying both the duration and the percentage of appointments that include this service. The calculator will show the weighted impact on overall capacity.
