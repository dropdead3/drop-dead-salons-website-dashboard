

## Fix Missing Filter Badges on Retail Attachment Cards

Both newly created cards ("Retail Pairing Strength" in Services and "Service-Driven Retail" in Retail) violate the established card header layout rule: every analytics card must use a two-column `justify-between` header with the `AnalyticsFilterBadge` in the right column.

### Changes

**File 1: `src/components/dashboard/analytics/ServicesContent.tsx` (~line 1011)**

Change the header `div` from single-column to two-column layout:

- Current: `<div className="flex items-center gap-3">`
- Fixed: `<div className="flex items-center justify-between">`

Wrap the icon + title in a left-column `div`, and add the `AnalyticsFilterBadge` as the right column:

```
<div className="flex items-center justify-between">
  <div className="flex items-center gap-3">
    [icon container + title block -- unchanged]
  </div>
  <AnalyticsFilterBadge locationId={...} dateRange={...} />
</div>
```

**File 2: `src/components/dashboard/analytics/RetailAnalyticsContent.tsx` (~line 624)**

Same structural fix -- change `flex items-center gap-3` to `flex items-center justify-between`, nest existing content in a left-column wrapper, and add `AnalyticsFilterBadge` to the right.

### No Other Changes

The card content, data hooks, and all other layout remain untouched. This is purely a header structure fix to comply with the documented card header design rules.
