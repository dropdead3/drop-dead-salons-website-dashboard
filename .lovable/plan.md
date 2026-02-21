

## Enhance Service Add-Ons Configurator

### Overview

Three targeted improvements to the add-on library form and the booking flow's duration calculation, based on your screenshot and feedback.

---

### 1. Embedded Dollar Signs on Currency Inputs

The price and cost fields currently show plain number inputs with no visual indication they represent dollar amounts. We will add a `$` prefix icon inside these inputs using the existing `Input` component pattern (a wrapper div with an absolutely positioned icon and left padding).

**Files:** `ServiceAddonsLibrary.tsx`

---

### 2. Add-On Duration Adds to Total Service Time

Currently, the booking flow calculates `totalDuration` by summing only the selected services' durations. Add-on duration is displayed but never added to the total appointment time.

We will update the `totalDuration` calculation in all three booking components to include accepted add-on durations:
- `QuickBookingPopover.tsx` -- the primary booking path
- `BookingWizard.tsx` -- the walk-in/full wizard path
- `NewBookingSheet.tsx` -- the sheet-based booking path

This ensures that when a stylist adds an Olaplex Treatment (+25 min), the appointment block correctly extends by that duration. The add-on toast already shows the duration; now it will be additive.

**Files:** `QuickBookingPopover.tsx`, `BookingWizard.tsx`, `NewBookingSheet.tsx`

---

### 3. Streamlined Category and Service Assignment from the Library

The current form has a "linked service" picker at the bottom grouped by inferred categories. The user wants a clearer two-step flow: first pick a category (or choose "Entire Category"), then optionally narrow to a specific service.

We will replace the single linked-service picker with a two-step inline selector:

1. **Category dropdown** -- lists all configured service categories from `categories` prop. Includes an "Apply to Entire Category" option that auto-creates a category-level assignment.
2. **Service dropdown** -- appears only when a specific category is selected and user wants to link to a single service. Filtered to services in the chosen category.

This replaces the existing `linked_service_id` picker and also integrates the quick-assign functionality directly into the form, so the user does not need to go to the assignments card for common operations.

**Files:** `ServiceAddonsLibrary.tsx`

---

### Technical Details

| File | Changes |
|------|---------|
| `ServiceAddonsLibrary.tsx` | Wrap price and cost inputs with `$` prefix icon; replace linked-service picker with category-first then service selector; integrate direct category assignment from the form |
| `QuickBookingPopover.tsx` | Add accepted add-on durations to `totalDuration` memo |
| `BookingWizard.tsx` | Add accepted add-on durations to `totalDuration` memo |
| `NewBookingSheet.tsx` | Add accepted add-on durations to `totalDuration` memo |

**No database changes needed.** The `service_addon_assignments` table and `linked_service_id` column already support both category and service-level targeting.

### Sequencing

1. Dollar sign prefixes on price/cost inputs
2. Category-first assignment picker in add-on form
3. Duration additive logic across all booking flows

