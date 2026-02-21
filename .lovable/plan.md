

## Build Stylist & Service Visibility Card (Website Booking Tab)

### What You Get

The "Coming Soon" placeholder on the Website Settings > Booking tab gets replaced with a fully functional **Stylist & Service Visibility** card. This gives admins a single view to control what appears on the public booking widget -- without needing to navigate to individual stylist profiles or service editors.

### Two Panels in One Card

**Panel 1 -- Stylists on Booking Widget**
- List of all service-provider stylists (same role filter as the configurator: stylist, stylist_assistant, booth_renter)
- Each row shows avatar, name, location, and an **"Accepting Bookings"** toggle (wired to `employee_profiles.is_booking`)
- Location filter dropdown to narrow the list
- Count badge showing "X of Y visible"

**Panel 2 -- Services on Booking Widget**
- Collapsible category accordions showing all active services
- Each service row has a **"Bookable Online"** toggle (wired to `services.bookable_online`)
- Category-level "select all / deselect all" checkbox
- Count badge per category showing "X of Y online"

### How It Connects to Existing Systems

This card reads and writes the same fields that already power the booking widget:
- `employee_profiles.is_booking` -- already checked by the homepage stylist cards and booking flows
- `services.bookable_online` -- already filtered by `useBookingSystem.useServices()` and `usePublicServicesForWebsite`

No new database columns or tables needed. This is purely a UI surface for existing data.

### Relationship to Staff Service Configurator

The Staff Service Configurator (on the Services settings page) controls **which services a stylist is qualified to perform**. This Visibility card controls **whether a stylist or service appears on the public booking page at all**. They are complementary:
- A stylist must be "Accepting Bookings" (visibility) AND qualified for a service (configurator) to be bookable for that service online
- A service must be "Bookable Online" (visibility) AND assigned to the stylist (configurator) to show up

### Technical Plan

**File: `src/components/dashboard/settings/BookingVisibilityCard.tsx` (new)**

Create a new component with two tabbed panels:

1. **Stylists panel**: Uses `useActiveStylists` (from `useStaffServiceConfigurator`) for the filtered list. Renders each stylist as a row with a Switch toggling `is_booking` via a mutation on `employee_profiles`.

2. **Services panel**: Uses the existing services/categories data pattern (same as `ServicesSettingsContent`). Renders category accordions with individual service toggles for `bookable_online`, using `useNativeServicesForWebsite.useToggleBookableOnline` or a direct mutation.

Both panels include:
- Location filter dropdown
- Count badges
- Undo toast on every toggle

**File: `src/components/dashboard/settings/WebsiteSettingsContent.tsx` (update)**

- Replace the Coming Soon stub (lines 714-730) with the new `BookingVisibilityCard`
- Pass `organizationId` from the parent context
- The BookingTab function will import and render the new component

### Gap Analysis

| Area | Finding | Action |
|------|---------|--------|
| **No centralized visibility controls** | Admins had to edit each stylist profile individually | Fixed: bulk toggle view |
| **No service bookable_online bulk toggle** | Had to open each service editor dialog | Fixed: inline toggles with category-level bulk |
| **No location scoping for visibility** | Couldn't see "who's bookable at Location X" | Fixed: location filter |
| **No count indicators** | No way to see at-a-glance how many are visible | Fixed: count badges |
| **Booking widget doesn't filter `is_booking`** | `useBookingSystem.useServices` filters `bookable_online` but staff selection may not filter `is_booking` | Future: verify booking wizard respects `is_booking` flag |
| **No "hide entire category" from booking** | Can only hide individual services | Future enhancement: category-level online visibility |

### Files Changed

| File | Change |
|------|--------|
| `src/components/dashboard/settings/BookingVisibilityCard.tsx` | New component with Stylists + Services visibility panels |
| `src/components/dashboard/settings/WebsiteSettingsContent.tsx` | Replace Coming Soon stub with new card |

