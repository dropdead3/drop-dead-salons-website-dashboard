

# Widen Location Filter in Forecasting Card

## The Issue

The location dropdown in the Forecasting card has a fixed width of `180px`, which is too narrow to display longer location names like "North Mesa" with the city/state suffix (e.g., "Mesa, AZ"). This causes the text to wrap awkwardly.

## Solution

Increase the width of the `LocationSelect` trigger to accommodate typical location names plus their city/state identifiers.

## File to Modify

### `src/components/dashboard/sales/ForecastingCard.tsx`

**Line 466** - Update the `triggerClassName` from `w-[180px]` to `w-[220px]`:

```typescript
// Before:
triggerClassName="h-8 w-[180px] text-xs"

// After:
triggerClassName="h-8 w-[220px] text-xs"
```

This provides an additional 40px of width, which should comfortably fit location names like "North Mesa" along with the "Mesa, AZ" suffix without wrapping.

## Alternative Consideration

If you'd prefer the width to adapt automatically to the content, we could use `min-w-[180px] w-auto` instead, which would make the trigger grow based on the selected location name while maintaining a minimum width.

