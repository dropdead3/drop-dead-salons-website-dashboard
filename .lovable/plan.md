
# Make Kiosk Preview Fill the Card Responsively

## Problem
The tablet preview inside the Live Preview card has hardcoded `max-w` constraints (`560px` landscape / `420px` portrait) that prevent it from filling the available card space. The preview should expand to use all available width.

## Change

**File: `src/components/dashboard/settings/KioskPreviewPanel.tsx` (line 604-607)**

Remove the fixed `max-w` constraints and instead let the tablet frame fill the card width with a reasonable upper bound:

```
Before:
  <div className={cn(
    "relative mx-auto",
    settings.display_orientation === 'landscape' ? "max-w-[560px]" : "max-w-[420px]"
  )}>

After:
  <div className={cn(
    "relative mx-auto w-full",
    settings.display_orientation === 'landscape' ? "max-w-full" : "max-w-[75%]"
  )}>
```

- **Landscape**: `max-w-full` -- the tablet fills the entire card width, the `aspect-[4/3]` ratio on the screen keeps proportions correct.
- **Portrait**: `max-w-[75%]` -- portrait is narrower by nature, so capping at 75% of the card width keeps it visually balanced while still being much larger than the old 420px cap. On wide screens this will be substantially bigger; on narrower panels it scales down naturally.

This is a single 3-line edit. The aspect ratios already handle height proportionally, so the preview will scale responsively with the card width.
