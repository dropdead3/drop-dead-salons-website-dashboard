

# Stylist Drill-Down on New Bookings Card

## Concept

Clicking the "New Clients" or "Returning Clients" number tiles opens a premium center-screen Dialog (matching the Zura AI insight pattern) that shows which stylists booked those clients, along with their individual new-client booking rate or returning-client rebook rate.

## UX Layout

```text
+---------------------------------------------+
|  [X]                                         |
|  NEW CLIENT BOOKINGS         Yesterday       |
|                                              |
|  +-----------------------------------------+ |
|  |  [Avatar] Sarah M.                      | |
|  |  Level 3 Stylist                        | |
|  |  4 new clients · 28% of new bookings   | |
|  |  ============================  (bar)    | |
|  +-----------------------------------------+ |
|                                              |
|  +-----------------------------------------+ |
|  |  [Avatar] Jamie L.                      | |
|  |  Level 2 Stylist                        | |
|  |  2 new clients · 14% of new bookings   | |
|  |  ================  (bar)               | |
|  +-----------------------------------------+ |
|                                              |
|  ...                                         |
+---------------------------------------------+
```

For the "Returning Clients" variant, the secondary metric changes to the stylist's rebook rate (e.g., "3 of 5 rebooked -- 60%").

## Implementation

### 1. Extend the data hook (`src/hooks/useNewBookings.ts`)

Add `phorest_staff_id` to the appointments select query. In the return object, add two new fields:

- `newClientsByStaff`: Array of `{ phorestStaffId, count }` -- group new-client appointments by staff
- `returningClientsByStaff`: Array of `{ phorestStaffId, uniqueClients, rebookedCount, rebookRate }` -- group returning-client appointments by staff, with per-stylist rebook calculation

Staff name resolution will use `phorest_staff_mapping` joined to `employee_profiles` (same pattern as `useStaffKPIReport`).

### 2. Create drill-down dialog component

**New file**: `src/components/dashboard/NewBookingsDrilldown.tsx`

- Uses the premium Dialog pattern (backdrop-blur-sm, bg-black/60 overlay, max-w-lg)
- Two modes: `'new'` and `'returning'`, toggled by which tile was clicked
- Each stylist row: Avatar (from employee photo or initials fallback), name, level badge, metric, and a subtle progress bar showing their share
- Sorted by count descending (top contributor first)
- Scrollable content area (max 70vh)

### 3. Update `NewBookingsCard.tsx`

- Make the "New Clients" and "Returning Clients" tiles clickable (cursor-pointer, subtle hover lift)
- Add state for which drill-down is open (`'new' | 'returning' | null`)
- Render the `NewBookingsDrilldown` dialog conditionally

### 4. Data flow

The hook already fetches all appointments in the range with client IDs. Adding `phorest_staff_id` to the select is trivial. Staff-level aggregation happens client-side:

- **New Clients tab**: Group appointments where `phorest_client_id` is in `newClientPhorestIds` by `phorest_staff_id`. Count per stylist. Show each stylist's share of total new-client bookings.
- **Returning Clients tab**: Group returning-client appointments by `phorest_staff_id`. For each stylist, count unique returning clients and how many of those have a future appointment (rebook rate per stylist). This reuses the existing future-appointment lookup data.

### 5. Styling details

- Follows the "Drop Dead Premium" aesthetic: `font-display` for numbers, `font-medium` max weight, `shadow-2xl rounded-2xl` cards
- Avatar uses `ZuraAvatar`-style fallback (initials on `bg-primary/10`) when no photo exists
- Progress bars use the same emerald/amber/red color coding as the main rebook rate bar
- Empty state: "No [new/returning] clients in this period" with editorial spacing

