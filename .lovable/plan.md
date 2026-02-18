

## Fix: Use Pattern-Based Categorization Instead of Empty DB Column

### Root Cause

The `phorest_appointments` table has a `service_category` column, but it is `NULL` for all 440+ rows. The `useServiceCostsProfits` hook uses `appt.service_category || 'Other'`, so every service falls into "Other."

The project already has a robust pattern-matching utility at `src/utils/serviceCategorization.ts` that maps service names to categories (Blonding, Color, Haircut, Extensions, Styling, Extras, New Client Consultation, Other) using regex patterns. It is simply not wired into this hook.

### Fix

**File: `src/hooks/useServiceCostsProfits.ts`**

1. Import `getServiceCategory` from `@/utils/serviceCategorization`
2. Replace the line that reads the category from the database column:

```
// Before
serviceCategory: appt.service_category || 'Other',

// After
serviceCategory: getServiceCategory(appt.service_name),
```

This is a one-line logic change plus one import. No other files need modification. The category view in the card will immediately reflect proper groupings (Blonding, Color, Haircut, etc.) based on the service name patterns.

