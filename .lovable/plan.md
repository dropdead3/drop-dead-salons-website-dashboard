

## Update Live Session Indicator Copy

Change the pill text from `"18 In Session"` to `"13 Stylists servicing 18 appointments now"` format.

### Change

**`src/components/dashboard/LiveSessionIndicator.tsx`** (line 74-76)

Update the count text span from:
```
{inSessionCount} In Session
```
to:
```
{activeStylistCount} Stylists servicing {inSessionCount} appointments now
```

This uses the two values already available in the component (`activeStylistCount` and `inSessionCount`). No new data or logic needed.

The tooltip already shows both counts, so no tooltip changes required.

One file, one line change.
