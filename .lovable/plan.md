

## Fix Description Text Below Numbers on Simplified Analytics Cards

### Problem
The metric sub-labels ("revenue", "7-day revenue", "bookings", "on track") below the hero numbers have `tracking-wide` applied. Per the design system, wide tracking is a `font-display` (Termina, uppercase) convention. On lowercase `font-sans` (Aeonik Pro) body text, it creates unnatural, spread-out letter spacing that looks off.

### Fix

**File: `src/components/dashboard/PinnedAnalyticsCard.tsx` (line 484)**

Change the metric label styling from:
```
text-[13px] text-muted-foreground mt-1 tracking-wide
```
to:
```
text-xs text-muted-foreground/80 mt-1
```

This:
- Removes `tracking-wide` (wrong for lowercase sans text)
- Uses standard `text-xs` instead of custom `text-[13px]` for consistency with the rest of the system
- Slightly softens the color with `/80` opacity so the label recedes behind the hero metric without disappearing

One line changed, one file.
