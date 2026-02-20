
## Hide "Add Break" When a Category Is Selected

### Change

**File:** `src/components/dashboard/schedule/QuickBookingPopover.tsx`

The "Add Break" button currently renders unconditionally at line 1130. Adding a single guard — `!selectedCategory` — will hide it the moment the user drills into a service category, making it clear an appointment is being scheduled.

### Before / After

| State | "Add Break" visible? |
|---|---|
| Category list view (no category selected) | Yes |
| After tapping a category (services list showing) | **No** |
| After going back to categories | Yes again |

### Technical Detail

Wrap the button in a condition on `selectedCategory`:

```tsx
{!selectedCategory && (
  <Button
    variant="outline"
    className="w-full h-9 gap-2"
    onClick={() => setShowBreakForm(true)}
  >
    <Coffee className="h-4 w-4" />
    Add Break
  </Button>
)}
```

This is a one-line guard change at line 1129. No logic, state, or data changes required.
