

## Replace Red Dot with Critical Badge

### What Changes

Replace the colored status dot next to the location name with a proper styled badge (matching the existing badge patterns in the codebase). Each status gets its own badge: "Critical" (red), "Slowing" (amber), "Healthy" (green).

### Visual Result

**Before:**
```text
[red dot]  NORTH MESA                              v
Critical · 0 next 14d vs 13 trailing
```

**After:**
```text
NORTH MESA   [Critical]                            v
0 next 14d vs 13 trailing
```

The badge uses the same styling as the pipeline badges in `NewBookingsCard` -- a small pill with a colored dot and text label, using the `chip` class already defined in `STATUS_CONFIG`.

### File to Modify

**`src/components/dashboard/analytics/BookingPipelineContent.tsx`**

1. **Remove** the `div` with the colored dot (line 264)
2. **Add** a styled badge next to the location name using the existing `config.chip` classes -- matching the pattern: `inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border border-border/30`
3. **Remove** the `{loc.label} ·` prefix from the detail line (line 272) since the status is now shown in the badge

### Technical Detail

The `STATUS_CONFIG` already has a `chip` property for each status with appropriate background/text colors. The badge markup:

```tsx
<span className={cn(
  'inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border border-border/30',
  config.chip
)}>
  {loc.label}
</span>
```

This sits alongside the location name in the header row's left cluster.
