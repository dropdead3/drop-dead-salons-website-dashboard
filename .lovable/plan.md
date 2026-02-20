

# Reduce Bottom Padding to Match Reference

## Change
The `pb-28` was too aggressive. Reduce it to `pb-24` (96px) which provides just enough clearance for the floating action bar (~48px height + 16px bottom margin) plus a small visual gap matching the spacing visible in the screenshot between the nav pills and the calendar card.

## Technical Detail

### File: `src/pages/dashboard/Schedule.tsx` (line 471)

```tsx
// Current
pb-28

// New
pb-24
```

Single token change -- `pb-24` gives 96px total, leaving ~32px of visible gap above the action bar, consistent with the reference image spacing.

