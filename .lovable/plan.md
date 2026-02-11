

# Show "Did Not Rebook" Count in After-Service Rebook Section

A small UI addition to the existing After-Service Rebook section showing how many returning clients did **not** rebook after their service today.

## Change

**File: `src/components/dashboard/NewBookingsCard.tsx`**

Update the rebook summary line from:

> "7 of 9 rebooked"

To:

> "7 of 9 rebooked · 2 did not"

No hook changes needed -- the "did not rebook" count is simply `returningServicedToday - rebookedAtCheckoutToday`, already available from the existing data.

## Technical Detail

In the rebook rate section, update the summary `<span>` to append the not-rebooked count in a slightly muted/red-tinted style to draw attention without alarm. Example:

```text
{rebookedAtCheckoutToday} of {returningServicedToday} rebooked · {notRebooked} did not
```

Where `notRebooked = returningServicedToday - rebookedAtCheckoutToday`. The "did not" portion uses a subtle `text-red-400` to differentiate it visually.

