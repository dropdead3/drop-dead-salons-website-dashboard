

# Enlarge Service Summary Footer in Booking Popover

## What Changes

Increase the size of the service summary section that appears at the bottom of the booking popover across all steps. This affects four repeated footer blocks in `QuickBookingPopover.tsx`.

## Specific Size Increases

| Element | Current | New |
|---|---|---|
| Summary row text | `text-xs` (12px) | `text-sm` (14px) |
| Service count badge ("2 services") | `text-[10px] px-2 py-0` | `text-xs px-2.5 py-0.5` |
| Duration text ("75m") | `text-muted-foreground` (inherits text-xs) | `text-sm text-muted-foreground` |
| Total price ("$75") | `font-medium` (inherits text-xs) | `text-base font-semibold` |
| Service name badges ("Combo Cut x") | `text-[10px] px-1.5 py-0` | `text-xs px-2 py-0.5` |
| X icon on badges | `h-2.5 w-2.5` | `h-3 w-3` |
| Badge gap | `gap-1` | `gap-1.5` |

## Files Modified

**`src/components/dashboard/schedule/QuickBookingPopover.tsx`** -- Update four identical footer summary blocks:
1. Service step footer (~line 1084)
2. Location/client step footer (~line 1162)
3. Stylist step footer (~line 1302)
4. One additional instance

Each block gets the same size bump to keep all steps visually consistent.

## Technical Notes

- No new components or dependencies
- Pure className changes across 4 repeated footer sections
- The `pr-0.5` on service badges adjusts to `pr-1` to keep the X icon spacing balanced at the larger size
