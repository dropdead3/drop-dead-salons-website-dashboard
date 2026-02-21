
## Show Full Address in Scheduling Wizard Location Step

### What Changes
In the QuickBookingPopover's "Select Location" step, the subtitle under each location name currently only shows the city (e.g., "Mesa, AZ 85203"). We will update it to show the full street address followed by the city.

**Example:**
- Before: "Mesa, AZ 85203"
- After: "1234 E Main St, Mesa, AZ 85203"

### Technical Detail

**File: `src/components/dashboard/schedule/QuickBookingPopover.tsx`** (line 1263)

Change:
```tsx
<div className="text-xs text-muted-foreground mt-0.5">{loc.city}</div>
```
To:
```tsx
<div className="text-xs text-muted-foreground mt-0.5">
  {[loc.address, loc.city].filter(Boolean).join(', ')}
</div>
```

This concatenates the `address` and `city` fields with a comma separator, gracefully handling cases where either might be empty.

One file, one line changed.
