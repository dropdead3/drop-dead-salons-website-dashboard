

# Dynamic Filter Descriptions for Forecasting Card

## Overview

Update the CardDescription text in the Forecasting card to dynamically change based on the selected period filter, providing context-specific explanations for each view.

---

## File to Modify

**`src/components/dashboard/sales/ForecastingCard.tsx`**

---

## Implementation

### 1. Add Description Labels Mapping (after line 55)

Add a new constant mapping period to description text:

```tsx
const PERIOD_DESCRIPTIONS: Record<ForecastPeriod, string> = {
  'tomorrow': 'Projected revenue from scheduled appointments occurring tomorrow',
  'todayToEom': 'Projected revenue from scheduled appointments through end of month',
  '7days': 'Projected revenue from scheduled appointments over the next 7 days',
  '30days': 'Projected revenue from scheduled appointments over the next 30 days',
  '60days': 'Projected revenue from scheduled appointments over the next 60 days',
};
```

### 2. Update CardDescription (line 394)

Replace the static description:

**Current:**
```tsx
<CardDescription>Projected revenue from scheduled appointments</CardDescription>
```

**Updated:**
```tsx
<CardDescription>{PERIOD_DESCRIPTIONS[period]}</CardDescription>
```

---

## Result

| Filter Selected | Description Displayed |
|-----------------|----------------------|
| Tomorrow | "Projected revenue from scheduled appointments occurring tomorrow" |
| EOM | "Projected revenue from scheduled appointments through end of month" |
| 7 Days | "Projected revenue from scheduled appointments over the next 7 days" |
| 30 Days | "Projected revenue from scheduled appointments over the next 30 days" |
| 60 Days | "Projected revenue from scheduled appointments over the next 60 days" |

The description text will update immediately when users toggle between different forecast periods, providing clear context for the data being displayed.

