

## Add "Add-Ons" as a Bookable Category

### What This Solves

Currently, add-ons only surface as toast recommendations after selecting a service category. Sometimes a client comes in specifically for an add-on (e.g., just an Olaplex Treatment), and the stylist has no easy way to book it as the primary service. This adds a dedicated "Add-Ons" category to the booking wizard's category list.

### How It Works

When a user opens the booking popover and sees the category list (Blonding, Color, Haircuts, etc.), an "Add-Ons" category will appear at the bottom of the list. Tapping it shows all active add-ons from the organization's library as selectable "services" -- each with its name, price, and duration. Selecting one adds it to the booking just like any other service, with its duration contributing to total appointment time.

This requires no database changes. The add-on data already exists in the `service_addons` table; we just need to surface it as a virtual category in the booking UI.

---

### Technical Details

**File: `src/components/dashboard/schedule/QuickBookingPopover.tsx`**

1. Import `useServiceAddons` hook to fetch the organization's active add-ons
2. After the real categories render in the category list (around line 1058-1093), append a synthetic "Add-Ons" category button with a distinctive icon (Sparkles)
3. When "Add-Ons" is selected as the category, render the add-on library items as service-like rows instead of the normal `servicesByCategory[category]` list
4. When an add-on is toggled, create a virtual service entry that gets tracked in `selectedServices` (using the add-on's ID prefixed with `addon:` to distinguish from real Phorest services)
5. Update `selectedServiceDetails` and `totalDuration`/`totalPrice` memos to include selected add-ons (looking them up from the add-ons list when the ID starts with `addon:`)
6. Update the confirm step and `handleBook` to handle add-on entries -- they get written as appointment line items with the add-on name, price, and duration

**File: `src/hooks/usePhorestServices.ts`**

No changes needed -- the virtual category is injected at the UI layer, not in the service data.

| Area | Detail |
|------|--------|
| Category list | New "Add-Ons" entry at the bottom with Sparkles icon and a count badge if any are selected |
| Service list | When "Add-Ons" category is active, show add-ons from `useServiceAddons` with name, price, duration, and toggle checkboxes |
| Duration/Price | Selected add-ons contribute to `totalDuration` and `totalPrice` totals |
| Booking creation | Add-on selections are included as service line items in the appointment with `service_category: 'Add-Ons'` |
| No DB migration | Uses existing `service_addons` table data |

### Sequencing

1. Wire up `useServiceAddons` in the booking popover
2. Add the virtual "Add-Ons" category button to the category list
3. Render add-on items when that category is selected
4. Update duration/price calculations to include add-on selections
5. Update booking submission to include add-on line items
